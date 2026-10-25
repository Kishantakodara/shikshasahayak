// ============================================================
// SHIKSHA SAHAYAK OS API: /api/v1/health
// ============================================================

import { getApiHealthStatus, createSuccessEnvelope, createErrorEnvelope } from "../../lib/apiManager";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { env } = context;

  try {
    const health = await getApiHealthStatus(env);
    return createSuccessEnvelope(health, "API Gateway healthy");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return createErrorEnvelope(500, message, "GATEWAY_HEALTH_ERROR");
  }
}
