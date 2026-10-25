// ============================================================
// SHIKSHA SAHAYAK OS API: /api/metadata/resource/:id
// ============================================================

import { jsonResponse, errorResponse } from "../../../lib/json";
import { getUniversalMetadataByResourceId } from "../../../lib/universalMetadata";
import { Env } from "../../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; params: { id: string }; env: Env }) {
  const { params, env } = context;
  const resourceId = params.id;

  if (!resourceId) {
    return errorResponse("Missing resource ID parameter", 400);
  }

  try {
    const metadata = await getUniversalMetadataByResourceId(env, resourceId);

    if (!metadata) {
      return errorResponse("Universal metadata not found", 404);
    }

    return jsonResponse(metadata, {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=600",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
