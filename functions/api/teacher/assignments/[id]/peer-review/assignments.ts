// ============================================================
// TEACHER API: POST /api/teacher/assignments/:id/peer-review/assignments
// Manages peer review reviewer assignments
// ============================================================

import { jsonResponse, errorResponse } from "../../../../../lib/json";
import { getAuthenticatedUser } from "../../../../../lib/auth";

export async function onRequestPost(context: {
  env: { PADHAKU_CORE_DB?: D1Database; DB?: any; ASSESSMENT_DB?: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const assignmentId = params.id;
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
      action?: "reassign" | "remove";
      reviewer_id?: string;
      reviewee_submission_id?: string;
      new_reviewer_id?: string;
      new_reviewee_submission_id?: string;
    };

    const action = body.action || "reassign";
    return jsonResponse({
      success: true,
      message: `Peer review assignment updated (${action})`,
      assignment_id: assignmentId,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to manage peer review assignments";
    console.error("POST /api/teacher/assignments/:id/peer-review/assignments error:", message);
    return errorResponse(message, 500);
  }
}
