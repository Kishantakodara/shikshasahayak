// ============================================================
// TEACHER API: GET /api/teacher/students
// Real enrolled students for authenticated teacher from D1
// ============================================================

import { jsonResponse, errorResponse } from "../../../lib/json";
import { getAuthenticatedUser } from "../../../lib/auth";

export async function onRequestGet(context: {
  request: Request;
  env: { DB?: any; ASSESSMENT_DB?: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
}) {
  const { request, env } = context;
  const db = env.ASSESSMENT_DB || env.DB;
  const user = await getAuthenticatedUser(request, env);

  if (!user || !user.uid) {
    return errorResponse("Unauthorized - Teacher authentication required", 401);
  }

  if (!db) {
    return errorResponse("Database binding not found", 500);
  }

  try {
    const url = new URL(request.url);
    const classId = url.searchParams.get("classId") || url.searchParams.get("class_id");
    const search = url.searchParams.get("search") || "";

    let query = `
      SELECT
        ce.id AS enrollment_id,
        ce.class_id,
        ce.student_id,
        ce.enrolled_at,
        COALESCE(sp.name, u.display_name, 'Student') AS student_name,
        COALESCE(sp.name, u.display_name, 'Student') AS name,
        COALESCE(sp.email, u.email, '') AS student_email,
        COALESCE(sp.email, u.email, '') AS email,
        COALESCE(ce.enrollment_number, sp.enrollment_number, '') AS enrollment_number,
        COALESCE(ce.enrollment_number, sp.enrollment_number, '') AS roll_no,
        c.name AS class_name,
        c.section AS class_section
      FROM class_enrollments ce
      JOIN classes c ON c.id = ce.class_id
      LEFT JOIN student_profiles sp ON sp.user_id = ce.student_id
      LEFT JOIN unified_users u ON u.id = ce.student_id OR u.uid = ce.student_id
      WHERE c.teacher_id = ? AND (ce.enrollment_status = 'ACTIVE' OR ce.status = 'active' OR ce.enrollment_status IS NULL)
    `;
    const bindings: any[] = [user.uid];

    if (classId) {
      query += ` AND ce.class_id = ?`;
      bindings.push(classId);
    }

    if (search) {
      query += ` AND (sp.name LIKE ? OR u.display_name LIKE ? OR ce.enrollment_number LIKE ?)`;
      const pattern = `%${search}%`;
      bindings.push(pattern, pattern, pattern);
    }

    query += ` ORDER BY COALESCE(sp.name, u.display_name, 'Student') ASC`;

    const { results } = await db.prepare(query).bind(...bindings).all();

    return jsonResponse({
      success: true,
      count: results?.length || 0,
      students: results || [],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch enrolled students";
    return errorResponse(message, 500);
  }
}
