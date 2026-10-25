// ============================================================
// SHIKSHA SAHAYAK OS API: /api/ia/search
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { executeUniversalIASearch } from "../../lib/informationArchitecture";
import { Env } from "../../lib/contentEngine";
import { UniversalIASearchParams } from "../../../src/types/information-architecture";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);

  const params: UniversalIASearchParams = {
    universityId: url.searchParams.get("universityId") || undefined,
    degreeId: url.searchParams.get("degreeId") || undefined,
    branchId: url.searchParams.get("branchId") || undefined,
    branchSlug: url.searchParams.get("branchSlug") || undefined,
    semester: url.searchParams.get("semester") ? Number(url.searchParams.get("semester")) : undefined,
    subjectId: url.searchParams.get("subjectId") || undefined,
    subjectSlug: url.searchParams.get("subjectSlug") || undefined,
    unitId: url.searchParams.get("unitId") || undefined,
    unitNo: url.searchParams.get("unitNo") ? Number(url.searchParams.get("unitNo")) : undefined,
    topicId: url.searchParams.get("topicId") || undefined,
    resourceType: (url.searchParams.get("resourceType") as any) || undefined,
    difficulty: url.searchParams.get("difficulty") || undefined,
    language: url.searchParams.get("language") || undefined,
    visibility: (url.searchParams.get("visibility") as any) || undefined,
    query: url.searchParams.get("q") || url.searchParams.get("query") || undefined,
    page: url.searchParams.get("page") ? Number(url.searchParams.get("page")) : 1,
    limit: url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : 20,
  };

  try {
    const response = await executeUniversalIASearch(env, params);
    return jsonResponse(response, {
      headers: {
        "Cache-Control": "public, max-age=30, s-maxage=300",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
