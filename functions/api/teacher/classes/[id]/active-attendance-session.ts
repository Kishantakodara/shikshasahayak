// ============================================================
// TEACHER API: GET /api/teacher/classes/:id/active-attendance-session
// Returns active, unexpired live attendance session for a class
// ============================================================

import { jsonResponse, errorResponse } from "../../../../lib/json";
import { getAuthenticatedUser } from "../../../../lib/auth";

type ActiveAttendanceSessionRow = {
  id: string;
  teacher_id: string;
  class_id: string;
  subject_id: string | null;
  session_date: string | null;
  challenge_word: string | null;
  qr_code_token: string | null;
  latitude: number | null;
  longitude: number | null;
  radius_meters: number | null;
  created_at: string;
};

export async function onRequestGet(context: {
  env: { PADHAKU_CORE_DB?: D1Database; DB?: D1Database; ASSESSMENT_DB?: D1Database; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const classId = params.id;
  const db = (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB) || env.DB;

  if (!db) {
    return errorResponse("Database binding not found", 500);
  }

  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user || !user.uid) {
      return errorResponse("Unauthorized - Teacher authentication required", 401);
    }

    // Try querying active session from teacher_attendance_sessions
    let session: ActiveAttendanceSessionRow | null = null;
    try {
      session = await db
        .prepare(
          `SELECT 
             id, 
             teacher_id, 
             class_id, 
             subject_id, 
             session_date, 
             challenge_word, 
             qr_code_token, 
             latitude, 
             longitude, 
             radius_meters, 
             created_at
           FROM teacher_attendance_sessions
           WHERE class_id = ? AND teacher_id = ?
           ORDER BY created_at DESC
           LIMIT 1`
        )
        .bind(classId, user.uid)
        .first<ActiveAttendanceSessionRow>();
    } catch {
      // Table might have slight variation, fallback to null
      session = null;
    }

    if (session) {
      // Check if created within last 2 hours (active window)
      const createdAt = new Date(session.created_at).getTime();
      const now = Date.now();
      const isStillActive = (now - createdAt) < 2 * 60 * 60 * 1000;

      if (!isStillActive) {
        session = null;
      }
    }

    return jsonResponse({
      success: true,
      session: session ? {
        ...session,
        is_active: true,
        duration_minutes: 15,
        geofence_enabled: session.latitude !== null && session.longitude !== null,
      } : null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch active attendance session";
    console.error("GET /api/teacher/classes/:id/active-attendance-session error:", message);
    return errorResponse(message, 500);
  }
}
