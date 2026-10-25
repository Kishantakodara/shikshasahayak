import { jsonResponse, errorResponse } from "../../../../../lib/json";
import { getAuthenticatedUser } from "../../../../../lib/auth";

/**
 * POST /api/teacher/attendance/sessions/[id]/end
 */
export async function onRequestPost(context: { 
  env: { PADHAKU_CORE_DB?: D1Database; ASSESSMENT_DB?: D1Database; DB?: D1Database; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string }; 
  params: { id: string };
  request: Request 
}) {
  const { env, params, request } = context;
  const db = (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB) || env.DB;
  if (!db) {
    return errorResponse("Database binding not found", 500);
  }
  const sessionId = params.id;

  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user || !user.uid) {
      return errorResponse("Unauthorized", 401);
    }

    const session = await db.prepare(
      `SELECT s.*, c.teacher_id 
       FROM attendance_sessions s
       LEFT JOIN classes c ON c.id = s.class_id
       WHERE s.id = ? LIMIT 1`
    )
      .bind(sessionId)
      .first<{ id: string; created_by: string; teacher_id: string }>();

    if (!session) {
      return errorResponse("Attendance session not found", 404);
    }

    if (session.created_by !== user.uid && session.teacher_id !== user.uid && user.role !== 'admin') {
      return errorResponse("Forbidden - You do not own or manage this attendance session", 403);
    }

    await db.prepare(
      `UPDATE attendance_sessions SET is_active = 0 WHERE id = ?`
    )
      .bind(sessionId)
      .run();

    return jsonResponse({
      success: true,
      message: "Session ended successfully"
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Database error";
    return errorResponse(message, 500);
  }
}
