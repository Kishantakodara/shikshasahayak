// ============================================================
// SHIKSHA SAHAYAK OS API: /api/taxonomy/query
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { queryByTaxonomy } from "../../lib/contentTaxonomy";
import { Env } from "../../lib/contentEngine";
import { TaxonomyQueryFilterParams } from "../../../src/types/content-taxonomy";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);

  const params: TaxonomyQueryFilterParams = {
    categoryCode: (url.searchParams.get("category") as any) || undefined,
    educationalPurpose: (url.searchParams.get("purpose") as any) || undefined,
    learningStage: (url.searchParams.get("stage") as any) || undefined,
    qualityBadge: (url.searchParams.get("qualityBadge") as any) || undefined,
    mediaType: (url.searchParams.get("mediaType") as any) || undefined,
    difficulty: (url.searchParams.get("difficulty") as any) || undefined,
    language: (url.searchParams.get("language") as any) || undefined,
    visibility: (url.searchParams.get("visibility") as any) || undefined,
    status: (url.searchParams.get("status") as any) || undefined,
    searchQuery: url.searchParams.get("q") || undefined,
    sortBy: (url.searchParams.get("sortBy") as any) || "popularity",
    sortOrder: (url.searchParams.get("sortOrder") as "asc" | "desc") || "desc",
    page: url.searchParams.get("page") ? Number(url.searchParams.get("page")) : 1,
    limit: url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : 20,
  };

  try {
    const response = await queryByTaxonomy(env, params);
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
