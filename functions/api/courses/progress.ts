// ============================================================
// SHIKSHA SAHAYAK OS API: /api/courses/progress
// Section: Student Lesson Progress Tracking & Verified Certificates
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { Env } from "../../lib/contentEngine";
import { getAuthenticatedUser } from "../../lib/auth";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const courseId = url.searchParams.get("courseId")?.trim();
  
  if (!courseId) {
    return errorResponse("Missing courseId", 400);
  }

  const user = await getAuthenticatedUser(request, env as any);
  const queryUserId = url.searchParams.get("userId")?.trim();
  // If user is authenticated, use their authoritative UID.
  // Otherwise, only allow guest identifiers (prevent unauthenticated guessing of real student UIDs).
  const userId = user 
    ? user.uid 
    : (queryUserId && (queryUserId.startsWith('guest_') || queryUserId.startsWith('anon_')) 
        ? queryUserId 
        : 'guest_student');

  try {
    let completedLessons: string[] = [];
    let progressPercent = 0;
    let certificate: any = null;

    const db = env.PADHAKU_CORE_DB || env.DB;

    if (db) {
      try {
        const { results: progressRows } = await db.prepare(
          `SELECT lesson_id FROM student_lesson_progress WHERE user_id = ? AND course_id = ? AND is_completed = 1`
        ).bind(userId, courseId).all<Record<string, unknown>>();

        if (progressRows) {
          completedLessons = progressRows.map(r => String(r.lesson_id));
        }

        const enrollmentRow = await db.prepare(
          `SELECT progress_percent, completed_at FROM student_course_enrollments WHERE user_id = ? AND course_id = ?`
        ).bind(userId, courseId).first<Record<string, unknown>>();

        if (enrollmentRow) {
          progressPercent = Number(enrollmentRow.progress_percent || 0);
        }

        const certRow = await db.prepare(
          `SELECT certificate_number, student_name, course_title, issued_at, verification_code
           FROM student_course_certificates
           WHERE user_id = ? AND course_id = ?`
        ).bind(userId, courseId).first<Record<string, unknown>>();

        if (certRow) {
          certificate = {
            certificateNumber: certRow.certificate_number,
            studentName: certRow.student_name,
            courseTitle: certRow.course_title,
            issuedAt: certRow.issued_at,
            verificationCode: certRow.verification_code
          };
        }
      } catch (dbErr: any) {
        console.warn('DB course progress query warning:', dbErr?.message);
      }
    }

    return jsonResponse({
      success: true,
      courseId,
      userId,
      completedLessons,
      progressPercent,
      certificate
    }, {
      headers: { 'Cache-Control': 'no-store' }
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch course progress', 500);
  }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    const user = await getAuthenticatedUser(request, env as any);
    const body = await request.json().catch(() => ({})) as {
      courseId?: string;
      lessonId?: string;
      userId?: string;
      isCompleted?: boolean;
      totalLessons?: number;
      studentName?: string;
      courseTitle?: string;
    };

    const courseId = body?.courseId?.trim();
    const lessonId = body?.lessonId?.trim();
    const userId = user ? user.uid : (body?.userId?.trim() || 'guest_student');
    const isCompleted = body?.isCompleted ?? true;
    const totalLessons = Math.max(1, Math.min(200, Number(body?.totalLessons) || 4));
    const studentName = user?.name || body?.studentName?.trim() || 'Student';
    const courseTitle = body?.courseTitle?.trim() || 'Engineering Skills Track';

    if (!courseId || !lessonId) {
      return errorResponse("Missing courseId or lessonId", 400);
    }

    let completedLessonsCount = 1;
    let certificate: any = null;

    const db = env.PADHAKU_CORE_DB || env.DB;

    if (db) {
      try {
        const progId = `prog_${userId}_${lessonId}`;
        await db.prepare(
          `INSERT INTO student_lesson_progress (id, user_id, course_id, lesson_id, is_completed, completed_at)
           VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
           ON CONFLICT(user_id, lesson_id) DO UPDATE SET is_completed = ?, completed_at = CURRENT_TIMESTAMP`
        ).bind(progId, userId, courseId, lessonId, isCompleted ? 1 : 0, isCompleted ? 1 : 0).run();

        // Calculate actual count of completed lessons
        const countRow = await db.prepare(
          `SELECT COUNT(*) as cnt FROM student_lesson_progress WHERE user_id = ? AND course_id = ? AND is_completed = 1`
        ).bind(userId, courseId).first<{ cnt: number }>();

        completedLessonsCount = countRow ? countRow.cnt : 1;
        const newPercent = Math.min(100, Math.round((completedLessonsCount / totalLessons) * 100));

        await db.prepare(
          `INSERT INTO student_course_enrollments (id, user_id, course_id, enrolled_at, progress_percent)
           VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)
           ON CONFLICT(user_id, course_id) DO UPDATE SET
             progress_percent = excluded.progress_percent,
             completed_at = CASE WHEN excluded.progress_percent >= 100 THEN CURRENT_TIMESTAMP ELSE completed_at END`
        ).bind(`enr_${userId}_${courseId}`, userId, courseId, newPercent).run();

        // If completed 100%, generate certificate idempotently
        if (newPercent >= 100) {
          const certId = `cert_${userId}_${courseId}`;
          const certNum = `PADHAKU-CERT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
          const verifyCode = `VRF-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

          await db.prepare(
            `INSERT INTO student_course_certificates (id, user_id, course_id, certificate_number, student_name, course_title, issued_at, verification_code)
             VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
             ON CONFLICT(user_id, course_id) DO NOTHING`
          ).bind(certId, userId, courseId, certNum, studentName, courseTitle, verifyCode).run();

          const fetchedCert = await db.prepare(
            `SELECT certificate_number, student_name, course_title, issued_at, verification_code
             FROM student_course_certificates
             WHERE user_id = ? AND course_id = ?`
          ).bind(userId, courseId).first<Record<string, unknown>>();

          if (fetchedCert) {
            certificate = {
              certificateNumber: fetchedCert.certificate_number,
              studentName: fetchedCert.student_name,
              courseTitle: fetchedCert.course_title,
              issuedAt: fetchedCert.issued_at,
              verificationCode: fetchedCert.verification_code
            };
          }
        }
      } catch (dbErr: any) {
        console.warn('DB progress update error:', dbErr?.message);
      }
    }

    const calculatedPercent = Math.min(100, Math.round((completedLessonsCount / totalLessons) * 100));

    return jsonResponse({
      success: true,
      courseId,
      lessonId,
      userId,
      isCompleted,
      progressPercent: calculatedPercent,
      isCourseCompleted: calculatedPercent >= 100,
      certificate
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update course progress', 500);
  }
}
