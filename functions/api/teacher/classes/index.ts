// ============================================================
// TEACHER API: GET / POST /api/teacher/classes
// Teacher classes CRUD in Cloudflare D1
// ============================================================

import { jsonResponse, errorResponse } from "../../../lib/json";
import { getAuthenticatedUser, isAdmin } from "../../../lib/auth";
import { generateUniqueJoinCode, getTeacherDb, ensureUserExists } from "../../../lib/classHelpers";

export async function onRequestGet(context: {
  request: Request;
  env: { DB?: D1Database; ASSESSMENT_DB?: D1Database; PADHAKU_CORE_DB?: D1Database; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
}) {
  const { request, env } = context;
  const db = getTeacherDb(env);

  if (!db) {
    return errorResponse("Database binding not configured", 500);
  }

  const url = new URL(request.url);
  const teacherIdParam = url.searchParams.get("teacher_id");
  const user = await getAuthenticatedUser(request, env);
  const targetTeacherId = user?.uid;
  if (user && !isAdmin(user.email, user.role) && user.role !== 'teacher' && user.role !== 'educator') {
    return errorResponse('Forbidden', 403);
  }
  if (user && teacherIdParam && teacherIdParam !== user.uid) return errorResponse('Forbidden', 403);

  if (!targetTeacherId) {
    return errorResponse("Unauthorized - Teacher authentication required", 401);
  }

  try {
    const { results } = await db.prepare(
      `SELECT
         c.id,
         c.teacher_id,
         c.subject_id,
         c.name,
         c.description,
         c.section,
         c.semester,
         c.academic_year,
         c.join_code,
         c.grading_system,
         c.max_students,
         c.cover_image,
         c.is_active,
         c.created_at,
         c.updated_at,
         s.name AS subject_name,
         s.code AS subject_code,
         (SELECT COUNT(*) FROM class_enrollments ce WHERE ce.class_id = c.id AND (ce.enrollment_status = 'ACTIVE' OR ce.enrollment_status = 'active')) AS student_count
       FROM classes c
       LEFT JOIN subjects s ON s.id = c.subject_id OR s.code = c.subject_id
       WHERE (c.teacher_id = ? OR c.teacher_id IN (SELECT id FROM users WHERE firebase_uid = ?)) AND c.is_active = 1
       ORDER BY c.created_at DESC`
    )
      .bind(targetTeacherId, targetTeacherId)
      .all();

    return jsonResponse({
      success: true,
      count: results?.length || 0,
      classes: results || [],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch teacher classes";
    return errorResponse(message, 500);
  }
}

export async function onRequestPost(context: {
  request: Request;
  env: { DB?: D1Database; ASSESSMENT_DB?: D1Database; PADHAKU_CORE_DB?: D1Database; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
}) {
  const { request, env } = context;
  const db = getTeacherDb(env);

  if (!db) {
    return errorResponse("Database binding not configured", 500);
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, any>;
  const user = await getAuthenticatedUser(request, env);
  if (!user) return errorResponse('Unauthorized', 401);
  if (!isAdmin(user.email, user.role) && user.role !== 'teacher' && user.role !== 'educator') return errorResponse('Forbidden', 403);

  try {
    const rawName = body.name || '';
    if (typeof rawName !== 'string' || !rawName.trim()) {
      return errorResponse("Class name is required", 400);
    }
    const name = rawName.trim();

    // Ensure teacher exists in users table (foreign key constraint)
    const teacherDbId = await ensureUserExists(
      db,
      user.uid,
      user.email,
      user.name,
      'teacher'
    );

    const classId = `class_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    // Generate unique join code
    const joinCode = await generateUniqueJoinCode(db);

    const rawSubjectId = body.subject_id || body.subjectId || null;
    let subjectId: string | null = null;
    if (rawSubjectId) {
      try {
        const foundSubj = await db.prepare(
          `SELECT id FROM subjects WHERE id = ? OR code = ? LIMIT 1`
        ).bind(rawSubjectId, rawSubjectId).first<{ id: string }>();
        if (foundSubj) {
          subjectId = foundSubj.id;
        }
      } catch {}
    }

    const description = body.description ? String(body.description).trim() : null;
    const section = body.section ? String(body.section).trim() : "A";
    
    let semester: number | null = null;
    const rawSemester = body.semester !== undefined ? Number(body.semester) : null;
    if (rawSemester !== null && !isNaN(rawSemester) && rawSemester >= 1 && rawSemester <= 12) {
      semester = rawSemester;
    }

    // Normalize academic year to YYYY-YY or NULL
    let academicYear: string | null = null;
    const rawAcademicYear = body.academic_year || body.academicYear;
    if (rawAcademicYear && typeof rawAcademicYear === 'string' && rawAcademicYear.trim()) {
      const match = rawAcademicYear.trim().match(/^(\d{4})-(\d{2,4})$/);
      if (match) {
        academicYear = `${match[1]}-${match[2].slice(-2)}`;
      } else {
        academicYear = "2026-27";
      }
    } else {
      academicYear = "2026-27";
    }

    const rawGrading = body.grading_system || body.gradingSystem;
    const validGradingSystems = ['PERCENTAGE', 'GPA', 'LETTER', 'PASS_FAIL'];
    const gradingSystem = validGradingSystems.includes(rawGrading) ? rawGrading : 'PERCENTAGE';

    const rawMax = Number(body.max_students ?? body.maxStudents);
    const maxStudents = (!isNaN(rawMax) && rawMax > 0) ? rawMax : 50;
    
    const coverImage = body.cover_image || body.coverImage || null;

    await db.prepare(
      `INSERT INTO classes (
        id, teacher_id, subject_id, name, description, section, semester, academic_year, join_code, grading_system, max_students, cover_image, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    )
      .bind(
        classId,
        teacherDbId,
        subjectId,
        name,
        description,
        section,
        semester,
        academicYear,
        joinCode,
        gradingSystem,
        maxStudents,
        coverImage
      )
      .run();

    const createdClass = {
      id: classId,
      teacher_id: teacherDbId,
      teacherId: teacherDbId,
      subject_id: subjectId,
      subjectId,
      name,
      description,
      section,
      semester,
      academic_year: academicYear,
      academicYear,
      join_code: joinCode,
      joinCode,
      grading_system: gradingSystem,
      gradingSystem,
      max_students: maxStudents,
      maxStudents,
      cover_image: coverImage,
      coverImage,
      is_active: true,
      student_count: 0,
      studentCount: 0,
      assignment_count: 0,
      material_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return jsonResponse({
      success: true,
      message: "Class created successfully",
      class: createdClass,
      ...createdClass,
    }, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create class";
    console.error("POST /api/teacher/classes error:", message);
    return errorResponse(message, 500);
  }
}
