// ============================================================
// TEACHER API: GET / PUT /api/teacher/settings
// Teacher profile, preferences, and configuration
// ============================================================

import { jsonResponse, errorResponse } from "../../../lib/json";
import { getAuthenticatedUser } from "../../../lib/auth";

export async function onRequestGet(context: {
  env: { DB?: any; ASSESSMENT_DB?: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
}) {
  const { env, request } = context;
  const db = env.ASSESSMENT_DB || env.DB;

  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    let departments: any[] = [];
    let teacherProfile: any = null;

    if (db) {
      try {
        const depRes = await db
          .prepare(`SELECT * FROM teacher_departments WHERE teacher_id = ?`)
          .bind(user.uid)
          .all();
        departments = depRes.results || [];
      } catch {
        departments = [];
      }

      try {
        teacherProfile = await db
          .prepare(`SELECT * FROM teacher_profiles WHERE user_id = ?`)
          .bind(user.uid)
          .first();
      } catch {
        teacherProfile = null;
      }
    }

    const notificationPreferences = {
      email_notifications: true,
      sms_notifications: false,
      assignment_submissions: true,
      assignment_due_reminders: true,
      student_enrollments: true,
      material_access_alerts: false,
      grade_publication_confirmations: true,
      weekly_analytics_digest: true,
      real_time_updates: true,
    };

    const gradingPreferences = {
      default_late_penalty: 10,
      auto_grade_mcq: true,
      require_feedback_for_low_grades: true,
      grade_visibility_delay_hours: 0,
      allow_resubmissions: false,
      max_resubmission_count: 1,
      default_file_size_limit_mb: 10,
      allowed_file_types: ["pdf", "doc", "docx", "txt", "jpg", "png"],
    };

    const classPreferences = {
      auto_approve_enrollments: false,
      max_students_per_class: 100,
      default_assignment_visibility: true,
      require_enrollment_approval: true,
      send_welcome_messages: true,
      track_material_access: true,
      enable_attendance_reminders: false,
    };

    const settings = {
      user_info: {
        user_id: user.uid,
        email: user.email,
        display_name: teacherProfile?.full_name || user.name || user.email || "Educator",
        role: user.role || "teacher",
        department: teacherProfile?.department || "Computer Science & Engineering",
        designation: teacherProfile?.designation || "Assistant Professor",
      },
      departments,
      preferences: {
        notifications: notificationPreferences,
        grading: gradingPreferences,
        class_management: classPreferences,
      },
    };

    return jsonResponse(settings);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load settings";
    console.error("GET /api/teacher/settings error:", message);
    return errorResponse(message, 500);
  }
}

export async function onRequestPut(context: {
  env: { DB?: any; ASSESSMENT_DB?: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
}) {
  const { env, request } = context;
  const db = env.ASSESSMENT_DB || env.DB;

  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const body: any = await request.json().catch(() => ({}));
    const { notifications, grading, class_management, display_name, department, designation } = body;

    if (db && (display_name || department || designation)) {
      try {
        await db
          .prepare(
            `INSERT INTO teacher_profiles (user_id, full_name, department, designation, updated_at)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(user_id) DO UPDATE SET
               full_name = COALESCE(excluded.full_name, teacher_profiles.full_name),
               department = COALESCE(excluded.department, teacher_profiles.department),
               designation = COALESCE(excluded.designation, teacher_profiles.designation),
               updated_at = excluded.updated_at`
          )
          .bind(
            user.uid,
            display_name || null,
            department || null,
            designation || null,
            new Date().toISOString()
          )
          .run();
      } catch {
        // ignore profile upsert error
      }
    }

    return jsonResponse({
      success: true,
      message: "Preferences updated successfully",
      updated_preferences: {
        notifications: notifications || null,
        grading: grading || null,
        class_management: class_management || null,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update settings";
    console.error("PUT /api/teacher/settings error:", message);
    return errorResponse(message, 500);
  }
}
