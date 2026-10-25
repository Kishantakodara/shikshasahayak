// ============================================================
// SHIKSHA SAHAYAK OS API: /api/mcl/backfill
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { executeBatchBackfill } from "../../lib/migrationCompatibilityLayer";
import { Env } from "../../lib/contentEngine";
import { MigrationBackfillRequest } from "../../../src/types/migration-mcl";

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    const payload = await request.json<MigrationBackfillRequest>().catch(() => ({ batchSize: 50 }));
    const result = await executeBatchBackfill(env, payload.batchSize || 50);

    return jsonResponse(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
