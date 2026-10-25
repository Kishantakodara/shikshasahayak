// ============================================================
// SHIKSHA SAHAYAK OS API: /api/personalization/explore
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getPersonalizedStudentFeed } from "../../lib/personalizationEngine";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId") || "guest_student";

  try {
    const feed = await getPersonalizedStudentFeed(env, userId, true);
    return jsonResponse(feed, {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=1800",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
