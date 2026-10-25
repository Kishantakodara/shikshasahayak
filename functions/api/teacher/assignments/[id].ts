import { jsonResponse, errorResponse } from "../../../lib/json";
import { getAuthenticatedUser } from "../../../lib/auth";

/**
 * GET /api/teacher/assignments/:id
 * Get a single assignment with full details including questions and submissions stats
 * 
 * Requirements: 5.2
 */
export async function onRequestGet(context: {
  env: { PADHAKU_CORE_DB?: D1Database; ASSESSMENT_DB: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const assignmentId = params.id;

  try {
    // Authenticate user
    const user = await getAuthenticatedUser(request, env);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    // Check if user has teacher role
    if (user.role !== 'teacher') {
      return errorResponse("Forbidden: Teacher access required", 403);
    }

    // Fetch assignment with class details
    const assignment = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare(
        `SELECT 
          a.*,
          c.name as class_name,
          c.section as class_section,
          c.teacher_id as class_teacher_id
         FROM assignments a
         JOIN classes c ON a.class_id = c.id
         WHERE a.id = ?`
      )
      .bind(assignmentId)
      .first();

    if (!assignment) {
      return errorResponse("Assignment not found", 404);
    }

    // Verify teacher owns the class
    if (assignment.class_teacher_id !== user.uid) {
      return errorResponse("Forbidden: You can only view assignments from your own classes", 403);
    }

    // Fetch questions
    const questions = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare(
        `SELECT * FROM assignment_questions 
         WHERE assignment_id = ? 
         ORDER BY question_number`
      )
      .bind(assignmentId)
      .all();

    // Fetch submission statistics
    const submissionStats = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare(
        `SELECT 
          COUNT(*) as total_submissions,
          SUM(CASE WHEN status IN ('SUBMITTED', 'LATE_SUBMITTED', 'GRADED', 'RETURNED') THEN 1 ELSE 0 END) as submitted_count,
          SUM(CASE WHEN status = 'GRADED' THEN 1 ELSE 0 END) as graded_count,
          SUM(CASE WHEN is_late = 1 THEN 1 ELSE 0 END) as late_submissions,
          AVG(CASE WHEN marks IS NOT NULL THEN marks ELSE NULL END) as average_marks,
          MIN(CASE WHEN marks IS NOT NULL THEN marks ELSE NULL END) as min_marks,
          MAX(CASE WHEN marks IS NOT NULL THEN marks ELSE NULL END) as max_marks
         FROM assignment_submissions 
         WHERE assignment_id = ?`
      )
      .bind(assignmentId)
      .first();

    // Parse JSON fields
    const assignmentData = {
      ...assignment,
      allowed_file_types: assignment.allowed_file_types ? JSON.parse(assignment.allowed_file_types) : null,
      rubric: assignment.rubric ? JSON.parse(assignment.rubric) : null,
      attachments: assignment.attachments ? JSON.parse(assignment.attachments) : null,
      questions: (questions.results || []).map((q: any) => ({
        ...q,
        options: q.options ? JSON.parse(q.options) : null
      })),
      stats: submissionStats || {
        total_submissions: 0,
        submitted_count: 0,
        graded_count: 0,
        late_submissions: 0,
        average_marks: null,
        min_marks: null,
        max_marks: null
      }
    };

    return jsonResponse(assignmentData);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("GET /api/teacher/assignments/:id error:", message);
    return errorResponse(message, 500);
  }
}

/**
 * PUT /api/teacher/assignments/:id
 * Update an existing assignment
 * 
 * Body: Same as POST /assignments, all fields optional except constraints
 * 
 * Requirements: 5.4, 5.5
 */
export async function onRequestPut(context: {
  env: { PADHAKU_CORE_DB?: D1Database; ASSESSMENT_DB: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const assignmentId = params.id;

  try {
    // Authenticate user
    const user = await getAuthenticatedUser(request, env);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    // Check if user has teacher role
    if (user.role !== 'teacher') {
      return errorResponse("Forbidden: Teacher access required", 403);
    }

    // Fetch existing assignment
    const existingAssignment = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare(
        `SELECT 
          a.*,
          c.teacher_id as class_teacher_id
         FROM assignments a
         JOIN classes c ON a.class_id = c.id
         WHERE a.id = ?`
      )
      .bind(assignmentId)
      .first();

    if (!existingAssignment) {
      return errorResponse("Assignment not found", 404);
    }

    // Verify teacher owns the assignment
    if (existingAssignment.class_teacher_id !== user.uid) {
      return errorResponse("Forbidden: You can only update your own assignments", 403);
    }

    const body: any = await request.json();
    const {
      title,
      description,
      instructions,
      total_marks,
      due_date,
      allow_late_submission,
      late_penalty_percent,
      max_file_size_mb,
      allowed_file_types,
      rubric,
      attachments,
      questions
    } = body;

    // Validate updated fields
    if (total_marks !== undefined && total_marks <= 0) {
      return errorResponse("total_marks must be greater than 0", 400);
    }

    if (late_penalty_percent !== undefined && (late_penalty_percent < 0 || late_penalty_percent > 100)) {
      return errorResponse("late_penalty_percent must be between 0 and 100", 400);
    }

    if (due_date !== undefined) {
      const dueDateTime = new Date(due_date);
      if (isNaN(dueDateTime.getTime())) {
        return errorResponse("Invalid due_date format. Use ISO date string", 400);
      }
    }

    // Check if assignment is already graded - restrict updates
    const submissionCount = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare("SELECT COUNT(*) as count FROM assignment_submissions WHERE assignment_id = ? AND status = 'GRADED'")
      .bind(assignmentId)
      .first();

    const hasGradedSubmissions = (submissionCount?.count || 0) > 0;

    if (hasGradedSubmissions) {
      // Only allow limited updates if already graded
      const restrictedFields = ['total_marks', 'questions'];
      const providedRestrictedFields = restrictedFields.filter(field => body[field] !== undefined);
      
      if (providedRestrictedFields.length > 0) {
        return errorResponse(
          `Cannot update ${providedRestrictedFields.join(', ')} after submissions have been graded`, 
          400
        );
      }
    }

    // Build UPDATE query dynamically
    const updates: string[] = [];
    const params_bind: any[] = [];

    if (title !== undefined) {
      if (!title || title.trim().length === 0 || title.length > 300) {
        return errorResponse("title must be between 1 and 300 characters", 400);
      }
      updates.push("title = ?");
      params_bind.push(title.trim());
    }

    if (description !== undefined) {
      updates.push("description = ?");
      params_bind.push(description || null);
    }

    if (instructions !== undefined) {
      updates.push("instructions = ?");
      params_bind.push(instructions || null);
    }

    if (total_marks !== undefined) {
      updates.push("total_marks = ?");
      params_bind.push(total_marks);
    }

    if (due_date !== undefined) {
      updates.push("due_date = ?");
      params_bind.push(due_date);
    }

    if (allow_late_submission !== undefined) {
      updates.push("allow_late_submission = ?");
      params_bind.push(allow_late_submission ? 1 : 0);
    }

    if (late_penalty_percent !== undefined) {
      updates.push("late_penalty_percent = ?");
      params_bind.push(late_penalty_percent);
    }

    if (max_file_size_mb !== undefined) {
      updates.push("max_file_size_mb = ?");
      params_bind.push(max_file_size_mb);
    }

    if (allowed_file_types !== undefined) {
      updates.push("allowed_file_types = ?");
      params_bind.push(allowed_file_types ? JSON.stringify(allowed_file_types) : null);
    }

    if (rubric !== undefined) {
      updates.push("rubric = ?");
      params_bind.push(rubric ? JSON.stringify(rubric) : null);
    }

    if (attachments !== undefined) {
      updates.push("attachments = ?");
      params_bind.push(attachments ? JSON.stringify(attachments) : null);
    }

    if (updates.length === 0 && !questions) {
      return errorResponse("No fields to update", 400);
    }

    // Update assignment if there are field updates
    if (updates.length > 0) {
      updates.push("updated_at = CURRENT_TIMESTAMP");
      params_bind.push(assignmentId);

      const result = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
        .prepare(
          `UPDATE assignments 
           SET ${updates.join(", ")}
           WHERE id = ?`
        )
        .bind(...params_bind)
        .run();

      if (!result.success) {
        return errorResponse("Failed to update assignment", 500);
      }
    }

    // Update questions if provided and not restricted
    if (questions !== undefined && !hasGradedSubmissions) {
      // Delete existing questions
      await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
        .prepare("DELETE FROM assignment_questions WHERE assignment_id = ?")
        .bind(assignmentId)
        .run();

      // Create new questions
      if (questions.length > 0) {
        const now_iso = new Date().toISOString();
        
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          
          // Validate question
          if (!q.question_text || !q.question_type || !q.max_marks) {
            return errorResponse(`Question ${i + 1}: missing required fields (question_text, question_type, max_marks)`, 400);
          }
          
          const validTypes = ['MCQ', 'SHORT_ANSWER', 'LONG_ANSWER', 'FILE_UPLOAD', 'CODE'];
          if (!validTypes.includes(q.question_type)) {
            return errorResponse(`Question ${i + 1}: invalid question_type. Must be one of: ${validTypes.join(', ')}`, 400);
          }

          if (q.max_marks <= 0) {
            return errorResponse(`Question ${i + 1}: max_marks must be greater than 0`, 400);
          }

          if (q.question_type === 'MCQ') {
            if (!Array.isArray(q.options) || q.options.length < 2) {
              return errorResponse(`Question ${i + 1}: MCQ questions must have at least 2 options`, 400);
            }
          }

          const questionId = crypto.randomUUID();
          await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
            .prepare(
              `INSERT INTO assignment_questions 
               (id, assignment_id, question_number, question_text, question_type, 
                max_marks, options, correct_answer, required, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            )
            .bind(
              questionId,
              assignmentId,
              i + 1,
              q.question_text,
              q.question_type,
              q.max_marks,
              q.options ? JSON.stringify(q.options) : null,
              q.correct_answer || null,
              q.required !== false ? 1 : 0,
              now_iso
            )
            .run();
        }
      }
    }

    // Fetch updated assignment
    const updatedAssignment = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare(
        `SELECT 
          a.*,
          c.name as class_name,
          c.section as class_section
         FROM assignments a
         JOIN classes c ON a.class_id = c.id
         WHERE a.id = ?`
      )
      .bind(assignmentId)
      .first();

    // Fetch updated questions
    const updatedQuestions = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare(
        `SELECT * FROM assignment_questions 
         WHERE assignment_id = ? 
         ORDER BY question_number`
      )
      .bind(assignmentId)
      .all();

    return jsonResponse({
      success: true,
      message: "Assignment updated successfully",
      assignment: {
        ...updatedAssignment,
        questions: updatedQuestions.results || []
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("PUT /api/teacher/assignments/:id error:", message);
    return errorResponse(message, 500);
  }
}

/**
 * DELETE /api/teacher/assignments/:id
 * Delete an assignment (soft delete by setting status to 'CLOSED')
 * Hard delete only allowed if no submissions exist
 * 
 * Requirements: 5.4
 */
export async function onRequestDelete(context: {
  env: { PADHAKU_CORE_DB?: D1Database; ASSESSMENT_DB: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const assignmentId = params.id;

  try {
    // Authenticate user
    const user = await getAuthenticatedUser(request, env);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    // Check if user has teacher role
    if (user.role !== 'teacher') {
      return errorResponse("Forbidden: Teacher access required", 403);
    }

    // Fetch assignment with ownership check
    const assignment = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare(
        `SELECT 
          a.id,
          a.status,
          c.teacher_id as class_teacher_id
         FROM assignments a
         JOIN classes c ON a.class_id = c.id
         WHERE a.id = ?`
      )
      .bind(assignmentId)
      .first();

    if (!assignment) {
      return errorResponse("Assignment not found", 404);
    }

    // Verify teacher owns the assignment
    if (assignment.class_teacher_id !== user.uid) {
      return errorResponse("Forbidden: You can only delete your own assignments", 403);
    }

    // Check for submissions
    const submissionCount = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare("SELECT COUNT(*) as count FROM assignment_submissions WHERE assignment_id = ?")
      .bind(assignmentId)
      .first();

    const hasSubmissions = (submissionCount?.count || 0) > 0;

    if (hasSubmissions) {
      // Soft delete - set status to CLOSED
      const result = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
        .prepare("UPDATE assignments SET status = 'CLOSED', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(assignmentId)
        .run();

      if (!result.success) {
        return errorResponse("Failed to close assignment", 500);
      }

      return jsonResponse({
        success: true,
        message: "Assignment closed successfully (submissions exist, so assignment was not permanently deleted)",
        type: "soft_delete"
      });
    } else {
      // Hard delete - no submissions exist
      await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
        .prepare("DELETE FROM assignment_questions WHERE assignment_id = ?")
        .bind(assignmentId)
        .run();

      const result = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
        .prepare("DELETE FROM assignments WHERE id = ?")
        .bind(assignmentId)
        .run();

      if (!result.success) {
        return errorResponse("Failed to delete assignment", 500);
      }

      return jsonResponse({
        success: true,
        message: "Assignment deleted permanently",
        type: "hard_delete"
      });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("DELETE /api/teacher/assignments/:id error:", message);
    return errorResponse(message, 500);
  }
}
