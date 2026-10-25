// ============================================================
// SHIKSHA SAHAYAK OS API: /api/content/domination
// SECURITY: Authenticated user for ratings, public GET for taxonomy
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getGTUAcademicTaxonomyTree, recordContentRatingFeedback, getGTUContentDominationSummary } from "../../lib/gtuContentDominationService";
import { getAuthenticatedUser } from "../../lib/auth";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const branch = url.searchParams.get("branch");
  const semesterParam = url.searchParams.get("semester");

  try {
    if (branch && semesterParam) {
      const sem = Number(semesterParam);
      const tree = await getGTUAcademicTaxonomyTree(env, branch, sem);
      return jsonResponse(tree, { headers: { "Cache-Control": "public, max-age=300" } });
    }

    const summary = await getGTUContentDominationSummary(env);
    return jsonResponse(summary, { headers: { "Cache-Control": "public, max-age=300" } });
  } catch (error: unknown) {
    return errorResponse("Internal Server Error", 500);
  }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  const user = await getAuthenticatedUser(request, env);
  if (!user) return errorResponse("Unauthorized", 401);

  try {
    const body = (await request.json()) as {
      resourceId: string;
      rating: number;
      feedbackText?: string;
    };

    if (!body || !body.resourceId || !body.rating) {
      return errorResponse("Missing required fields: resourceId, rating", 400);
    }

    const success = await recordContentRatingFeedback(
      env,
      body.resourceId,
      user.uid,
      Math.min(Math.max(Number(body.rating), 1), 5),
      body.feedbackText ? String(body.feedbackText).slice(0, 500) : undefined
    );

    return jsonResponse({ success });
  } catch (error: unknown) {
    return errorResponse("Internal Server Error", 500);
  }
}
