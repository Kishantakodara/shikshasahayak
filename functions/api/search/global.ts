// ============================================================
// SHIKSHA SAHAYAK OS API: /api/search/global
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { executeEnterpriseSearch } from "../../lib/searchDiscovery";
import { Env } from "../../lib/contentEngine";
import { SearchQueryRequest } from "../../../src/types/search-discovery";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);

  const queryReq: SearchQueryRequest = {
    query: url.searchParams.get("q") || "",
    mode: (url.searchParams.get("mode") as any) || "global",
    filters: {
      universityId: url.searchParams.get("universityId") || undefined,
      degreeId: url.searchParams.get("degreeId") || undefined,
      branchId: url.searchParams.get("branchId") || undefined,
      semester: url.searchParams.get("semester") ? Number(url.searchParams.get("semester")) : undefined,
      subjectId: url.searchParams.get("subjectId") || undefined,
      resourceType: (url.searchParams.get("resourceType") as any) || undefined,
      difficulty: (url.searchParams.get("difficulty") as any) || undefined,
      isFeatured: url.searchParams.get("isFeatured") === "true",
      isTrending: url.searchParams.get("isTrending") === "true",
    },
    studentProfile: {
      universityId: url.searchParams.get("userUniv") || undefined,
      branchId: url.searchParams.get("userBranch") || undefined,
      semester: url.searchParams.get("userSem") ? Number(url.searchParams.get("userSem")) : undefined,
    },
    page: url.searchParams.get("page") ? Number(url.searchParams.get("page")) : 1,
    limit: url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : 20,
    sortBy: (url.searchParams.get("sortBy") as any) || "relevance",
  };

  try {
    const payload = await executeEnterpriseSearch(env, queryReq);
    return jsonResponse(payload, {
      headers: {
        "Cache-Control": "public, max-age=30, s-maxage=300",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
