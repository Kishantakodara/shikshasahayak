import { jsonResponse, errorResponse } from "../../../lib/json";
import { getAuthenticatedUser } from "../../../lib/auth";

/**
 * GET /api/teacher/submissions/:id
 * Get submission details with full context for grading
 * 
 * Requirements: 6.1, 6.2
 */
export async function onRequestGet(context: {
  env: { PADHAKU_CORE_DB?: D1Database; ASSESSMENT_DB: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const submissionId = params.id;

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

    // Get submission with full context
    const submission = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare(
        `SELECT 
          asub.id,
          asub.assignment_id,
          asub.student_id,
          asub.status,
          asub.submitted_at,
          asub.graded_at,
          asub.graded_by,
          asub.marks,
          asub.feedback,
          asub.is_late,
          asub.resubmit_count,
          asub.created_at,
          asub.updated_at,
          asub.attachments,
          asub.external_links,
          asub.answers,
          asub.annotations,
          a.title as assignment_title,
          a.description as assignment_description,
          a.instructions,
          a.total_marks,
          a.rubric,
          a.due_date,
          a.late_penalty_percent,
          a.class_id,
          c.teacher_id as class_teacher_id,
          sp.name as student_name,
          sp.email as student_email,
          ce.enrollment_number
         FROM assignment_submissions asub
         JOIN assignments a ON asub.assignment_id = a.id
         JOIN classes c ON a.class_id = c.id
         LEFT JOIN class_enrollments ce ON asub.student_id = ce.student_id AND ce.class_id = a.class_id
         LEFT JOIN student_profiles sp ON asub.student_id = sp.user_id
         WHERE asub.id = ?`
      )
      .bind(submissionId)
      .first();

    if (!submission) {
      return errorResponse("Submission not found", 404);
    }

    if (submission.class_teacher_id !== user.uid) {
      return errorResponse("Forbidden: You can only view submissions for your own assignments", 403);
    }

    // Get assignment questions if any
    const questions = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare(
        `SELECT * FROM assignment_questions 
         WHERE assignment_id = ? 
         ORDER BY question_order ASC`
      )
      .bind(submission.assignment_id)
      .all();

    // Parse JSON fields
    const submissionData = {
      ...submission,
      attachments: submission.attachments ? JSON.parse(submission.attachments) : null,
      external_links: submission.external_links ? JSON.parse(submission.external_links) : null,
      answers: submission.answers ? JSON.parse(submission.answers) : null,
      annotations: submission.annotations ? JSON.parse(submission.annotations) : null,
      rubric: submission.rubric ? JSON.parse(submission.rubric) : null,
      questions: questions.results || [],
      grade_percentage: submission.marks !== null && submission.total_marks > 0 
        ? ((submission.marks / submission.total_marks) * 100).toFixed(2)
        : null,
    };

    return jsonResponse({
      submission: submissionData,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("GET /api/teacher/submissions/:id error:", message);
    return errorResponse(message, 500);
  }
}

/**
 * PUT /api/teacher/submissions/:id/grade
 * Grade a submission with rubric support
 * 
 * Body: {
 *   marks: number,
 *   feedback?: string,
 *   rubric_scores?: Record<string, { points: number; feedback?: string }>,
 *   question_grades?: Array<{ question_id: string; marks: number; feedback?: string }>,
 *   annotations?: object,
 *   return_to_student?: boolean (default: false),
 *   override_reason?: string (if overriding existing grade)
 * }
 * 
 * Requirements: 6.3, 6.4, 6.5
 */
export async function onRequestPut(context: {
  env: { PADHAKU_CORE_DB?: D1Database; ASSESSMENT_DB: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const submissionId = params.id;

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

    const body: any = await request.json();
    const { 
      marks, 
      feedback, 
      rubric_scores,
      question_grades,
      annotations, 
      return_to_student = false,
      override_reason
    } = body;

    if (marks === undefined || marks === null) {
      return errorResponse("marks is required", 400);
    }

    if (typeof marks !== 'number' || marks < 0) {
      return errorResponse("marks must be a non-negative number", 400);
    }

    // Verify submission exists and teacher owns it
    const submissionData = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare(
        `SELECT 
          asub.id,
          asub.assignment_id,
          asub.student_id,
          asub.status,
          asub.marks as current_marks,
          asub.graded_at,
          a.total_marks,
          a.class_id,
          c.teacher_id as class_teacher_id
         FROM assignment_submissions asub
         JOIN assignments a ON asub.assignment_id = a.id
         JOIN classes c ON a.class_id = c.id
         WHERE asub.id = ?`
      )
      .bind(submissionId)
      .first();

    if (!submissionData) {
      return errorResponse("Submission not found", 404);
    }

    if (submissionData.class_teacher_id !== user.uid) {
      return errorResponse("Forbidden: You can only grade submissions for your own assignments", 403);
    }

    // Validate marks don't exceed total marks
    if (marks > submissionData.total_marks) {
      return errorResponse(`marks (${marks}) cannot exceed assignment total marks (${submissionData.total_marks})`, 400);
    }

    const now_iso = new Date().toISOString();
    const newStatus = return_to_student ? 'RETURNED' : 'GRADED';
    const isOverride = submissionData.current_marks !== null;

    // Start transaction
    const batch = (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB).batch([
      // Update submission with grade
      (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
        .prepare(
          `UPDATE assignment_submissions 
           SET marks = ?, feedback = ?, annotations = ?, status = ?, 
               graded_at = ?, graded_by = ?, updated_at = ?
           WHERE id = ?`
        )
        .bind(
          marks,
          feedback || null,
          annotations ? JSON.stringify(annotations) : null,
          newStatus,
          now_iso,
          user.uid,
          now_iso,
          submissionId
        ),

      // Store rubric scores if provided
      ...(rubric_scores ? [
        (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
          .prepare(
            `INSERT OR REPLACE INTO rubric_scores 
             (id, submission_id, criterion_id, points, feedback, graded_by, graded_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            crypto.randomUUID(),
            submissionId,
            'rubric_overall',
            marks,
            JSON.stringify(rubric_scores),
            user.uid,
            now_iso
          )
      ] : []),

      // Store individual question grades if provided
      ...(question_grades ? question_grades.map((qg: any) =>
        (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
          .prepare(
            `INSERT OR REPLACE INTO question_grades 
             (id, submission_id, question_id, marks, feedback, graded_by, graded_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            crypto.randomUUID(),
            submissionId,
            qg.question_id,
            qg.marks,
            qg.feedback || null,
            user.uid,
            now_iso
          )
      ) : []),

      // Log grade change if this is an override
      ...(isOverride ? [
        (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
          .prepare(
            `INSERT INTO grade_audit_log 
             (id, submission_id, old_marks, new_marks, reason, changed_by, changed_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            crypto.randomUUID(),
            submissionId,
            submissionData.current_marks,
            marks,
            override_reason || 'Grade updated',
            user.uid,
            now_iso
          )
      ] : []),

      // Create notification for student if returned
      ...(return_to_student ? [
        (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
          .prepare(
            `INSERT INTO notifications 
             (id, user_id, type, channel, title, message, link, metadata, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            crypto.randomUUID(),
            submissionData.student_id,
            'ASSIGNMENT_GRADED',
            'IN_APP',
            'Assignment Graded',
            `Your assignment submission has been graded and returned with feedback`,
            `/student/assignments/${submissionData.assignment_id}/submission`,
            JSON.stringify({
              assignment_id: submissionData.assignment_id,
              submission_id: submissionId,
              marks: marks,
              total_marks: submissionData.total_marks,
              is_override: isOverride
            }),
            now_iso
          )
      ] : [])
    ]);

    const results = await batch;
    const success = results.every(r => r.success);

    if (!success) {
      return errorResponse("Failed to grade submission", 500);
    }

    // Fetch updated submission with student details
    const updatedSubmission = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare(
        `SELECT 
          asub.*,
          sp.name as student_name,
          ce.enrollment_number
         FROM assignment_submissions asub
         LEFT JOIN class_enrollments ce ON asub.student_id = ce.student_id AND ce.class_id = ?
         LEFT JOIN student_profiles sp ON asub.student_id = sp.user_id
         WHERE asub.id = ?`
      )
      .bind(submissionData.class_id, submissionId)
      .first();

    return jsonResponse({
      success: true,
      message: return_to_student 
        ? "Submission graded and returned to student successfully" 
        : "Submission graded successfully",
      submission: {
        ...updatedSubmission,
        grade_percentage: ((marks / submissionData.total_marks) * 100).toFixed(2),
        attachments: updatedSubmission?.attachments ? JSON.parse(updatedSubmission.attachments) : null,
        external_links: updatedSubmission?.external_links ? JSON.parse(updatedSubmission.external_links) : null,
        annotations: updatedSubmission?.annotations ? JSON.parse(updatedSubmission.annotations) : null,
        is_override: isOverride
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("PUT /api/teacher/submissions/:id/grade error:", message);
    return errorResponse(message, 500);
  }
}

/**
 * POST /api/teacher/submissions/bulk-grade
 * Grade multiple submissions at once
 * 
 * Body: {
 *   grades: Array<{
 *     submission_id: string;
 *     marks: number;
 *     feedback?: string;
 *     rubric_scores?: Record<string, { points: number; feedback?: string }>;
 *   }>;
 *   return_to_students?: boolean (default: false);
 * }
 * 
 * Requirements: 6.5, 6.6
 */
export async function onRequestPost(context: {
  env: { PADHAKU_CORE_DB?: D1Database; ASSESSMENT_DB: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
}) {
  const { env, request } = context;

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

    const body: any = await request.json();
    const { grades, return_to_students = false } = body;

    if (!Array.isArray(grades) || grades.length === 0) {
      return errorResponse("grades array is required and cannot be empty", 400);
    }

    if (grades.length > 100) {
      return errorResponse("Cannot grade more than 100 submissions at once", 400);
    }

    const now_iso = new Date().toISOString();
    const newStatus = return_to_students ? 'RETURNED' : 'GRADED';
    
    const successful: any[] = [];
    const failed: any[] = [];

    // Process each grade
    for (const grade of grades) {
      try {
        const { submission_id, marks, feedback, rubric_scores } = grade;

        if (!submission_id || marks === undefined) {
          failed.push({
            submission_id,
            error: 'submission_id and marks are required',
          });
          continue;
        }

        // Verify submission exists and teacher owns it
        const submissionData = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
          .prepare(
            `SELECT 
              asub.id,
              asub.assignment_id,
              asub.student_id,
              a.total_marks,
              a.class_id,
              c.teacher_id as class_teacher_id
             FROM assignment_submissions asub
             JOIN assignments a ON asub.assignment_id = a.id
             JOIN classes c ON a.class_id = c.id
             WHERE asub.id = ?`
          )
          .bind(submission_id)
          .first();

        if (!submissionData) {
          failed.push({
            submission_id,
            error: 'Submission not found',
          });
          continue;
        }

        if (submissionData.class_teacher_id !== user.uid) {
          failed.push({
            submission_id,
            error: 'You can only grade submissions for your own assignments',
          });
          continue;
        }

        // Validate marks
        if (typeof marks !== 'number' || marks < 0 || marks > submissionData.total_marks) {
          failed.push({
            submission_id,
            error: `Invalid marks: must be between 0 and ${submissionData.total_marks}`,
          });
          continue;
        }

        // Update submission
        const updateResult = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
          .prepare(
            `UPDATE assignment_submissions 
             SET marks = ?, feedback = ?, status = ?, 
                 graded_at = ?, graded_by = ?, updated_at = ?
             WHERE id = ?`
          )
          .bind(
            marks,
            feedback || null,
            newStatus,
            now_iso,
            user.uid,
            now_iso,
            submission_id
          )
          .run();

        if (!updateResult.success) {
          failed.push({
            submission_id,
            error: 'Failed to update submission',
          });
          continue;
        }

        // Store rubric scores if provided
        if (rubric_scores) {
          await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
            .prepare(
              `INSERT OR REPLACE INTO rubric_scores 
               (id, submission_id, criterion_id, points, feedback, graded_by, graded_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)`
            )
            .bind(
              crypto.randomUUID(),
              submission_id,
              'rubric_overall',
              marks,
              JSON.stringify(rubric_scores),
              user.uid,
              now_iso
            )
            .run();
        }

        // Create notification if returning to students
        if (return_to_students) {
          await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
            .prepare(
              `INSERT INTO notifications 
               (id, user_id, type, channel, title, message, link, metadata, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
            )
            .bind(
              crypto.randomUUID(),
              submissionData.student_id,
              'ASSIGNMENT_GRADED',
              'IN_APP',
              'Assignment Graded',
              `Your assignment submission has been graded and returned with feedback`,
              `/student/assignments/${submissionData.assignment_id}/submission`,
              JSON.stringify({
                assignment_id: submissionData.assignment_id,
                submission_id: submission_id,
                marks: marks,
                total_marks: submissionData.total_marks
              }),
              now_iso
            )
            .run();
        }

        successful.push({
          submission_id,
          marks,
          grade_percentage: ((marks / submissionData.total_marks) * 100).toFixed(2),
        });

      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        failed.push({
          submission_id: grade.submission_id,
          error: message,
        });
      }
    }

    return jsonResponse({
      success: true,
      message: `Bulk grading completed: ${successful.length} successful, ${failed.length} failed`,
      data: {
        successful,
        failed,
        summary: {
          total: grades.length,
          successful: successful.length,
          failed: failed.length,
        },
      },
    }, failed.length > 0 ? 207 : 200); // 207 Multi-Status if there were failures

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("POST /api/teacher/submissions/bulk-grade error:", message);
    return errorResponse(message, 500);
  }
}
