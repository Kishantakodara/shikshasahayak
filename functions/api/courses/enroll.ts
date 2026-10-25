// ============================================================
// SHIKSHA SAHAYAK OS API: /api/courses/enroll
// Section: Student Course Enrollment
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { Env } from "../../lib/contentEngine";
import { getAuthenticatedUser } from "../../lib/auth";

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    const user = await getAuthenticatedUser(request, env as any);
    const body = await request.json().catch(() => ({})) as { courseId?: string; userId?: string };
    const courseId = body?.courseId?.trim();
    const userId = user ? user.uid : (body?.userId?.trim() || 'guest_student');

    if (!courseId) {
      return errorResponse('Missing or invalid courseId', 400);
    }

    const db = env.PADHAKU_CORE_DB || env.DB;

    if (db) {
      try {
        const enrollmentId = `enr_${userId}_${courseId}`;
        const existing = await db.prepare(
          `SELECT id FROM student_course_enrollments WHERE user_id = ? AND course_id = ?`
        ).bind(userId, courseId).first();

        if (!existing) {
          await db.prepare(
            `INSERT INTO student_course_enrollments (id, user_id, course_id, enrolled_at, progress_percent)
             VALUES (?, ?, ?, CURRENT_TIMESTAMP, 0.0)
             ON CONFLICT(user_id, course_id) DO NOTHING`
          ).bind(enrollmentId, userId, courseId).run();

          // Increment enrolled count only on genuine new enrollment
          await db.prepare(
            `UPDATE learning_courses SET enrolled_count = enrolled_count + 1 WHERE id = ?`
          ).bind(courseId).run();
        }
      } catch (dbErr: any) {
        console.warn('DB enrollment warning:', dbErr?.message);
      }
    }

    return jsonResponse({
      success: true,
      enrolled: true,
      courseId,
      userId,
      progressPercent: 0,
      enrolledAt: new Date().toISOString()
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to enroll in course', 500);
  }
}
