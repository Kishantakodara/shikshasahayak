import { jsonResponse, errorResponse } from "../../../../lib/json";
import { getAuthenticatedUser } from "../../../../lib/auth";
import { isClassTeacher, isHOD } from "../../../../lib/classHelpers";

/**
 * GET /api/teacher/classes/:id/quizzes
 * List all quiz assignments for a class
 * 
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 50)
 * - is_visible: Filter by visibility (1/0/all)
 * 
 * Requirements: 4.1, 4.2
 */
export async function onRequestGet(context: {
  env: { PADHAKU_CORE_DB?: D1Database; ASSESSMENT_DB: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const classId = params.id;
  const url = new URL(request.url);

  try {
    // Authenticate user
    const user = await getAuthenticatedUser(request, env);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    // Check authorization
    const hasAccess = await isClassTeacher((env.PADHAKU_CORE_DB || env.ASSESSMENT_DB), classId, user.uid) ||
                      await isHOD((env.PADHAKU_CORE_DB || env.ASSESSMENT_DB), user.uid);
    if (!hasAccess) {
      return errorResponse("Forbidden: You don't have permission to view quizzes for this class", 403);
    }

    // Parse query params
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);
    const offset = (page - 1) * limit;
    const isVisible = url.searchParams.get("is_visible") || "all";

    // Build WHERE clause
    let whereClause = "qca.class_id = ?";
    const params_bind: any[] = [classId];

    if (isVisible !== "all") {
      whereClause += " AND qca.is_visible = ?";
      params_bind.push(parseInt(isVisible));
    }

    // Get total count
    const countResult = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare(`SELECT COUNT(*) as total FROM quiz_class_assignments qca WHERE ${whereClause}`)
      .bind(...params_bind)
      .first();

    const total = countResult?.total || 0;

    // Fetch quiz assignments with quiz details
    const assignments = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare(
        `SELECT 
          qca.id as assignment_id,
          qca.quiz_id,
          qca.class_id,
          qca.assigned_at,
          qca.is_visible,
          q.title as quiz_title,
          q.subject,
          q.category,
          q.difficulty,
          q.duration,
          q.xp_reward,
          q.total_questions,
          q.passing_marks,
          -- Quiz attempt stats (placeholders - will be computed)
          0 as total_attempts,
          0 as completed_attempts,
          0 as average_score
         FROM quiz_class_assignments qca
         JOIN quizzes q ON qca.quiz_id = q.id
         WHERE ${whereClause}
         ORDER BY qca.assigned_at DESC
         LIMIT ? OFFSET ?`
      )
      .bind(...params_bind, limit, offset)
      .all();

    return jsonResponse({
      assignments: assignments.results || [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + limit < total,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("GET /api/teacher/classes/:id/quizzes error:", message);
    return errorResponse(message, 500);
  }
}

/**
 * POST /api/teacher/classes/:id/quizzes
 * Assign existing quiz to class
 * 
 * Body: {
 *   quiz_id: string,
 *   is_visible?: boolean (default: true)
 * }
 * 
 * Requirements: 4.1, 4.3
 */
export async function onRequestPost(context: {
  env: { PADHAKU_CORE_DB?: D1Database; ASSESSMENT_DB: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const classId = params.id;

  try {
    // Authenticate user
    const user = await getAuthenticatedUser(request, env);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    // Check authorization
    const hasAccess = await isClassTeacher((env.PADHAKU_CORE_DB || env.ASSESSMENT_DB), classId, user.uid) ||
                      await isHOD((env.PADHAKU_CORE_DB || env.ASSESSMENT_DB), user.uid);
    if (!hasAccess) {
      return errorResponse("Forbidden: You don't have permission to assign quizzes to this class", 403);
    }

    const body: any = await request.json();
    const { quiz_id, is_visible = true } = body;

    if (!quiz_id) {
      return errorResponse("quiz_id is required", 400);
    }

    // Verify class exists and is active
    const classInfo = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare("SELECT id, is_active FROM classes WHERE id = ?")
      .bind(classId)
      .first();

    if (!classInfo) {
      return errorResponse("Class not found", 404);
    }

    if (!classInfo.is_active) {
      return errorResponse("Cannot assign quizzes to inactive class", 400);
    }

    // Verify quiz exists
    const quiz = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare("SELECT id, title FROM quizzes WHERE id = ?")
      .bind(quiz_id)
      .first();

    if (!quiz) {
      return errorResponse("Quiz not found", 404);
    }

    // Check if already assigned
    const existing = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare("SELECT id FROM quiz_class_assignments WHERE quiz_id = ? AND class_id = ?")
      .bind(quiz_id, classId)
      .first();

    if (existing) {
      return errorResponse("Quiz is already assigned to this class", 409);
    }

    // Create assignment
    const assignmentId = crypto.randomUUID();
    const result = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare(
        `INSERT INTO quiz_class_assignments 
         (id, quiz_id, class_id, assigned_at, is_visible)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)`
      )
      .bind(assignmentId, quiz_id, classId, is_visible ? 1 : 0)
      .run();

    if (!result.success) {
      return errorResponse("Failed to assign quiz to class", 500);
    }

    // Fetch created assignment with quiz details
    const assignment = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare(
        `SELECT 
          qca.id as assignment_id,
          qca.quiz_id,
          qca.class_id,
          qca.assigned_at,
          qca.is_visible,
          q.title as quiz_title,
          q.subject,
          q.category,
          q.difficulty,
          q.duration
         FROM quiz_class_assignments qca
         JOIN quizzes q ON qca.quiz_id = q.id
         WHERE qca.id = ?`
      )
      .bind(assignmentId)
      .first();

    return jsonResponse({
      success: true,
      message: "Quiz assigned to class successfully",
      assignment: assignment,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("POST /api/teacher/classes/:id/quizzes error:", message);
    return errorResponse(message, 500);
  }
}

/**
 * PUT /api/teacher/classes/:id/quizzes/:assignmentId
 * Update quiz assignment (visibility)
 * 
 * Body: {
 *   is_visible?: boolean
 * }
 * 
 * Requirements: 4.1, 4.3
 */
export async function onRequestPut(context: {
  env: { PADHAKU_CORE_DB?: D1Database; ASSESSMENT_DB: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const classId = params.id;
  const url = new URL(request.url);

  try {
    // Extract assignmentId from URL path
    const pathParts = url.pathname.split("/");
    const assignmentId = pathParts[pathParts.length - 1];

    if (!assignmentId || assignmentId === "quizzes") {
      return errorResponse("Assignment ID is required in URL path", 400);
    }

    // Authenticate user
    const user = await getAuthenticatedUser(request, env);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    // Check authorization
    const hasAccess = await isClassTeacher((env.PADHAKU_CORE_DB || env.ASSESSMENT_DB), classId, user.uid) ||
                      await isHOD((env.PADHAKU_CORE_DB || env.ASSESSMENT_DB), user.uid);
    if (!hasAccess) {
      return errorResponse("Forbidden: You don't have permission to update quiz assignments in this class", 403);
    }

    const body: any = await request.json();
    const { is_visible } = body;

    if (is_visible === undefined) {
      return errorResponse("is_visible is required", 400);
    }

    // Update assignment
    const result = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare(
        `UPDATE quiz_class_assignments 
         SET is_visible = ?
         WHERE id = ? AND class_id = ?`
      )
      .bind(is_visible ? 1 : 0, assignmentId, classId)
      .run();

    if (!result.success) {
      return errorResponse("Failed to update quiz assignment", 500);
    }

    if (result.changes === 0) {
      return errorResponse("Quiz assignment not found", 404);
    }

    // Fetch updated assignment
    const assignment = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare(
        `SELECT 
          qca.id as assignment_id,
          qca.quiz_id,
          qca.class_id,
          qca.assigned_at,
          qca.is_visible,
          q.title as quiz_title
         FROM quiz_class_assignments qca
         JOIN quizzes q ON qca.quiz_id = q.id
         WHERE qca.id = ?`
      )
      .bind(assignmentId)
      .first();

    return jsonResponse({
      success: true,
      message: "Quiz assignment updated successfully",
      assignment: assignment,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("PUT /api/teacher/classes/:id/quizzes/:assignmentId error:", message);
    return errorResponse(message, 500);
  }
}

/**
 * DELETE /api/teacher/classes/:id/quizzes/:assignmentId
 * Remove quiz assignment from class
 * 
 * Requirements: 4.1, 4.3
 */
export async function onRequestDelete(context: {
  env: { PADHAKU_CORE_DB?: D1Database; ASSESSMENT_DB: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const classId = params.id;
  const url = new URL(request.url);

  try {
    // Extract assignmentId from URL path
    const pathParts = url.pathname.split("/");
    const assignmentId = pathParts[pathParts.length - 1];

    if (!assignmentId || assignmentId === "quizzes") {
      return errorResponse("Assignment ID is required in URL path", 400);
    }

    // Authenticate user
    const user = await getAuthenticatedUser(request, env);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    // Check authorization
    const hasAccess = await isClassTeacher((env.PADHAKU_CORE_DB || env.ASSESSMENT_DB), classId, user.uid) ||
                      await isHOD((env.PADHAKU_CORE_DB || env.ASSESSMENT_DB), user.uid);
    if (!hasAccess) {
      return errorResponse("Forbidden: You don't have permission to remove quiz assignments from this class", 403);
    }

    // Check if assignment exists and belongs to class
    const assignment = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare("SELECT id FROM quiz_class_assignments WHERE id = ? AND class_id = ?")
      .bind(assignmentId, classId)
      .first();

    if (!assignment) {
      return errorResponse("Quiz assignment not found", 404);
    }

    // Delete assignment
    const result = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare("DELETE FROM quiz_class_assignments WHERE id = ? AND class_id = ?")
      .bind(assignmentId, classId)
      .run();

    if (!result.success) {
      return errorResponse("Failed to remove quiz assignment", 500);
    }

    return jsonResponse({
      success: true,
      message: "Quiz assignment removed from class successfully",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("DELETE /api/teacher/classes/:id/quizzes/:assignmentId error:", message);
    return errorResponse(message, 500);
  }
}
