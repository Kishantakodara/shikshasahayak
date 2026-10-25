import { jsonResponse, errorResponse } from "../../../../lib/json";
import { getAuthenticatedUser } from "../../../../lib/auth";

/**
 * POST /api/teacher/assignments/:id/publish
 * Publish an assignment (change status from DRAFT to PUBLISHED)
 * 
 * Body: {
 *   notify_students?: boolean (default: true)
 * }
 * 
 * Requirements: 5.6
 */
export async function onRequestPost(context: {
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

    const body: any = await request.json().catch(() => ({}));
    const { notify_students = true } = body;

    // Fetch assignment with ownership check
    const assignment = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare(
        `SELECT 
          a.id,
          a.status,
          a.title,
          a.class_id,
          a.due_date,
          c.teacher_id as class_teacher_id,
          c.name as class_name
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
      return errorResponse("Forbidden: You can only publish your own assignments", 403);
    }

    // Check if assignment is in draft status
    if (assignment.status !== 'DRAFT') {
      return errorResponse(`Cannot publish assignment with status '${assignment.status}'. Only DRAFT assignments can be published`, 400);
    }

    // Validate assignment completeness before publishing
    const validationErrors: string[] = [];

    // Check if due date is in the future
    const dueDateTime = new Date(assignment.due_date);
    const now = new Date();
    if (dueDateTime.getTime() <= now.getTime()) {
      validationErrors.push("Due date must be in the future");
    }

    // Check if assignment has content (questions or description/instructions)
    const questionCount = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare("SELECT COUNT(*) as count FROM assignment_questions WHERE assignment_id = ?")
      .bind(assignmentId)
      .first();

    const hasQuestions = (questionCount?.count || 0) > 0;
    const hasInstructions = assignment.description || assignment.instructions;

    if (!hasQuestions && !hasInstructions) {
      validationErrors.push("Assignment must have either questions or instructions/description");
    }

    if (validationErrors.length > 0) {
      return errorResponse(`Cannot publish incomplete assignment: ${validationErrors.join('; ')}`, 400);
    }

    // Update assignment status to PUBLISHED
    const now_iso = new Date().toISOString();
    const result = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare(
        `UPDATE assignments 
         SET status = 'PUBLISHED', published_at = ?, updated_at = ?
         WHERE id = ?`
      )
      .bind(now_iso, now_iso, assignmentId)
      .run();

    if (!result.success) {
      return errorResponse("Failed to publish assignment", 500);
    }

    let notificationsCount = 0;

    // Create notifications for enrolled students if requested
    if (notify_students) {
      // Get enrolled students
      const enrolledStudents = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
        .prepare(
          `SELECT student_id 
           FROM class_enrollments 
           WHERE class_id = ? AND enrollment_status = 'ACTIVE' AND student_id IS NOT NULL`
        )
        .bind(assignment.class_id)
        .all();

      notificationsCount = enrolledStudents.results?.length || 0;

      // Create notifications
      const notifications = (enrolledStudents.results || []).map((enrollment: any) => ({
        id: crypto.randomUUID(),
        user_id: enrollment.student_id,
        type: 'ASSIGNMENT_PUBLISHED',
        channel: 'IN_APP',
        title: 'New Assignment Available',
        message: `${assignment.title} has been published in ${assignment.class_name}`,
        link: `/student/assignments/${assignmentId}`,
        metadata: JSON.stringify({
          assignment_id: assignmentId,
          class_id: assignment.class_id,
          due_date: assignment.due_date
        }),
        created_at: now_iso
      }));

      // Insert notifications in batches
      for (const notification of notifications) {
        await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
          .prepare(
            `INSERT INTO notifications 
             (id, user_id, type, channel, title, message, link, metadata, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            notification.id,
            notification.user_id,
            notification.type,
            notification.channel,
            notification.title,
            notification.message,
            notification.link,
            notification.metadata,
            notification.created_at
          )
          .run();
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

    return jsonResponse({
      success: true,
      message: `Assignment published successfully${notify_students ? ' and students notified' : ''}`,
      assignment: updatedAssignment,
      notifications_sent: notify_students ? notificationsCount : 0
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("POST /api/teacher/assignments/:id/publish error:", message);
    return errorResponse(message, 500);
  }
}
