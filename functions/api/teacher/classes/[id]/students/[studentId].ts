// ============================================================
// TEACHER API: PUT / DELETE /api/teacher/classes/:id/students/:studentId
// Updates student enrollment status or removes student from class
// ============================================================

import { jsonResponse, errorResponse } from "../../../../../lib/json";
import { getAuthenticatedUser } from "../../../../../lib/auth";

export async function onRequestPut(context: {
  env: { PADHAKU_CORE_DB?: D1Database; DB?: D1Database; ASSESSMENT_DB?: D1Database; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string; studentId: string };
}) {
  const { env, request, params } = context;
  const { id: classId, studentId } = params;
  const db = (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB) || env.DB;

  if (!db) {
    return errorResponse("Database binding not found", 500);
  }

  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user || !user.uid) {
      return errorResponse("Unauthorized - Teacher authentication required", 401);
    }

    // Verify teacher owns the class or is admin
    const cls = await db.prepare(
      `SELECT teacher_id FROM classes WHERE id = ? LIMIT 1`
    )
      .bind(classId)
      .first<{ teacher_id: string }>();

    if (!cls) {
      return errorResponse("Class not found", 404);
    }

    if (cls.teacher_id !== user.uid && user.role !== 'admin') {
      return errorResponse("Forbidden - You do not own or manage this class", 403);
    }

    const body = (await request.json().catch(() => ({}))) as {
      enrollment_status?: string;
      final_grade?: string;
    };

    const status = body.enrollment_status || "ACTIVE";
    const grade = body.final_grade || null;

    await db
      .prepare(
        `UPDATE class_enrollments
         SET enrollment_status = ?, final_grade = ?
         WHERE class_id = ? AND student_id = ?`
      )
      .bind(status, grade, classId, studentId)
      .run()
      .catch(async () => {
        // Fallback for column naming
        await db
          .prepare(
            `UPDATE class_enrollments
             SET status = ?, final_grade = ?
             WHERE class_id = ? AND student_id = ?`
          )
          .bind(status.toLowerCase(), grade, classId, studentId)
          .run();
      });

    return jsonResponse({
      success: true,
      message: "Student enrollment updated successfully",
      enrollment: { classId, studentId, status, final_grade: grade },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update student enrollment";
    console.error("PUT /api/teacher/classes/:id/students/:studentId error:", message);
    return errorResponse(message, 500);
  }
}

export async function onRequestDelete(context: {
  env: { PADHAKU_CORE_DB?: D1Database; DB?: D1Database; ASSESSMENT_DB?: D1Database; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string; studentId: string };
}) {
  const { env, request, params } = context;
  const { id: classId, studentId } = params;
  const db = (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB) || env.DB;

  if (!db) {
    return errorResponse("Database binding not found", 500);
  }

  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user || !user.uid) {
      return errorResponse("Unauthorized - Teacher authentication required", 401);
    }

    // Verify teacher owns the class or is admin
    const cls = await db.prepare(
      `SELECT teacher_id FROM classes WHERE id = ? LIMIT 1`
    )
      .bind(classId)
      .first<{ teacher_id: string }>();

    if (!cls) {
      return errorResponse("Class not found", 404);
    }

    if (cls.teacher_id !== user.uid && user.role !== 'admin') {
      return errorResponse("Forbidden - You do not own or manage this class", 403);
    }

    await db
      .prepare(`DELETE FROM class_enrollments WHERE class_id = ? AND student_id = ?`)
      .bind(classId, studentId)
      .run();

    return jsonResponse({
      success: true,
      message: "Student removed from class successfully",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to remove student from class";
    console.error("DELETE /api/teacher/classes/:id/students/:studentId error:", message);
    return errorResponse(message, 500);
  }
}
