// ============================================================
// SHIKSHA SAHAYAK OS API: /api/mcl/rollback
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { executeSafeRollback } from "../../lib/migrationCompatibilityLayer";
import { Env } from "../../lib/contentEngine";
import { RollbackRequest } from "../../../src/types/migration-mcl";

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    const payload = await request.json<RollbackRequest>();
    const result = await executeSafeRollback(env, payload.documentId);
    return jsonResponse(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
