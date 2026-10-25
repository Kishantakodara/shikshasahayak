// ============================================================
// TEACHER API: GET /api/teacher/analytics/dashboard
// Aggregated analytics dashboard for teacher classes and student engagement
// ============================================================

import { jsonResponse, errorResponse } from "../../../lib/json";
import { getAuthenticatedUser } from "../../../lib/auth";

export async function onRequestGet(context: {
  env: { PADHAKU_CORE_DB?: D1Database; DB?: D1Database; ASSESSMENT_DB?: D1Database; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
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

    // 1. Classes stats
    let classesFilter = "c.teacher_id = ?";
    const params: any[] = [user.uid];
    if (classId) {
      classesFilter += " AND c.id = ?";
      params.push(classId);
    }

    const classSummary = await db
      .prepare(
        `SELECT 
           COUNT(DISTINCT c.id) as total_classes,
           COUNT(DISTINCT ce.student_id) as total_students
         FROM classes c
         LEFT JOIN class_enrollments ce ON ce.class_id = c.id AND (ce.enrollment_status = 'ACTIVE' OR ce.status = 'active')
         WHERE ${classesFilter}`
      )
      .bind(...params)
      .first<{ total_classes: number; total_students: number }>();

    // 2. Assignment stats
    const assignSummary = await db
      .prepare(
        `SELECT 
           COUNT(DISTINCT a.id) as total_assignments,
           COUNT(DISTINCT asub.id) as total_submissions,
           AVG(CASE WHEN asub.marks IS NOT NULL AND a.total_marks > 0 THEN (asub.marks * 100.0 / a.total_marks) END) as average_grade
         FROM assignments a
         JOIN classes c ON a.class_id = c.id
         LEFT JOIN assignment_submissions asub ON asub.assignment_id = a.id
         WHERE ${classesFilter}`
      )
      .bind(...params)
      .first<{ total_assignments: number; total_submissions: number; average_grade: number | null }>();

    return jsonResponse({
      success: true,
      stats: {
        totalClasses: classSummary?.total_classes || 0,
        totalStudents: classSummary?.total_students || 0,
        totalAssignments: assignSummary?.total_assignments || 0,
        totalSubmissions: assignSummary?.total_submissions || 0,
        averageGradePercentage: assignSummary?.average_grade ? Math.round(assignSummary.average_grade) : 0,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch analytics dashboard";
    console.error("GET /api/teacher/analytics/dashboard error:", message);
    return errorResponse(message, 500);
  }
}
