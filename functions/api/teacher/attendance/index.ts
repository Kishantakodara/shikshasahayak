// ============================================================
// TEACHER API: GET / POST /api/teacher/attendance
// Real teacher attendance session management in Cloudflare D1
// ============================================================

import { jsonResponse, errorResponse } from "../../../lib/json";
import { getAuthenticatedUser } from "../../../lib/auth";

export async function onRequestGet(context: {
  request: Request;
  env: { PADHAKU_CORE_DB?: D1Database; DB: D1Database; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
}) {
  const { request, env } = context;
  const user = await getAuthenticatedUser(request, env);

  if (!user || !user.uid) {
    return errorResponse("Unauthorized - Teacher authentication required", 401);
  }

  try {
    const url = new URL(request.url);
    const classId = url.searchParams.get("classId");

    let query = `
      SELECT
        tas.id,
        tas.teacher_id,
        tas.class_id,
        tas.subject_id,
        tas.session_date,
        tas.challenge_word,
        tas.qr_code_token,
        tas.latitude,
        tas.longitude,
        tas.radius_meters,
        tas.created_at,
        c.name AS class_name,
        (SELECT COUNT(*) FROM teacher_attendance_records tar WHERE tar.session_id = tas.id AND tar.status = 'present') AS present_count
      FROM teacher_attendance_sessions tas
      LEFT JOIN classes c ON c.id = tas.class_id
      WHERE tas.teacher_id = ?
    `;
    const bindings: any[] = [user.uid];

    if (classId) {
      query += ` AND tas.class_id = ?`;
      bindings.push(classId);
    }

    query += ` ORDER BY tas.created_at DESC LIMIT 50`;

    const { results } = await env.DB.prepare(query).bind(...bindings).all();

    return jsonResponse({
      success: true,
      count: results?.length || 0,
      sessions: results || [],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch attendance sessions";
    return errorResponse(message, 500);
  }
}

export async function onRequestPost(context: {
  request: Request;
  env: { PADHAKU_CORE_DB?: D1Database; DB: D1Database; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
}) {
  const { request, env } = context;
  const user = await getAuthenticatedUser(request, env);

  if (!user || !user.uid) {
    return errorResponse("Unauthorized - Teacher authentication required", 401);
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      classId?: string;
      subjectId?: string;
      challengeWord?: string;
      latitude?: number;
      longitude?: number;
      radiusMeters?: number;
    };

    if (!body.classId) {
      return errorResponse("Class ID is required to start an attendance session", 400);
    }

    const classId = body.classId;

    // Verify teacher owns the class or is admin
    const cls = await env.DB.prepare(
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

    if (cls.is_active === 0) {
      return errorResponse("Cannot start attendance for an inactive or archived class", 400);
    }

    const sessionId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const qrToken = `qr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const subjectId = body.subjectId || "general";
    const challengeWord = body.challengeWord ? String(body.challengeWord).trim() : "PASS";

    const latitude = body.latitude != null && !isNaN(Number(body.latitude)) ? Number(body.latitude) : null;
    const longitude = body.longitude != null && !isNaN(Number(body.longitude)) ? Number(body.longitude) : null;
    
    let radiusMeters = Number(body.radiusMeters);
    if (isNaN(radiusMeters) || radiusMeters < 10 || radiusMeters > 2000) {
      radiusMeters = 50.0;
    }

    if (latitude != null && (latitude < -90 || latitude > 90)) {
      return errorResponse("Invalid latitude value", 400);
    }
    if (longitude != null && (longitude < -180 || longitude > 180)) {
      return errorResponse("Invalid longitude value", 400);
    }

    await env.DB.prepare(
      `INSERT INTO teacher_attendance_sessions
       (id, teacher_id, class_id, subject_id, challenge_word, qr_code_token, latitude, longitude, radius_meters)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        sessionId,
        user.uid,
        classId,
        subjectId,
        challengeWord,
        qrToken,
        latitude,
        longitude,
        radiusMeters
      )
      .run();

    return jsonResponse({
      success: true,
      message: "Attendance session started",
      session: {
        id: sessionId,
        classId,
        subjectId,
        challengeWord,
        qrToken,
        latitude,
        longitude,
        radiusMeters,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create attendance session";
    return errorResponse(message, 500);
  }
}
