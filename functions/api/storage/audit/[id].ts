// ============================================================
// SHIKSHA SAHAYAK OS API: /api/storage/audit/:id
// ============================================================

import { jsonResponse, errorResponse } from "../../../lib/json";
import { getAssetAuditLogs } from "../../../lib/storageDam";
import { Env } from "../../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; params: { id: string }; env: Env }) {
  const { params, env } = context;
  const assetId = params.id;

  if (!assetId) {
    return errorResponse("Missing asset ID parameter", 400);
  }

  try {
    const logs = await getAssetAuditLogs(env, assetId);
    return jsonResponse(logs, {
      headers: {
        "Cache-Control": "public, max-age=30, s-maxage=300",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
