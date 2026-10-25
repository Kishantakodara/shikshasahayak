// ============================================================
// SHIKSHA SAHAYAK OS API: /api/search/discovery
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getDiscoveryFeed } from "../../lib/searchDiscovery";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);

  const profile = {
    branchId: url.searchParams.get("branchId") || undefined,
    semester: url.searchParams.get("semester") ? Number(url.searchParams.get("semester")) : undefined,
  };

  try {
    const feed = await getDiscoveryFeed(env, profile);
    return jsonResponse(feed, {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
