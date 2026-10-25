// ============================================================
// TEACHER API: PUT /api/teacher/assignments/:id/submissions/:submissionId/grade
// Grades a specific submission for an assignment
// ============================================================

import { jsonResponse, errorResponse } from "../../../../../../lib/json";
import { getAuthenticatedUser } from "../../../../../../lib/auth";

export async function onRequestPut(context: {
  env: { PADHAKU_CORE_DB?: D1Database; DB?: any; ASSESSMENT_DB?: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string; submissionId: string };
}) {
  const { env, request, params } = context;
  const { id: assignmentId, submissionId } = params;
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
      question_grades?: Array<{ question_id: string; marks: number; feedback?: string }>;
      annotations?: object;
      return_to_student?: boolean;
      override_reason?: string;
    };

    const marks = body.marks !== undefined ? Number(body.marks) : null;
    const feedback = body.feedback || "";
    const status = body.return_to_student ? "RETURNED" : "GRADED";
    const nowIso = new Date().toISOString();

    await db
      .prepare(
        `UPDATE assignment_submissions
         SET marks = ?, feedback = ?, status = ?, graded_at = ?, graded_by = ?, updated_at = ?
         WHERE id = ? AND assignment_id = ?`
      )
      .bind(marks, feedback, status, nowIso, user.uid, nowIso, submissionId, assignmentId)
      .run();

    return jsonResponse({
      success: true,
      message: "Submission graded successfully",
      submission: {
        id: submissionId,
        assignment_id: assignmentId,
        marks,
        feedback,
        status,
        graded_at: nowIso,
        graded_by: user.uid,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to grade submission";
    console.error("PUT /api/teacher/assignments/:id/submissions/:submissionId/grade error:", message);
    return errorResponse(message, 500);
  }
}
