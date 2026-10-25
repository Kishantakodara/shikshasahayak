// ============================================================
// SHIKSHA SAHAYAK OS API: /api/content-engine/resources
// ============================================================

import { jsonResponse, errorResponse } from "../../../lib/json";
import { queryLearningResources, Env } from "../../../lib/contentEngine";
import { ResourceFilterQuery, ResourceType, ResourceDifficulty, ResourceVisibility, ResourceStatus } from "../../../../src/types/content-engine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);

  const query: ResourceFilterQuery = {
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
    resourceType: (url.searchParams.get("resourceType") as ResourceType) || undefined,
    difficulty: (url.searchParams.get("difficulty") as ResourceDifficulty) || undefined,
    language: url.searchParams.get("language") || undefined,
    visibility: (url.searchParams.get("visibility") as ResourceVisibility) || undefined,
    status: (url.searchParams.get("status") as ResourceStatus) || undefined,
    searchQuery: url.searchParams.get("q") || url.searchParams.get("searchQuery") || undefined,
    sortBy: (url.searchParams.get("sortBy") as any) || "created_at",
    sortOrder: (url.searchParams.get("sortOrder") as "asc" | "desc") || "desc",
    page: url.searchParams.get("page") ? Number(url.searchParams.get("page")) : 1,
    limit: url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : 20,
  };

  try {
    const response = await queryLearningResources(env, query);
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
