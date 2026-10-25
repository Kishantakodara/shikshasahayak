// ============================================================
// TEACHER API: GET /api/teacher/overview
// Real aggregated metrics for authenticated teacher from Cloudflare D1
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getAuthenticatedUser } from "../../lib/auth";

export async function onRequestGet(context: {
  request: Request;
  env: { DB: D1Database; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
}) {
  const { request, env } = context;
  const user = await getAuthenticatedUser(request, env);

  if (!user || !user.uid) {
    return errorResponse("Unauthorized - Teacher authentication required", 401);
  }

  try {
    const teacherId = user.uid;

    // 1. Count assigned subjects
    const subjectsCountRes = await env.DB.prepare(
      `SELECT COUNT(*) AS total FROM teacher_subject_assignments WHERE teacher_id = ?`
    )
      .bind(teacherId)
      .first<{ total: number }>();

    // 2. Count active classes
    const classesCountRes = await env.DB.prepare(
      `SELECT COUNT(*) AS total FROM classes WHERE teacher_id = ? AND is_active = 1`
    )
      .bind(teacherId)
      .first<{ total: number }>();

    // 3. Count total enrolled students across teacher's classes
    const studentsCountRes = await env.DB.prepare(
      `SELECT COUNT(DISTINCT ce.student_id) AS total
       FROM class_enrollments ce
       JOIN classes c ON c.id = ce.class_id
       WHERE c.teacher_id = ? AND ce.status = 'active'`
    )
      .bind(teacherId)
      .first<{ total: number }>();

    // 4. Count pending assignment submissions to grade
    const pendingGradingRes = await env.DB.prepare(
      `SELECT COUNT(*) AS total
       FROM assignment_submissions sub
       JOIN assignments a ON a.id = sub.assignment_id
       WHERE a.teacher_id = ? AND sub.status = 'submitted'`
    )
      .bind(teacherId)
      .first<{ total: number }>();

    // 5. Fetch recent announcements created by teacher
    const { results: announcements } = await env.DB.prepare(
      `SELECT id, subject_id, title, content, created_at
       FROM teacher_announcements
       WHERE teacher_id = ?
       ORDER BY created_at DESC
       LIMIT 5`
    )
      .bind(teacherId)
      .all();

    // 6. Fetch recent classes
    const { results: classes } = await env.DB.prepare(
      `SELECT id, name, section, semester, join_code, created_at
       FROM classes
       WHERE teacher_id = ? AND is_active = 1
       ORDER BY created_at DESC
       LIMIT 5`
    )
      .bind(teacherId)
      .all();

    return jsonResponse({
      success: true,
      stats: {
        subjectsCount: subjectsCountRes?.total || 0,
        classesCount: classesCountRes?.total || 0,
        studentsCount: studentsCountRes?.total || 0,
        pendingGradingCount: pendingGradingRes?.total || 0,
      },
      recentAnnouncements: announcements || [],
      recentClasses: classes || [],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load teacher overview";
    return errorResponse(message, 500);
  }
}
