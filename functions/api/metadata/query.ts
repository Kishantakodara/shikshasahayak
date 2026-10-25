// ============================================================
// SHIKSHA SAHAYAK OS API: /api/metadata/query
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { queryByUniversalMetadata } from "../../lib/universalMetadata";
import { Env } from "../../lib/contentEngine";
import { UniversalMetadataQueryParams } from "../../../src/types/universal-metadata";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);

  const params: UniversalMetadataQueryParams = {
    universityId: url.searchParams.get("universityId") || undefined,
    branchId: url.searchParams.get("branchId") || undefined,
    semester: url.searchParams.get("semester") ? Number(url.searchParams.get("semester")) : undefined,
    subjectId: url.searchParams.get("subjectId") || undefined,
    unitNo: url.searchParams.get("unitNo") ? Number(url.searchParams.get("unitNo")) : undefined,
    resourceType: (url.searchParams.get("resourceType") as any) || undefined,
    difficulty: (url.searchParams.get("difficulty") as any) || undefined,
    isFeatured: url.searchParams.get("isFeatured") === "true",
    isTrending: url.searchParams.get("isTrending") === "true",
    isPopular: url.searchParams.get("isPopular") === "true",
    isFacultyPick: url.searchParams.get("isFacultyPick") === "true",
    examImportance: (url.searchParams.get("examImportance") as any) || undefined,
    query: url.searchParams.get("q") || undefined,
    page: url.searchParams.get("page") ? Number(url.searchParams.get("page")) : 1,
    limit: url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : 20,
  };

  try {
    const response = await queryByUniversalMetadata(env, params);
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
