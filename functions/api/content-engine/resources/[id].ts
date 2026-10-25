// ============================================================
// SHIKSHA SAHAYAK OS API: /api/content-engine/resources/:id
// ============================================================

import { jsonResponse, errorResponse } from "../../../lib/json";
import { getLearningResourceById, Env } from "../../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; params: { id: string }; env: Env }) {
  const { params, env } = context;
  const resourceId = params.id;

  if (!resourceId) {
    return errorResponse("Missing resource ID parameter", 400);
  }

  try {
    const resource = await getLearningResourceById(env, resourceId);

    if (!resource) {
      return errorResponse("Learning resource not found", 404);
    }

    return jsonResponse(resource, {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=600",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
