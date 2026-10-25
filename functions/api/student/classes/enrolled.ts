import { jsonResponse, errorResponse } from "../../../lib/json";
import { getAuthenticatedUser } from "../../../lib/auth";
import { getTeacherDb } from "../../../lib/classHelpers";

/**
 * GET /api/student/classes/enrolled?student_id=...
 * Returns all active classes a student is enrolled in
 */
export async function onRequestGet(context: { 
  env: { PADHAKU_CORE_DB?: D1Database; ASSESSMENT_DB?: D1Database; DB?: D1Database; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string }; 
  request: Request 
}) {
  const { env, request } = context;
  const db = getTeacherDb(env);
  if (!db) {
    return errorResponse("Database binding not found", 500);
  }

  const url = new URL(request.url);
  const studentId = url.searchParams.get("student_id");

  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user) return errorResponse('Unauthorized', 401);
    if (studentId && studentId !== user.uid) return errorResponse('Forbidden', 403);
    const targetStudentId = user.uid;

    if (!targetStudentId) {
      return errorResponse("Unauthorized - Student ID required", 401);
    }

    // Fetch classes enrolled by the student
    const { results } = await db.prepare(
      `SELECT 
         c.*, 
         (SELECT COUNT(*) FROM class_enrollments ce2 WHERE ce2.class_id = c.id AND (ce2.enrollment_status = 'ACTIVE' OR ce2.enrollment_status = 'active')) as student_count,
         u.display_name as teacher_name,
         u.email as teacher_email,
         s.name as subject_name,
         s.code as subject_code
       FROM class_enrollments ce
       INNER JOIN classes c ON ce.class_id = c.id
       LEFT JOIN users u ON u.id = c.teacher_id
       LEFT JOIN subjects s ON s.id = c.subject_id
       WHERE (ce.student_id = ? OR ce.student_id IN (SELECT id FROM users WHERE firebase_uid = ?)) 
         AND (ce.enrollment_status = 'ACTIVE' OR ce.enrollment_status = 'active')
         AND c.is_active = 1
       ORDER BY ce.enrolled_at DESC`
    )
      .bind(targetStudentId, targetStudentId)
      .all();

    return jsonResponse({
      success: true,
      classes: results || []
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Database error";
    return errorResponse(message, 500);
  }
}
