// ============================================================
// SHIKSHA SAHAYAK OS API: /api/ia/hierarchy
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getCompleteHierarchyBreadcrumb } from "../../lib/informationArchitecture";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const resourceId = url.searchParams.get("resourceId");

  if (!resourceId) {
    return errorResponse("Missing resourceId query parameter", 400);
  }

  try {
    const breadcrumb = await getCompleteHierarchyBreadcrumb(env, resourceId);
    return jsonResponse(breadcrumb, {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=600",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
