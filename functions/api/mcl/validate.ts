// ============================================================
// SHIKSHA SAHAYAK OS API: /api/mcl/validate
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { runMigrationValidation } from "../../lib/migrationCompatibilityLayer";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { env } = context;

  try {
    const validation = await runMigrationValidation(env);
    return jsonResponse(validation, {
      headers: {
        "Cache-Control": "public, max-age=30, s-maxage=300",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
