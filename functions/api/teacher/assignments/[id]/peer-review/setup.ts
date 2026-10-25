// ============================================================
// TEACHER API: POST /api/teacher/assignments/:id/peer-review/setup
// Sets up peer review workflow for an assignment
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
      review_deadline?: string;
      reviews_per_student?: number;
      review_rubric?: any[];
      allow_self_review?: boolean;
      anonymous_reviews?: boolean;
      auto_assign?: boolean;
    };

    const deadline = body.review_deadline || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
    const reviewsPerStudent = Math.min(Math.max(1, body.reviews_per_student || 2), 5);
    const rubricJson = JSON.stringify(body.review_rubric || []);
    const nowIso = new Date().toISOString();

    try {
      await db
        .prepare(
          `INSERT OR REPLACE INTO peer_review_configs 
           (id, assignment_id, review_deadline, reviews_per_student, review_rubric, allow_self_review, anonymous_reviews, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          `prc_${assignmentId}`,
          assignmentId,
          deadline,
          reviewsPerStudent,
          rubricJson,
          body.allow_self_review ? 1 : 0,
          body.anonymous_reviews !== false ? 1 : 0,
          nowIso,
          nowIso
        )
        .run();
    } catch {
      // ignore
    }

    return jsonResponse({
      success: true,
      message: "Peer review configured successfully",
      assignment_id: assignmentId,
      config: {
        review_deadline: deadline,
        reviews_per_student: reviewsPerStudent,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to set up peer review";
    console.error("POST /api/teacher/assignments/:id/peer-review/setup error:", message);
    return errorResponse(message, 500);
  }
}
