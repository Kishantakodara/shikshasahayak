// ============================================================
// TEACHER API: GET /api/teacher/subjects
// Assigned subjects for authenticated teacher from D1
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getAuthenticatedUser } from "../../lib/auth";

export async function onRequestGet(context: {
  request: Request;
  env: { DB: D1Database; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
}) {
  const { request, env } = context;
  const user = await getAuthenticatedUser(request, env);

  if (!user || !user.uid) {
    return errorResponse("Unauthorized - Teacher authentication required", 401);
  }

  try {
    const teacherId = user.uid;

    const { results } = await env.DB.prepare(
      `SELECT
         tsa.id AS assignment_id,
         tsa.subject_id,
         tsa.branch_id,
         tsa.semester,
         tsa.class_name,
         s.name AS subject_name,
         s.code AS subject_code,
         s.syllabus_link,
         b.name AS branch_name
       FROM teacher_subject_assignments tsa
       LEFT JOIN subjects s ON s.id = tsa.subject_id OR s.code = tsa.subject_id
       LEFT JOIN branches b ON b.id = tsa.branch_id OR b.slug = tsa.branch_id
       WHERE tsa.teacher_id = ?
       ORDER BY tsa.semester ASC, s.name ASC`
    )
      .bind(teacherId)
      .all();

    return jsonResponse({
      success: true,
      count: results?.length || 0,
      subjects: results || [],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch teacher subjects";
    return errorResponse(message, 500);
  }
}

export async function onRequestPost(context: {
  request: Request;
  env: { DB: D1Database; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
}) {
  const { request, env } = context;
  const user = await getAuthenticatedUser(request, env);

  if (!user || !user.uid) {
    return errorResponse("Unauthorized - Teacher authentication required", 401);
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      subject_id?: string;
      subjectId?: string;
      branch_id?: string;
      branchId?: string;
      semester?: number;
      class_name?: string;
      className?: string;
    };

    const subjectId = body.subject_id || body.subjectId || "general";
    const branchId = body.branch_id || body.branchId || "computer-engineering";
    const semester = Number(body.semester) || 1;
    const className = body.class_name || body.className || "Class";
    const assignmentId = `tsa_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    await env.DB.prepare(
      `INSERT INTO teacher_subject_assignments (id, teacher_id, subject_id, branch_id, semester, class_name)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(assignmentId, user.uid, subjectId, branchId, semester, className)
      .run();

    return jsonResponse({
      success: true,
      message: "Subject assigned successfully",
      assignment: {
        id: assignmentId,
        teacher_id: user.uid,
        subject_id: subjectId,
        branch_id: branchId,
        semester,
        class_name: className,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to assign subject";
    return errorResponse(message, 500);
  }
}

