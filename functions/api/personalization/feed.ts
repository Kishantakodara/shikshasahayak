// ============================================================
// SHIKSHA SAHAYAK OS API: /api/personalization/feed
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getPersonalizedStudentFeed } from "../../lib/personalizationEngine";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId") || "guest_student";
  const exploreMode = url.searchParams.get("explore") === "true";

  try {
    const feed = await getPersonalizedStudentFeed(env, userId, exploreMode);
    return jsonResponse(feed, {
      headers: {
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
