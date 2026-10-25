// ============================================================
// SHIKSHA SAHAYAK OS API: /api/mcl/status
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getMigrationStatusOverview } from "../../lib/migrationCompatibilityLayer";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { env } = context;

  try {
    const overview = await getMigrationStatusOverview(env);
    return jsonResponse(overview, {
      headers: {
        "Cache-Control": "public, max-age=30, s-maxage=300",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
