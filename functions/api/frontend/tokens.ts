// ============================================================
// SHIKSHA SAHAYAK OS API: /api/frontend/tokens
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getUiPatternsOverview } from "../../lib/frontendPatterns";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { env } = context;

  try {
    const overview = await getUiPatternsOverview(env);
    return jsonResponse(overview.tokens, {
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=604800",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
