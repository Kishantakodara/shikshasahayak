// ============================================================
// SHIKSHA SAHAYAK OS API: /api/frontend/patterns
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getUiPatternsOverview } from "../../lib/frontendPatterns";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { env } = context;

  try {
    const overview = await getUiPatternsOverview(env);
    return jsonResponse(overview, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
