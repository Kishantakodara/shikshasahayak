// ============================================================
// SHIKSHA SAHAYAK OS API: /api/search/fallback
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getZeroResultFallback } from "../../lib/searchDiscovery";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const q = url.searchParams.get("q") || "";

  try {
    const fallback = await getZeroResultFallback(env, q);
    return jsonResponse(fallback, {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
