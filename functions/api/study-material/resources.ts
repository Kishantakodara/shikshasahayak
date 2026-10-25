// ============================================================
// SHIKSHA SAHAYAK OS API: /api/study-material/resources
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getStudyMaterialResources } from "../../lib/studyMaterialService";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);

  const branchId = url.searchParams.get("branchId") || undefined;
  const semesterParam = url.searchParams.get("semester");
  const semester = semesterParam ? Number(semesterParam) : undefined;
  const subjectId = url.searchParams.get("subjectId") || undefined;
  const unitId = url.searchParams.get("unitId") || undefined;
  const resourceType = (url.searchParams.get("resourceType") as any) || undefined;

  try {
    const resources = await getStudyMaterialResources(env, {
      branchId,
      semester,
      subjectId,
      unitId,
      resourceType,
    });

    return jsonResponse(resources, {
      headers: { "Cache-Control": "public, max-age=120, s-maxage=600" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
