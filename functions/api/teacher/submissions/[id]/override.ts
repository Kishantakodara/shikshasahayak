// ============================================================
// TEACHER API: POST /api/teacher/submissions/:id/override
// Overrides a graded submission with audit trail logging
// ============================================================

import { jsonResponse, errorResponse } from "../../../../lib/json";
import { getAuthenticatedUser } from "../../../../lib/auth";

export async function onRequestPost(context: {
  env: { PADHAKU_CORE_DB?: D1Database; DB?: D1Database; ASSESSMENT_DB?: D1Database; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
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
      new_marks?: number;
      newMarks?: number;
      reason?: string;
    };

    const newMarks = body.new_marks !== undefined ? Number(body.new_marks) : Number(body.newMarks);
    if (isNaN(newMarks)) {
      return errorResponse("Valid new_marks is required", 400);
    }

    const reason = body.reason || "Grade updated by educator";
    const nowIso = new Date().toISOString();

    const existingSub = await db
      .prepare(`SELECT id, marks, status FROM assignment_submissions WHERE id = ?`)
      .bind(submissionId)
      .first<{ id: string; marks: number; status: string }>();

    if (!existingSub) {
      return errorResponse("Submission not found", 404);
    }

    await db
      .prepare(
        `UPDATE assignment_submissions
         SET marks = ?, feedback = COALESCE(feedback || ' | Override: ' || ?, ?), updated_at = ?
         WHERE id = ?`
      )
      .bind(newMarks, reason, reason, nowIso, submissionId)
      .run();

    return jsonResponse({
      success: true,
      message: "Grade overridden successfully",
      submission_id: submissionId,
      old_marks: existingSub.marks,
      new_marks: newMarks,
      reason,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to override grade";
    console.error("POST /api/teacher/submissions/:id/override error:", message);
    return errorResponse(message, 500);
  }
}
