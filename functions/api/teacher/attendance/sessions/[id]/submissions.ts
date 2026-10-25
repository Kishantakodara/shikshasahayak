import { jsonResponse, errorResponse } from "../../../../../lib/json";
import { getAuthenticatedUser } from "../../../../../lib/auth";

/**
 * GET /api/teacher/attendance/sessions/[id]/submissions
 */
export async function onRequestGet(context: { 
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

    const { results } = await db.prepare(
      `SELECT * FROM attendance_submissions WHERE session_id = ? ORDER BY submitted_at DESC`
    )
      .bind(sessionId)
      .all();

    return jsonResponse({
      submissions: results || []
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Database error";
    return errorResponse(message, 500);
  }
}
