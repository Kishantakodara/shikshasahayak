// ============================================================
// SHIKSHA SAHAYAK OS API: /api/performance/invalidation
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { purgeEdgeCacheKey } from "../../lib/performanceTelemetry";
import { Env } from "../../lib/contentEngine";

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    const body = (await request.json()) as {
      targetKey: string;
      purgeReason: string;
      cacheZone?: any;
    };

    if (!body || !body.targetKey || !body.purgeReason) {
      return errorResponse("Missing targetKey or purgeReason", 400);
    }

    const success = await purgeEdgeCacheKey(env, body.targetKey, body.purgeReason, body.cacheZone);
    return jsonResponse({ success, targetKey: body.targetKey });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
