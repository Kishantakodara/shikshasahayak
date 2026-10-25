// ============================================================
// TEACHER API: GET /api/teacher/classes/:id/gradebook
// Gradebook matrix with student assessment grades & class stats
// ============================================================

import { jsonResponse, errorResponse } from "../../../../lib/json";
import { getAuthenticatedUser } from "../../../../lib/auth";

export async function onRequestGet(context: {
  env: { PADHAKU_CORE_DB?: D1Database; DB?: D1Database; ASSESSMENT_DB?: D1Database; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const classId = params.id;
  const db = (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB) || env.DB;

  if (!db) {
    return errorResponse("Database binding not found", 500);
  }

  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user || !user.uid) {
      return errorResponse("Unauthorized - Teacher authentication required", 401);
    }

    // 1. Verify class existence and ownership
    const classData = await db
      .prepare(`SELECT id, teacher_id, name, section, semester, grading_system FROM classes WHERE id = ?`)
      .bind(classId)
      .first<{ id: string; teacher_id: string; name: string; section?: string; semester?: number; grading_system: string }>();

    if (!classData) {
      return errorResponse("Class not found", 404);
    }

    if (classData.teacher_id !== user.uid && user.role !== "admin") {
      return errorResponse("Forbidden: You can only view gradebooks for your own classes", 403);
    }

    // 2. Fetch enrolled students
    const { results: rawStudents } = await db
      .prepare(
        `SELECT 
           ce.student_id AS id,
           ce.student_id,
           ce.enrollment_number,
           COALESCE(sp.name, u.display_name, ce.enrollment_number, 'Student') AS name,
           COALESCE(sp.email, u.email, '') AS email,
           ce.final_grade
         FROM class_enrollments ce
         LEFT JOIN student_profiles sp ON sp.user_id = ce.student_id
         LEFT JOIN unified_users u ON u.id = ce.student_id OR u.uid = ce.student_id
         WHERE ce.class_id = ? AND (ce.enrollment_status = 'ACTIVE' OR ce.status = 'active')
         ORDER BY name ASC`
      )
      .bind(classId)
      .all();

    // 3. Fetch assignments for class
    const { results: rawAssignments } = await db
      .prepare(
        `SELECT 
           id,
           title,
           total_marks,
           due_date,
           status
         FROM assignments
         WHERE class_id = ?
         ORDER BY created_at ASC`
      )
      .bind(classId)
      .all();

    // 4. Fetch all submissions with grades for this class
    const { results: rawSubmissions } = await db
      .prepare(
        `SELECT 
           asub.student_id,
           asub.assignment_id,
           asub.marks,
           asub.status
         FROM assignment_submissions asub
         JOIN assignments a ON a.id = asub.assignment_id
         WHERE a.class_id = ?`
      )
      .bind(classId)
      .all();

    // 5. Build grades map: { [studentId]: { [assignmentId]: marks } }
    const grades: Record<string, Record<string, number | null>> = {};
    const students = rawStudents || [];
    const assignments = (rawAssignments || []).map((a: any) => ({
      id: a.id,
      title: a.title,
      total_marks: Number(a.total_marks) || 100,
      due_date: a.due_date,
      status: a.status || "PUBLISHED",
    }));

    // Initialize all students in the grades map
    students.forEach((st: any) => {
      grades[st.id] = {};
      assignments.forEach((asg: any) => {
        grades[st.id][asg.id] = null;
      });
    });

    // Populate actual grades
    (rawSubmissions || []).forEach((sub: any) => {
      if (grades[sub.student_id]) {
        grades[sub.student_id][sub.assignment_id] = sub.marks !== null && sub.marks !== undefined ? Number(sub.marks) : null;
      }
    });

    return jsonResponse({
      success: true,
      classInfo: classData,
      students,
      assignments,
      grades,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load class gradebook";
    console.error("GET /api/teacher/classes/:id/gradebook error:", message);
    return errorResponse(message, 500);
  }
}
