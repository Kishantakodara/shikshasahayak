// ============================================================
// SHIKSHA SAHAYAK OS API: /api/edr/:id
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getEdrByCode } from "../../lib/edrRegistry";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; params: { id: string }; env: Env }) {
  const { params, env } = context;
  const edrCode = params.id;

  if (!edrCode) {
    return errorResponse("Missing EDR code parameter", 400);
  }

  try {
    const record = await getEdrByCode(env, edrCode);
    if (!record) {
      return errorResponse("Engineering Decision Record not found", 404);
    }
    return jsonResponse(record, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
