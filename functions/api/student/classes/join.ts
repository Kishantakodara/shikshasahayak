import { jsonResponse, errorResponse } from "../../../lib/json";
import { getAuthenticatedUser } from "../../../lib/auth";
import { getTeacherDb, ensureUserExists } from "../../../lib/classHelpers";

/**
 * POST /api/student/classes/join
 * Enrolls a student in a class using the teacher's Class Join Code
 */
export async function onRequestPost(context: { 
  env: { PADHAKU_CORE_DB?: D1Database; ASSESSMENT_DB?: D1Database; DB?: D1Database; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string }; 
  request: Request 
}) {
  const { env, request } = context;
  const db = getTeacherDb(env);
  if (!db) {
    return errorResponse("Database binding not found", 500);
  }

  try {
    const body: any = await request.json().catch(() => ({}));
    const user = await getAuthenticatedUser(request, env);
    if (!user) return errorResponse('Unauthorized', 401);
    if (body.student_id && body.student_id !== user.uid) return errorResponse('Forbidden', 403);

    const rawCode = body.join_code || body.code || '';
    let enrollment_number = typeof body.enrollment_number === 'string' ? body.enrollment_number.trim() : '';

    if (!rawCode || !rawCode.trim()) {
      return errorResponse("Class join code is required", 400);
    }

    // Clean placeholder or dummy enrollment numbers
    if (
      enrollment_number.toUpperCase().startsWith('GTU-STUDENT') ||
      enrollment_number === 'GTU-2024-EC-089' ||
      enrollment_number.toLowerCase() === 'student-guest'
    ) {
      enrollment_number = '';
    }

    const code = rawCode.trim().toUpperCase();

    // 1. Find class by active join code
    let cls = await db.prepare(
      `SELECT c.*, u.display_name AS teacher_name, u.email AS teacher_email, s.name AS subject_name, s.code AS subject_code
       FROM classes c
       LEFT JOIN users u ON u.id = c.teacher_id
       LEFT JOIN subjects s ON s.id = c.subject_id
       WHERE UPPER(TRIM(c.join_code)) = ? LIMIT 1`
    )
      .bind(code)
      .first<{
        id: string;
        name: string;
        description: string;
        section: string;
        semester: number;
        academic_year: string;
        join_code: string;
        is_active: number;
        teacher_name?: string;
        teacher_email?: string;
        subject_name?: string;
        subject_code?: string;
      }>();

    if (!cls) {
      return errorResponse(`Invalid Join Code "${rawCode.trim()}". Please verify the code with your teacher.`, 404);
    }

    if (cls.is_active === 0) {
      return errorResponse(`This class (${cls.name}) is inactive or archived. New enrollments are closed.`, 400);
    }

    // 2. Ensure student is registered in users table to satisfy foreign keys
    const studentDbId = await ensureUserExists(
      db,
      user.uid,
      user.email,
      user.name,
      'student'
    );

    // 3. Check if student is already enrolled in this class
    const existing = await db.prepare(
      `SELECT * FROM class_enrollments WHERE class_id = ? AND (student_id = ? OR student_id = ?) LIMIT 1`
    )
      .bind(cls.id, studentDbId, user.uid)
      .first<{ id: string; enrollment_status: string; status?: string }>();

    if (existing) {
      const status = (existing.enrollment_status || existing.status || '').toUpperCase();
      if (status === 'ACTIVE') {
        return jsonResponse({
          success: true,
          alreadyEnrolled: true,
          message: `You are already enrolled in ${cls.name}!`,
          classData: cls
        });
      } else {
        // Reactivate enrollment
        await db.prepare(
          `UPDATE class_enrollments 
           SET enrollment_status = 'active', enrollment_number = COALESCE(?, enrollment_number), enrolled_at = CURRENT_TIMESTAMP
           WHERE id = ?`
        )
          .bind(enrollment_number || null, existing.id)
          .run();

        return jsonResponse({
          success: true,
          alreadyEnrolled: false,
          message: `🎉 Successfully reactivated enrollment in ${cls.name}!`,
          classData: cls
        });
      }
    }

    // 4. Verify enrollment number is unique in this class if provided and not for the same student
    if (enrollment_number) {
      const duplicateEnrollment = await db.prepare(
        `SELECT * FROM class_enrollments WHERE class_id = ? AND enrollment_number = ? AND student_id != ? AND student_id != ? LIMIT 1`
      )
        .bind(cls.id, enrollment_number, studentDbId, user.uid)
        .first();

      if (duplicateEnrollment) {
        return errorResponse("This enrollment number is already registered in this class by another student.", 400);
      }
    }

    // 5. Enroll the student
    const enrollmentId = `enr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await db.prepare(
      `INSERT INTO class_enrollments 
       (id, class_id, student_id, enrollment_number, enrollment_status, enrolled_at)
       VALUES (?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)`
    )
      .bind(
        enrollmentId,
        cls.id,
        studentDbId,
        enrollment_number || null
      )
      .run();

    return jsonResponse({
      success: true,
      alreadyEnrolled: false,
      message: `🎉 Successfully joined ${cls.name}!`,
      classData: cls
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Enrollment failed";
    console.error("POST /api/student/classes/join error:", message);
    return errorResponse(message, 500);
  }
}
