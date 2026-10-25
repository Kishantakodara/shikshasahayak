// ============================================================
// SHIKSHA SAHAYAK OS API: /api/deployment/feature-flags
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getDevOpsOverviewReport, toggleFeatureFlag } from "../../lib/deploymentDevOps";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { env } = context;

  try {
    const report = await getDevOpsOverviewReport(env);
    return jsonResponse(report.featureFlags, {
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
    const body = (await request.json()) as { flagKey: string; isEnabled: boolean };

    if (!body || !body.flagKey || typeof body.isEnabled !== "boolean") {
      return errorResponse("Missing flagKey or isEnabled boolean", 400);
    }

    const success = await toggleFeatureFlag(env, body.flagKey, body.isEnabled);
    return jsonResponse({ success, flagKey: body.flagKey, isEnabled: body.isEnabled });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
