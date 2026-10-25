// ============================================================
// SHIKSHA SAHAYAK OS API: /api/design-system/themes
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getDesignSystemCatalog } from "../../lib/designSystem";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { env } = context;

  try {
    const catalog = await getDesignSystemCatalog(env);
    return jsonResponse(catalog.themes, {
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=604800",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
