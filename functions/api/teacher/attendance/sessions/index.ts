import { jsonResponse, errorResponse } from "../../../../lib/json";
import { getAuthenticatedUser } from "../../../../lib/auth";

/**
 * GET /api/teacher/attendance/sessions?class_id=...
 * POST /api/teacher/attendance/sessions
 */
export async function onRequestGet(context: { 
  env: { PADHAKU_CORE_DB?: D1Database; ASSESSMENT_DB?: D1Database; DB?: D1Database; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string }; 
  request: Request 
}) {
  const { env, request } = context;
  const db = (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB) || env.DB;
  if (!db) {
    return errorResponse("Database binding not found", 500);
  }

  const url = new URL(request.url);
  const classId = url.searchParams.get("class_id");

  if (!classId) {
    return errorResponse("class_id parameter is required", 400);
  }

  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user || !user.uid) {
      return errorResponse("Unauthorized - Teacher authentication required", 401);
    }

    // Verify teacher owns the class or is admin
    const cls = await db.prepare(
      `SELECT id, name, teacher_id, is_active FROM classes WHERE id = ? LIMIT 1`
    )
      .bind(classId)
      .first<{ id: string; name: string; teacher_id: string; is_active: number }>();

    if (!cls) {
      return errorResponse("Class not found", 404);
    }

    if (cls.teacher_id !== user.uid && user.role !== 'admin') {
      return errorResponse("Forbidden - You do not own or manage this class", 403);
    }

    const session = await db.prepare(
      `SELECT * FROM attendance_sessions 
       WHERE class_id = ? AND is_active = 1 AND expires_at > CURRENT_TIMESTAMP 
       ORDER BY starts_at DESC LIMIT 1`
    )
      .bind(classId)
      .first();

    return jsonResponse({
      session: session ? {
        ...session,
        geofence_enabled: Boolean((session as any).geofence_enabled),
        is_active: Boolean((session as any).is_active),
      } : null
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Database error";
    return errorResponse(message, 500);
  }
}

export async function onRequestPost(context: { 
  env: { PADHAKU_CORE_DB?: D1Database; ASSESSMENT_DB?: D1Database; DB?: D1Database; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string }; 
  request: Request 
}) {
  const { env, request } = context;
  const db = (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB) || env.DB;
  if (!db) {
    return errorResponse("Database binding not found", 500);
  }

  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user || !user.uid) {
      return errorResponse("Unauthorized - Teacher authentication required", 401);
    }

    const body: any = await request.json().catch(() => ({}));
    const {
      class_id,
      challenge_word,
      duration_minutes = 10,
      geofence_enabled = false,
      geofence_latitude = 23.0225,
      geofence_longitude = 72.5714,
      geofence_radius_meters = 150,
    } = body;

    if (!class_id) {
      return errorResponse("class_id is required", 400);
    }

    // Verify teacher owns the class or is admin
    const cls = await db.prepare(
      `SELECT id, name, teacher_id, is_active FROM classes WHERE id = ? LIMIT 1`
    )
      .bind(class_id)
      .first<{ id: string; name: string; teacher_id: string; is_active: number }>();

    if (!cls) {
      return errorResponse("Class not found", 404);
    }

    if (cls.teacher_id !== user.uid && user.role !== 'admin') {
      return errorResponse("Forbidden - You do not have permission to start attendance for this class", 403);
    }

    if (cls.is_active === 0) {
      return errorResponse("Cannot start attendance for an inactive or archived class", 400);
    }

    // Validate duration (must be integer between 1 and 180 minutes)
    const duration = parseInt(String(duration_minutes), 10);
    if (isNaN(duration) || duration < 1 || duration > 180) {
      return errorResponse("Session duration must be between 1 and 180 minutes", 400);
    }

    // Validate geofence radius (must be between 10 and 2000 meters)
    const radius = parseFloat(String(geofence_radius_meters));
    if (isNaN(radius) || radius < 10 || radius > 2000) {
      return errorResponse("Geofence radius must be between 10m and 2000m", 400);
    }

    // Validate coordinates if geofence is enabled
    const lat = parseFloat(String(geofence_latitude));
    const lng = parseFloat(String(geofence_longitude));
    if (geofence_enabled && (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180)) {
      return errorResponse("Invalid GPS coordinates provided for geofence", 400);
    }

    const className = cls.name || "Engineering Class";

    // Deactivate previous active sessions for this class
    await db.prepare(
      `UPDATE attendance_sessions SET is_active = 0 WHERE class_id = ?`
    )
      .bind(class_id)
      .run();

    const sessionId = `session-${Date.now()}`;
    const sessionCode = (typeof body.session_code === 'string' && /^\d{4,8}$/.test(body.session_code.trim()))
      ? body.session_code.trim()
      : Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + duration * 60 * 1000).toISOString();

    await db.prepare(
      `INSERT INTO attendance_sessions 
       (id, teacher_id, class_id, class_name, session_code, challenge_word, duration_minutes, 
        geofence_enabled, geofence_latitude, geofence_longitude, geofence_radius_meters, 
        starts_at, expires_at, is_active, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, 1, ?)`
    )
      .bind(
        sessionId,
        cls.teacher_id,
        class_id,
        className,
        sessionCode,
        challenge_word ? String(challenge_word).trim() : null,
        duration,
        geofence_enabled ? 1 : 0,
        !isNaN(lat) ? lat : null,
        !isNaN(lng) ? lng : null,
        radius,
        expiresAt,
        user.uid
      )
      .run();

    const createdSession = await db.prepare(
      `SELECT * FROM attendance_sessions WHERE id = ?`
    )
      .bind(sessionId)
      .first();

    return jsonResponse({
      success: true,
      session: createdSession ? {
        ...createdSession,
        geofence_enabled: Boolean((createdSession as any).geofence_enabled),
        is_active: Boolean((createdSession as any).is_active),
      } : null
    }, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Database error";
    return errorResponse(message, 500);
  }
}
