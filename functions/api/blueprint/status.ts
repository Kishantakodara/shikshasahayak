// ============================================================
// SHIKSHA SAHAYAK OS API: /api/blueprint/status
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getMasterBlueprintReport } from "../../lib/masterIntegrationGateway";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { env } = context;

  try {
    const report = await getMasterBlueprintReport(env);
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
