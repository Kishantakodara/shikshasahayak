// ============================================================
// SHIKSHA SAHAYAK OS API: /api/quality/debt
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getQualityOverviewReport, logTechnicalDebt } from "../../lib/qualityTelemetry";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { env } = context;

  try {
    const report = await getQualityOverviewReport(env);
    return jsonResponse(report.openTechnicalDebt, {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    const body = (await request.json()) as {
      moduleKey: string;
      title: string;
      description: string;
      severity?: any;
      refactoringEffortDays?: number;
    };

    if (!body || !body.moduleKey || !body.title || !body.description) {
      return errorResponse("Missing moduleKey, title, or description", 400);
    }

    const success = await logTechnicalDebt(env, body);
    return jsonResponse({ success, title: body.title });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
