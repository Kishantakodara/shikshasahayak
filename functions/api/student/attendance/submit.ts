import { jsonResponse, errorResponse } from "../../../lib/json";
import { getAuthenticatedUser } from "../../../lib/auth";

/**
 * POST /api/student/attendance/submit
 * Allows a student to check-in using session code + GPS
 */
export async function onRequestPost(context: { 
  env: { PADHAKU_CORE_DB?: D1Database; ASSESSMENT_DB?: D1Database; DB?: D1Database }; 
  request: Request 
}) {
  const { env, request } = context;
  const primaryDb = (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB) || env.DB;

  if (!primaryDb) {
    return errorResponse("Database binding not found", 500);
  }

  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user || !user.uid) {
      return errorResponse("Unauthorized - Student authentication required", 401);
    }

    const body: any = await request.json().catch(() => ({}));
    const rawSessionCode = body.session_code || body.sessionCode || '';
    const student_id = user.uid;
    const student_name = user.name || (user.email ? user.email.split('@')[0] : 'Student');
    const enrollment_number = typeof body.enrollment_number === 'string' ? body.enrollment_number.trim() : '';
    const challenge_word = typeof body.challenge_word === 'string' ? body.challenge_word.trim() : '';

    if (!rawSessionCode || !rawSessionCode.trim()) {
      return errorResponse("Session code is required", 400);
    }

    const session_code = rawSessionCode.trim().toUpperCase();

    // 1. Find active attendance session by code.
    const db = primaryDb;
    const session = await db.prepare(
      `SELECT * FROM attendance_sessions 
       WHERE UPPER(TRIM(session_code)) = ? AND is_active = 1 AND (datetime(expires_at) > datetime('now') OR expires_at > CURRENT_TIMESTAMP OR expires_at IS NULL)
       LIMIT 1`
    )
      .bind(session_code)
      .first<{
        id: string;
        class_id: string;
        challenge_word: string | null;
        geofence_enabled: number;
        geofence_latitude: number;
        geofence_longitude: number;
        geofence_radius_meters: number;
      }>();

    if (!session) {
      return errorResponse("Invalid or expired attendance session code. Please verify with your teacher.", 404);
    }

    // 3. Verify student is enrolled in this class
    let enrollment = await db.prepare(
      `SELECT id, enrollment_number FROM class_enrollments 
       WHERE class_id = ? AND student_id = ? AND (enrollment_status = 'ACTIVE' OR status = 'active') 
       LIMIT 1`
    )
      .bind(session.class_id, student_id)
      .first<{ id: string; enrollment_number?: string }>();

    if (!enrollment) {
      return errorResponse("You are not enrolled in this class. Please join the class first using your teacher's join code.", 403);
    }

    const finalEnrollmentNo = enrollment.enrollment_number || enrollment_number || '';

    // 4. Check for duplicate attendance submission in this session
    const existingSubmission = await db.prepare(
      `SELECT id, submitted_at, distance_meters FROM attendance_submissions 
       WHERE session_id = ? AND student_id = ? 
       LIMIT 1`
    )
      .bind(session.id, student_id)
      .first<{ id: string; submitted_at: string; distance_meters: number }>();

    if (existingSubmission) {
      return jsonResponse({
        success: true,
        alreadyMarked: true,
        message: "You have already marked attendance for this session.",
        submission: {
          id: existingSubmission.id,
          session_id: session.id,
          student_id,
          student_name,
          distance_meters: existingSubmission.distance_meters || 0,
          status: "VERIFIED_PRESENT"
        }
      });
    }

    // 5. Calculate distance and validate GPS if geofence is enabled
    let distanceMeters = 0;
    const lat = typeof body.latitude === 'number' ? body.latitude : parseFloat(body.latitude);
    const lng = typeof body.longitude === 'number' ? body.longitude : parseFloat(body.longitude);
    const accuracy = typeof body.accuracy === 'number' ? body.accuracy : parseFloat(body.accuracy);

    if (session.geofence_enabled) {
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return errorResponse("Valid GPS coordinates are required for location-verified attendance. Please allow location access.", 400);
      }

      // Check accuracy sanity (e.g. cellular tower estimate > 300m is too imprecise for micro-geofence)
      if (!isNaN(accuracy) && accuracy > 300) {
        return errorResponse(
          `GPS signal accuracy is too low (±${Math.round(accuracy)}m). Please enable high accuracy in device settings, step near a window, or reconnect to Wi-Fi.`,
          400
        );
      }

      if (session.geofence_latitude != null && session.geofence_longitude != null) {
        const R = 6371e3; // Earth's mean radius in meters
        const φ1 = (session.geofence_latitude * Math.PI) / 180;
        const φ2 = (lat * Math.PI) / 180;
        const Δφ = ((lat - session.geofence_latitude) * Math.PI) / 180;
        const Δλ = ((lng - session.geofence_longitude) * Math.PI) / 180;

        const a =
          Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distanceMeters = Math.round(R * c);

        const allowedRadius = session.geofence_radius_meters || 150;
        // Include GPS sensor accuracy buffer (up to 50m) for indoor classrooms / multi-story college buildings
        const accuracyBuffer = !isNaN(accuracy) && accuracy > 0 ? Math.min(accuracy, 60) : 25;
        const effectiveRadius = allowedRadius + accuracyBuffer;
        if (distanceMeters > effectiveRadius) {
          return errorResponse(
            `Out of range! You are ${distanceMeters}m away from the classroom (Allowed radius: ${allowedRadius}m ±${Math.round(accuracyBuffer)}m buffer).`,
            400
          );
        }
      }
    }

    const subId = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const today = new Date().toISOString().split('T')[0];

    // 6. Insert attendance submission
    await db.prepare(
      `INSERT INTO attendance_submissions 
       (id, session_id, student_id, student_name, enrollment_number, latitude, longitude, distance_meters, status, submitted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'VERIFIED_PRESENT', CURRENT_TIMESTAMP)`
    )
      .bind(
        subId,
        session.id,
        student_id,
        student_name,
        finalEnrollmentNo,
        !isNaN(lat) ? lat : null,
        !isNaN(lng) ? lng : null,
        distanceMeters
      )
      .run();

    // 7. Record in attendance_records
    await db.prepare(
      `INSERT OR REPLACE INTO attendance_records 
       (id, class_id, student_id, date, status, notes, recorded_by, recorded_at)
       VALUES (?, ?, ?, ?, 'PRESENT', ?, 'live-verified', CURRENT_TIMESTAMP)`
    )
      .bind(
        `rec-${subId}`,
        session.class_id,
        student_id,
        today,
        session.geofence_enabled ? `📍 Live Verified (${distanceMeters}m GPS)` : '🔑 Code Verified'
      )
      .run();

    return jsonResponse({
      success: true,
      alreadyMarked: false,
      message: "🎉 Attendance successfully verified and marked!",
      submission: {
        id: subId,
        session_id: session.id,
        student_id,
        student_name,
        distance_meters: distanceMeters,
        status: "VERIFIED_PRESENT"
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Database error";
    return errorResponse(message, 500);
  }
}
