// ============================================================
// SHIKSHA SAHAYAK OS API: /api/edr/health
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getEdrHealthDiagnostics } from "../../lib/edrRegistry";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { env } = context;

  try {
    const report = await getEdrHealthDiagnostics(env);
    return jsonResponse(report, {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
