// ============================================================
// SHIKSHA SAHAYAK OS API: /api/quality/metrics
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getQualityOverviewReport } from "../../lib/qualityTelemetry";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { env } = context;

  try {
    const report = await getQualityOverviewReport(env);
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
