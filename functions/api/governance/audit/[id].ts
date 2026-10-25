// ============================================================
// SHIKSHA SAHAYAK OS API: /api/governance/audit/:id
// ============================================================

import { jsonResponse, errorResponse } from "../../../lib/json";
import { getAuditLogs } from "../../../lib/contentGovernance";
import { Env } from "../../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; params: { id: string }; env: Env }) {
  const { params, env } = context;
  const documentId = params.id;

  if (!documentId) {
    return errorResponse("Missing document ID parameter", 400);
  }

  try {
    const logs = await getAuditLogs(env, documentId);
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
