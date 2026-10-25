// ============================================================
// SHIKSHA SAHAYAK OS API: /api/backend/spec
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getBackendArchitectureCatalog } from "../../lib/backendGateway";

export async function onRequestGet() {
  try {
    const catalog = await getBackendArchitectureCatalog();
    return jsonResponse(catalog, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
