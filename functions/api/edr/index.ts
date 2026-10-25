// ============================================================
// SHIKSHA SAHAYAK OS API: /api/edr
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getEdrList } from "../../lib/edrRegistry";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);

  const filters = {
    status: (url.searchParams.get("status") as any) || undefined,
    searchQuery: url.searchParams.get("q") || undefined,
  };

  try {
    const list = await getEdrList(env, filters);
    return jsonResponse(list, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
