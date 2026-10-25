// ============================================================
// SHIKSHA SAHAYAK OS API: /api/taxonomy/resource/:id
// ============================================================

import { jsonResponse, errorResponse } from "../../../lib/json";
import { getUnifiedContentTaxonomy } from "../../../lib/contentTaxonomy";
import { Env } from "../../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; params: { id: string }; env: Env }) {
  const { params, env } = context;
  const resourceId = params.id;

  if (!resourceId) {
    return errorResponse("Missing resource ID parameter", 400);
  }

  try {
    const taxonomy = await getUnifiedContentTaxonomy(env, resourceId);

    if (!taxonomy) {
      return errorResponse("Resource taxonomy not found", 404);
    }

    return jsonResponse(taxonomy, {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=600",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
