import { jsonResponse, errorResponse } from "../../../lib/json";
import { getAuthenticatedUser } from "../../../lib/auth";

/**
 * GET /api/teacher/templates/:id
 * Get a specific assignment template
 * 
 * Requirements: Template retrieval
 */
export async function onRequestGet(context: {
  env: { ASSESSMENT_DB: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const templateId = params.id;

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

    // Get template with creator info
    const template = await env.ASSESSMENT_DB
      .prepare(
        `SELECT 
          t.*,
          sp.name as created_by_name,
          sp.email as created_by_email
         FROM assignment_templates t
         LEFT JOIN student_profiles sp ON t.created_by = sp.user_id
         WHERE t.id = ?`
      )
      .bind(templateId)
      .first();

    if (!template) {
      return errorResponse("Template not found", 404);
    }

    // Check access permissions
    const canAccess = template.is_public || template.created_by === user.uid;
    if (!canAccess) {
      return errorResponse("Forbidden: You don't have access to this template", 403);
    }

    // Parse JSON fields
    const templateWithParsedData = {
      ...template,
      allowed_file_types: template.allowed_file_types 
        ? JSON.parse(template.allowed_file_types) : null,
      rubric: template.rubric ? JSON.parse(template.rubric) : null,
      questions: template.questions ? JSON.parse(template.questions) : null,
      attachments: template.attachments ? JSON.parse(template.attachments) : null,
      tags: template.tags ? JSON.parse(template.tags) : [],
      is_own_template: template.created_by === user.uid,
      can_edit: template.created_by === user.uid,
      can_delete: template.created_by === user.uid,
    };

    return jsonResponse({
      template: templateWithParsedData,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("GET /api/teacher/templates/:id error:", message);
    return errorResponse(message, 500);
  }
}

/**
 * PUT /api/teacher/templates/:id
 * Update an assignment template
 * 
 * Body: Partial template data (same as POST)
 * 
 * Requirements: Template editing
 */
export async function onRequestPut(context: {
  env: { ASSESSMENT_DB: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const templateId = params.id;

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

    // Verify template exists and user owns it
    const existingTemplate = await env.ASSESSMENT_DB
      .prepare("SELECT * FROM assignment_templates WHERE id = ?")
      .bind(templateId)
      .first();

    if (!existingTemplate) {
      return errorResponse("Template not found", 404);
    }

    if (existingTemplate.created_by !== user.uid) {
      return errorResponse("Forbidden: You can only edit your own templates", 403);
    }

    const body: any = await request.json();
    const {
      title,
      description,
      instructions,
      total_marks,
      default_due_days,
      allow_late_submission,
      late_penalty_percent,
      max_file_size_mb,
      allowed_file_types,
      rubric,
      questions,
      attachments,
      tags,
      is_public,
    } = body;

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (title !== undefined) {
      if (!title || title.trim().length === 0) {
        return errorResponse("title cannot be empty", 400);
      }
      updates.push("title = ?");
      values.push(title.trim());
    }

    if (description !== undefined) {
      updates.push("description = ?");
      values.push(description?.trim() || null);
    }

    if (instructions !== undefined) {
      updates.push("instructions = ?");
      values.push(instructions?.trim() || null);
    }

    if (total_marks !== undefined) {
      if (total_marks <= 0) {
        return errorResponse("total_marks must be a positive number", 400);
      }
      updates.push("total_marks = ?");
      values.push(total_marks);
    }

    if (default_due_days !== undefined) {
      if (default_due_days < 1 || default_due_days > 365) {
        return errorResponse("default_due_days must be between 1 and 365", 400);
      }
      updates.push("default_due_days = ?");
      values.push(default_due_days);
    }

    if (allow_late_submission !== undefined) {
      updates.push("allow_late_submission = ?");
      values.push(allow_late_submission ? 1 : 0);
    }

    if (late_penalty_percent !== undefined) {
      if (late_penalty_percent < 0 || late_penalty_percent > 100) {
        return errorResponse("late_penalty_percent must be between 0 and 100", 400);
      }
      updates.push("late_penalty_percent = ?");
      values.push(late_penalty_percent);
    }

    if (max_file_size_mb !== undefined) {
      updates.push("max_file_size_mb = ?");
      values.push(max_file_size_mb);
    }

    if (allowed_file_types !== undefined) {
      updates.push("allowed_file_types = ?");
      values.push(allowed_file_types ? JSON.stringify(allowed_file_types) : null);
    }

    if (rubric !== undefined) {
      // Validate rubric if provided and total_marks is being updated
      const currentTotalMarks = total_marks !== undefined ? total_marks : existingTemplate.total_marks;
      if (rubric && Array.isArray(rubric)) {
        const rubricTotal = rubric.reduce((sum: number, criterion: any) => sum + (criterion.maxPoints || 0), 0);
        if (Math.abs(rubricTotal - currentTotalMarks) > 0.01) {
          return errorResponse(`Rubric total points (${rubricTotal}) must equal total_marks (${currentTotalMarks})`, 400);
        }
      }
      updates.push("rubric = ?");
      values.push(rubric ? JSON.stringify(rubric) : null);
    }

    if (questions !== undefined) {
      updates.push("questions = ?");
      values.push(questions ? JSON.stringify(questions) : null);
    }

    if (attachments !== undefined) {
      updates.push("attachments = ?");
      values.push(attachments ? JSON.stringify(attachments) : null);
    }

    if (tags !== undefined) {
      updates.push("tags = ?");
      values.push(tags && tags.length > 0 ? JSON.stringify(tags) : null);
    }

    if (is_public !== undefined) {
      updates.push("is_public = ?");
      values.push(is_public ? 1 : 0);
    }

    if (updates.length === 0) {
      return errorResponse("No fields to update", 400);
    }

    // Add updated_at
    updates.push("updated_at = ?");
    values.push(new Date().toISOString());

    // Add template ID for WHERE clause
    values.push(templateId);

    const result = await env.ASSESSMENT_DB
      .prepare(`UPDATE assignment_templates SET ${updates.join(", ")} WHERE id = ?`)
      .bind(...values)
      .run();

    if (!result.success) {
      return errorResponse("Failed to update template", 500);
    }

    // Fetch updated template
    const updatedTemplate = await env.ASSESSMENT_DB
      .prepare(
        `SELECT 
          t.*,
          sp.name as created_by_name
         FROM assignment_templates t
         LEFT JOIN student_profiles sp ON t.created_by = sp.user_id
         WHERE t.id = ?`
      )
      .bind(templateId)
      .first();

    // Parse JSON fields
    const templateWithParsedData = {
      ...updatedTemplate,
      allowed_file_types: updatedTemplate.allowed_file_types 
        ? JSON.parse(updatedTemplate.allowed_file_types) : null,
      rubric: updatedTemplate.rubric ? JSON.parse(updatedTemplate.rubric) : null,
      questions: updatedTemplate.questions ? JSON.parse(updatedTemplate.questions) : null,
      attachments: updatedTemplate.attachments ? JSON.parse(updatedTemplate.attachments) : null,
      tags: updatedTemplate.tags ? JSON.parse(updatedTemplate.tags) : [],
      is_own_template: true,
      can_edit: true,
      can_delete: true,
    };

    return jsonResponse({
      success: true,
      message: "Template updated successfully",
      template: templateWithParsedData,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("PUT /api/teacher/templates/:id error:", message);
    return errorResponse(message, 500);
  }
}

/**
 * DELETE /api/teacher/templates/:id
 * Delete an assignment template
 * 
 * Requirements: Template deletion
 */
export async function onRequestDelete(context: {
  env: { ASSESSMENT_DB: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const templateId = params.id;

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

    // Verify template exists and user owns it
    const template = await env.ASSESSMENT_DB
      .prepare("SELECT * FROM assignment_templates WHERE id = ?")
      .bind(templateId)
      .first();

    if (!template) {
      return errorResponse("Template not found", 404);
    }

    if (template.created_by !== user.uid) {
      return errorResponse("Forbidden: You can only delete your own templates", 403);
    }

    // Check if template is being used by any assignments
    const usageCount = await env.ASSESSMENT_DB
      .prepare("SELECT COUNT(*) as count FROM assignments WHERE template_id = ?")
      .bind(templateId)
      .first();

    if (usageCount && usageCount.count > 0) {
      return errorResponse(
        `Cannot delete template: it is being used by ${usageCount.count} assignment(s). Templates in use cannot be deleted to maintain data integrity.`,
        409
      );
    }

    // Delete the template
    const result = await env.ASSESSMENT_DB
      .prepare("DELETE FROM assignment_templates WHERE id = ?")
      .bind(templateId)
      .run();

    if (!result.success) {
      return errorResponse("Failed to delete template", 500);
    }

    return jsonResponse({
      success: true,
      message: "Template deleted successfully",
      template_id: templateId,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("DELETE /api/teacher/templates/:id error:", message);
    return errorResponse(message, 500);
  }
}

/**
 * POST /api/teacher/templates/:id/use
 * Create an assignment from a template
 * 
 * Body: {
 *   class_id: string;
 *   due_date: string;
 *   customizations?: Partial<AssignmentData>;
 * }
 * 
 * Requirements: Template usage
 */
export async function onRequestPost(context: {
  env: { ASSESSMENT_DB: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const templateId = params.id;
  const url = new URL(request.url);

  try {
    // Check if this is the "use" endpoint
    if (!url.pathname.endsWith('/use')) {
      return errorResponse("Invalid endpoint", 404);
    }

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
    const { class_id, due_date, customizations = {} } = body;

    if (!class_id) {
      return errorResponse("class_id is required", 400);
    }

    if (!due_date) {
      return errorResponse("due_date is required", 400);
    }

    // Verify template exists and is accessible
    const template = await env.ASSESSMENT_DB
      .prepare("SELECT * FROM assignment_templates WHERE id = ?")
      .bind(templateId)
      .first();

    if (!template) {
      return errorResponse("Template not found", 404);
    }

    const canUse = template.is_public || template.created_by === user.uid;
    if (!canUse) {
      return errorResponse("Forbidden: You don't have access to this template", 403);
    }

    // Verify class exists and teacher owns it
    const classData = await env.ASSESSMENT_DB
      .prepare("SELECT * FROM classes WHERE id = ? AND teacher_id = ?")
      .bind(class_id, user.uid)
      .first();

    if (!classData) {
      return errorResponse("Class not found or you don't have access to it", 404);
    }

    // Create assignment from template
    const assignmentId = crypto.randomUUID();
    const now_iso = new Date().toISOString();

    // Merge template data with customizations
    const assignmentData = {
      id: assignmentId,
      class_id,
      teacher_id: user.uid,
      template_id: templateId,
      title: customizations.title || template.title,
      description: customizations.description !== undefined ? customizations.description : template.description,
      instructions: customizations.instructions !== undefined ? customizations.instructions : template.instructions,
      total_marks: customizations.total_marks || template.total_marks,
      due_date,
      allow_late_submission: customizations.allow_late_submission !== undefined 
        ? customizations.allow_late_submission 
        : Boolean(template.allow_late_submission),
      late_penalty_percent: customizations.late_penalty_percent !== undefined 
        ? customizations.late_penalty_percent 
        : template.late_penalty_percent,
      max_file_size_mb: customizations.max_file_size_mb || template.max_file_size_mb,
      allowed_file_types: customizations.allowed_file_types 
        ? JSON.stringify(customizations.allowed_file_types) 
        : template.allowed_file_types,
      rubric: customizations.rubric 
        ? JSON.stringify(customizations.rubric)
        : template.rubric,
      attachments: customizations.attachments 
        ? JSON.stringify(customizations.attachments)
        : template.attachments,
      status: 'DRAFT',
      created_at: now_iso,
      updated_at: now_iso,
    };

    // Insert assignment
    const result = await env.ASSESSMENT_DB
      .prepare(
        `INSERT INTO assignments 
         (id, class_id, teacher_id, template_id, title, description, instructions, 
          total_marks, due_date, allow_late_submission, late_penalty_percent, 
          max_file_size_mb, allowed_file_types, rubric, attachments, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        assignmentData.id,
        assignmentData.class_id,
        assignmentData.teacher_id,
        assignmentData.template_id,
        assignmentData.title,
        assignmentData.description,
        assignmentData.instructions,
        assignmentData.total_marks,
        assignmentData.due_date,
        assignmentData.allow_late_submission ? 1 : 0,
        assignmentData.late_penalty_percent,
        assignmentData.max_file_size_mb,
        assignmentData.allowed_file_types,
        assignmentData.rubric,
        assignmentData.attachments,
        assignmentData.status,
        assignmentData.created_at,
        assignmentData.updated_at
      )
      .run();

    if (!result.success) {
      return errorResponse("Failed to create assignment from template", 500);
    }

    // Create assignment questions from template if any
    if (template.questions) {
      const templateQuestions = JSON.parse(template.questions);
      if (Array.isArray(templateQuestions) && templateQuestions.length > 0) {
        const questionInserts = templateQuestions.map((q: any, index: number) =>
          env.ASSESSMENT_DB
            .prepare(
              `INSERT INTO assignment_questions 
               (id, assignment_id, question_text, question_type, max_marks, options, 
                correct_answer, required, question_order)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
            )
            .bind(
              crypto.randomUUID(),
              assignmentId,
              q.question_text,
              q.question_type || 'LONG_ANSWER',
              q.max_marks || 0,
              q.options ? JSON.stringify(q.options) : null,
              q.correct_answer || null,
              q.required !== undefined ? (q.required ? 1 : 0) : 1,
              index + 1
            )
            .run()
        );

        await Promise.all(questionInserts);
      }
    }

    // Fetch the created assignment
    const createdAssignment = await env.ASSESSMENT_DB
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

    return jsonResponse({
      success: true,
      message: "Assignment created from template successfully",
      assignment: {
        ...createdAssignment,
        allowed_file_types: createdAssignment.allowed_file_types 
          ? JSON.parse(createdAssignment.allowed_file_types) : null,
        rubric: createdAssignment.rubric ? JSON.parse(createdAssignment.rubric) : null,
        attachments: createdAssignment.attachments ? JSON.parse(createdAssignment.attachments) : null,
      },
      template_id: templateId,
    }, 201);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("POST /api/teacher/templates/:id/use error:", message);
    return errorResponse(message, 500);
  }
}