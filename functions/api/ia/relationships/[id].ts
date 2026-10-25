// ============================================================
// SHIKSHA SAHAYAK OS API: /api/ia/relationships/:id
// ============================================================

import { jsonResponse, errorResponse } from "../../../lib/json";
import { getContentRelationships } from "../../../lib/informationArchitecture";
import { Env } from "../../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; params: { id: string }; env: Env }) {
  const { params, env } = context;
  const resourceId = params.id;

  if (!resourceId) {
    return errorResponse("Missing resource ID parameter", 400);
  }

  try {
    const relationships = await getContentRelationships(env, resourceId);
    return jsonResponse(relationships, {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=600",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
