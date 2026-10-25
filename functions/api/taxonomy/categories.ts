// ============================================================
// SHIKSHA SAHAYAK OS API: /api/taxonomy/categories
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getTaxonomyMasterLookup } from "../../lib/contentTaxonomy";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { env } = context;

  try {
    const lookup = await getTaxonomyMasterLookup(env);
    return jsonResponse(lookup, {
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
