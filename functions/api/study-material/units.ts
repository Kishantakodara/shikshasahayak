// ============================================================
// SHIKSHA SAHAYAK OS API: /api/study-material/units
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getSubjectUnitHierarchy } from "../../lib/studyMaterialService";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const subjectId = url.searchParams.get("subjectId");

  if (!subjectId) {
    return errorResponse("Missing subjectId query parameter", 400);
  }

  try {
    const units = await getSubjectUnitHierarchy(env, subjectId);
    return jsonResponse(units, {
      headers: { "Cache-Control": "public, max-age=300, s-maxage=1800" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
