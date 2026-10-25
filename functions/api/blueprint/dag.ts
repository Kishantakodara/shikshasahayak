// ============================================================
// SHIKSHA SAHAYAK OS API: /api/blueprint/dag
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getMasterDependencyGraph } from "../../lib/masterIntegrationGateway";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { env } = context;

  try {
    const dag = await getMasterDependencyGraph(env);
    return jsonResponse(dag, {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=1800",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
