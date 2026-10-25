// ============================================================
// SHIKSHA SAHAYAK OS API: /api/ia/explore
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getExploreModeTree } from "../../lib/informationArchitecture";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const universityId = url.searchParams.get("universityId") || undefined;

  try {
    const tree = await getExploreModeTree(env, universityId);
    return jsonResponse(tree, {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=3600",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
