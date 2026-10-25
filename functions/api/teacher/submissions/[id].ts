// ============================================================
// TEACHER API: GET / PUT /api/teacher/submissions/:id
// Submission details retrieval and grading updates
// ============================================================

import { jsonResponse, errorResponse } from "../../../lib/json";
import { getAuthenticatedUser } from "../../../lib/auth";

export async function onRequestGet(context: {
  env: { PADHAKU_CORE_DB?: D1Database; DB?: any; ASSESSMENT_DB?: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const submissionId = params.id;
  const db = (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB) || env.DB;

  if (!db) {
    return errorResponse("Database binding not found", 500);
  }

  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user || !user.uid) {
      return errorResponse("Unauthorized - Teacher authentication required", 401);
    }

    const submission = await db
      .prepare(
        `SELECT 
           asub.id,
           asub.assignment_id,
           asub.student_id,
           asub.status,
           asub.submitted_at,
           asub.graded_at,
           asub.graded_by,
           asub.marks,
           asub.feedback,
           asub.is_late,
           asub.resubmit_count,
           asub.created_at,
           asub.updated_at,
           asub.text_content,
           asub.attachments,
           asub.external_links,
           asub.annotations,
           a.title as assignment_title,
           a.description as assignment_description,
           a.instructions,
           a.total_marks,
           a.rubric,
           a.due_date,
           a.late_penalty_percent,
           a.class_id,
           COALESCE(c.teacher_id, a.created_by, '') as class_teacher_id,
           COALESCE(sp.name, u.display_name, 'Student') as student_name,
           COALESCE(sp.email, u.email, '') as student_email,
           ce.enrollment_number
         FROM assignment_submissions asub
         JOIN assignments a ON asub.assignment_id = a.id
         LEFT JOIN classes c ON a.class_id = c.id
         LEFT JOIN class_enrollments ce ON asub.student_id = ce.student_id AND ce.class_id = a.class_id
         LEFT JOIN student_profiles sp ON asub.student_id = sp.user_id
         LEFT JOIN unified_users u ON u.id = asub.student_id OR u.uid = asub.student_id
         WHERE asub.id = ?`
      )
      .bind(submissionId)
      .first();

    if (!submission) {
      return errorResponse("Submission not found", 404);
    }

    if (submission.class_teacher_id && submission.class_teacher_id !== user.uid && user.role !== "admin") {
      return errorResponse("Forbidden: You can only view submissions for your own assignments", 403);
    }

    // Get questions if structured
    let questions: any[] = [];
    try {
      const qRes = await db
        .prepare(`SELECT * FROM assignment_questions WHERE assignment_id = ? ORDER BY question_number ASC`)
        .bind(submission.assignment_id)
        .all();
      questions = qRes.results || [];
    } catch {
      questions = [];
    }

    const submissionData = {
      ...submission,
      attachments: submission.attachments ? (typeof submission.attachments === "string" ? JSON.parse(submission.attachments) : submission.attachments) : [],
      external_links: submission.external_links ? (typeof submission.external_links === "string" ? JSON.parse(submission.external_links) : submission.external_links) : [],
      annotations: submission.annotations ? (typeof submission.annotations === "string" ? JSON.parse(submission.annotations) : submission.annotations) : null,
      rubric: submission.rubric ? (typeof submission.rubric === "string" ? JSON.parse(submission.rubric) : submission.rubric) : null,
      questions,
      grade_percentage: submission.marks !== null && submission.total_marks > 0 
        ? Math.round((submission.marks / submission.total_marks) * 100) 
        : null,
    };

    return jsonResponse(submissionData);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load submission";
    console.error("GET /api/teacher/submissions/:id error:", message);
    return errorResponse(message, 500);
  }
}

export async function onRequestPut(context: {
  env: { PADHAKU_CORE_DB?: D1Database; DB?: any; ASSESSMENT_DB?: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const submissionId = params.id;
  const db = (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB) || env.DB;

  if (!db) {
    return errorResponse("Database binding not found", 500);
  }

  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user || !user.uid) {
      return errorResponse("Unauthorized - Teacher authentication required", 401);
    }

    const body = (await request.json().catch(() => ({}))) as {
      marks?: number;
      feedback?: string;
      rubric_scores?: Record<string, { points: number; feedback?: string }>;
      annotations?: object;
      return_to_student?: boolean;
    };

    const marks = body.marks !== undefined ? Number(body.marks) : null;
    const feedback = body.feedback || "";
    const status = body.return_to_student ? "RETURNED" : "GRADED";
    const nowIso = new Date().toISOString();

    await db
      .prepare(
        `UPDATE assignment_submissions
         SET marks = ?, feedback = ?, status = ?, graded_at = ?, graded_by = ?, updated_at = ?
         WHERE id = ?`
      )
      .bind(marks, feedback, status, nowIso, user.uid, nowIso, submissionId)
      .run();

    return jsonResponse({
      success: true,
      message: "Submission graded successfully",
      submission: {
        id: submissionId,
        marks,
        feedback,
        status,
        graded_at: nowIso,
        graded_by: user.uid,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to grade submission";
    console.error("PUT /api/teacher/submissions/:id error:", message);
    return errorResponse(message, 500);
  }
}
