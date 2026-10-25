// ============================================================
// SHIKSHA SAHAYAK OS API: /api/security/audit
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getSecurityOverviewReport } from "../../lib/securityEngine";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { env } = context;

  try {
    const report = await getSecurityOverviewReport(env);
    return jsonResponse(report, {
      headers: {
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
