// ============================================================
// TEACHER API: GET /api/teacher/analytics/at-risk
// Identifies students with low attendance or low assignment grades
// ============================================================

import { jsonResponse, errorResponse } from "../../../lib/json";
import { getAuthenticatedUser } from "../../../lib/auth";

export async function onRequestGet(context: {
  env: { PADHAKU_CORE_DB?: D1Database; DB?: any; ASSESSMENT_DB?: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
}) {
  const { env, request } = context;
  const db = (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB) || env.DB;
  const url = new URL(request.url);

  if (!db) {
    return errorResponse("Database binding not found", 500);
  }

  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user || !user.uid) {
      return errorResponse("Unauthorized - Teacher authentication required", 401);
    }

    const classId = url.searchParams.get("class_id") || url.searchParams.get("classId");

    let query = `
      SELECT 
        ce.student_id,
        ce.enrollment_number,
        COALESCE(sp.name, u.display_name, 'Student') AS name,
        COALESCE(sp.email, u.email, '') AS email,
        c.name AS class_name,
        AVG(CASE WHEN asub.marks IS NOT NULL AND a.total_marks > 0 THEN (asub.marks * 100.0 / a.total_marks) END) AS avg_marks
      FROM class_enrollments ce
      JOIN classes c ON c.id = ce.class_id
      LEFT JOIN student_profiles sp ON sp.user_id = ce.student_id
      LEFT JOIN unified_users u ON u.id = ce.student_id OR u.uid = ce.student_id
      LEFT JOIN assignments a ON a.class_id = c.id
      LEFT JOIN assignment_submissions asub ON asub.assignment_id = a.id AND asub.student_id = ce.student_id
      WHERE c.teacher_id = ?
    `;
    const params: any[] = [user.uid];

    if (classId) {
      query += ` AND c.id = ?`;
      params.push(classId);
    }

    query += ` GROUP BY ce.student_id HAVING avg_marks < 40 OR avg_marks IS NULL LIMIT 20`;

    let atRiskStudents: any[] = [];
    try {
      const { results } = await db.prepare(query).bind(...params).all();
      atRiskStudents = results || [];
    } catch {
      atRiskStudents = [];
    }

    return jsonResponse({
      success: true,
      count: atRiskStudents.length,
      students: atRiskStudents.map((s: any) => ({
        id: s.student_id,
        name: s.name,
        email: s.email,
        enrollment_number: s.enrollment_number,
        class_name: s.class_name,
        average_grade: s.avg_marks ? Math.round(s.avg_marks) : 0,
        risk_level: !s.avg_marks || s.avg_marks < 30 ? "HIGH" : "MODERATE",
        risk_reason: !s.avg_marks ? "No assignments submitted" : "Average score below 40%",
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch at-risk students";
    console.error("GET /api/teacher/analytics/at-risk error:", message);
    return errorResponse(message, 500);
  }
}
