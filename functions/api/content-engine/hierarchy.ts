// ============================================================
// SHIKSHA SAHAYAK OS API: /api/content-engine/hierarchy
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getContentHierarchy, Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);

  const universityId = url.searchParams.get("universityId") || undefined;
  const branchId = url.searchParams.get("branchId") || undefined;
  const semester = url.searchParams.get("semester") ? Number(url.searchParams.get("semester")) : undefined;

  try {
    const hierarchy = await getContentHierarchy(env, universityId, branchId, semester);
    return jsonResponse(hierarchy, {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=3600",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
