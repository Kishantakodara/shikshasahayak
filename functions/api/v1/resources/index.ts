// ============================================================
// SHIKSHA SAHAYAK OS API: /api/v1/resources
// ============================================================

import { createSuccessEnvelope, createErrorEnvelope } from "../../../lib/apiManager";
import { queryLearningResources, Env } from "../../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);

  try {
    const page = url.searchParams.get("page") ? Number(url.searchParams.get("page")) : 1;
    const limit = url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : 20;

    const result = await queryLearningResources(env, {
      universityId: url.searchParams.get("universityId") || undefined,
      branchId: url.searchParams.get("branchId") || undefined,
      semester: url.searchParams.get("semester") ? Number(url.searchParams.get("semester")) : undefined,
      subjectId: url.searchParams.get("subjectId") || undefined,
      resourceType: (url.searchParams.get("resourceType") as any) || undefined,
      searchQuery: url.searchParams.get("q") || undefined,
      page,
      limit,
    });

    return createSuccessEnvelope(
      result.resources,
      "Learning resources fetched successfully",
      {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasMore: result.page < result.totalPages,
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return createErrorEnvelope(500, message, "RESOURCE_FETCH_ERROR");
  }
}
