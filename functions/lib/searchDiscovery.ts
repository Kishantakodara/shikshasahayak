// ============================================================
// SHIKSHA SAHAYAK OS - ENTERPRISE SEARCH & DISCOVERY EDGE SERVICE
// ============================================================

import {
  SearchQueryRequest,
  SearchResponsePayload,
  SearchResultCard,
  SearchFacetsResult,
  SearchSuggestionResult,
  ZeroResultFallbackPayload,
  DiscoveryFeedPayload,
} from "../../src/types/search-discovery";
import { queryLearningResources, Env } from "./contentEngine";
import { generateStandardDisplayName } from "./contentGovernance";

/**
 * Normalizes search queries by expanding academic abbreviations and cleaning tokens.
 * Example: "os notes" -> "operating system notes"
 */
export async function normalizeSearchQuery(env: Env, rawQuery: string): Promise<string> {
  if (!rawQuery || !rawQuery.trim()) return "";

  const trimmed = rawQuery.trim().toLowerCase();
  try {
    const row = await env.DB.prepare(
      `SELECT expanded_term FROM search_dictionary WHERE term = ? LIMIT 1`
    )
      .bind(trimmed)
      .first<{ expanded_term: string }>();

    if (row && row.expanded_term) {
      return row.expanded_term;
    }
  } catch {
    // Fallback dictionary
    const fallbackMap: Record<string, string> = {
      os: "Operating System",
      dbms: "Database Management System",
      cn: "Computer Networks",
      se: "Software Engineering",
      ada: "Analysis and Design of Algorithms",
      toc: "Theory of Computation",
      pyq: "Previous Year Questions",
    };
    if (fallbackMap[trimmed]) return fallbackMap[trimmed];
  }

  return rawQuery.trim();
}

/**
 * Calculates dynamic relevance ranking score based on text match, popularity, freshness, and personalization.
 */
export function calculateRelevanceScore(params: {
  textMatch: boolean;
  views: number;
  downloads: number;
  ratingAvg: number;
  isPersonalized: boolean;
  isFacultyPick: boolean;
}): number {
  let score = params.textMatch ? 50.0 : 20.0;
  score += Math.min(params.views * 0.05, 15.0);
  score += Math.min(params.downloads * 0.1, 15.0);
  score += params.ratingAvg * 2.0;
  if (params.isPersonalized) score += 10.0;
  if (params.isFacultyPick) score += 5.0;

  return Math.min(Number(score.toFixed(1)), 100.0);
}

/**
 * Executes platform-wide multi-source enterprise search with ranking, faceting, and personalization.
 */
export async function executeEnterpriseSearch(
  env: Env,
  request: SearchQueryRequest
): Promise<SearchResponsePayload> {
  const normalizedQuery = await normalizeSearchQuery(env, request.query || "");
  const page = request.page || 1;
  const limit = request.limit || 20;

  // Execute underlying metadata search
  const searchResult = await queryLearningResources(env, {
    universityId: request.filters?.universityId || request.studentProfile?.universityId,
    branchId: request.filters?.branchId || request.studentProfile?.branchId,
    semester: request.filters?.semester || request.studentProfile?.semester,
    subjectId: request.filters?.subjectId,
    unitNo: request.filters?.unitNo,
    resourceType: request.filters?.resourceType,
    difficulty: request.filters?.difficulty,
    searchQuery: normalizedQuery || request.query,
    tags: request.filters?.tags,
    page,
    limit,
  });

  const cards: SearchResultCard[] = searchResult.resources.map((r) => {
    const isPersonalized = Boolean(
      request.studentProfile?.branchId && r.branchId === request.studentProfile.branchId
    );
    const score = calculateRelevanceScore({
      textMatch: true,
      views: r.views,
      downloads: r.downloads,
      ratingAvg: r.ratingAvg,
      isPersonalized,
      isFacultyPick: r.status === "approved",
    });

    return {
      id: r.id,
      title: r.title,
      displayName: generateStandardDisplayName({
        subjectName: r.subjectName,
        unitNo: r.unitNo || undefined,
        topicTitle: r.topicTitle || undefined,
        resourceTypeName: r.resourceType,
        universityShortName: r.universityName,
        branchShortName: r.branchName,
        semester: r.semester,
        rawTitle: r.title,
      }),
      resourceType: r.resourceType,
      universityName: r.universityName,
      degreeName: r.degreeName,
      branchName: r.branchName,
      semester: r.semester,
      subjectName: r.subjectName,
      subjectCode: r.subjectCode,
      unitNo: r.unitNo || undefined,
      topicTitle: r.topicTitle || undefined,
      shortDescription: r.description,
      tags: r.tags,
      difficulty: r.difficulty || "intermediate",
      language: r.language,
      ratingAvg: r.ratingAvg,
      downloadCount: r.downloads,
      viewCount: r.views,
      estimatedReadingTimeMins: r.estimatedReadingTimeMinutes,
      fileSizeBytes: r.sizeBytes,
      downloadUrl: (r as any).downloadUrl || (r as any).fileUrl || '',
      relevanceScore: score,
      isFacultyPick: r.status === "approved",
      isStudentFavorite: r.ratingAvg >= 4.5,
    };
  });

  // Calculate facets
  const facets: SearchFacetsResult = {
    resourceTypeCounts: {},
    branchCounts: {},
    semesterCounts: {},
    difficultyCounts: {},
    subjectCounts: {},
    totalMatchingDocs: searchResult.total,
  };

  cards.forEach((c) => {
    facets.resourceTypeCounts[c.resourceType] = (facets.resourceTypeCounts[c.resourceType] || 0) + 1;
    if (c.branchName) facets.branchCounts[c.branchName] = (facets.branchCounts[c.branchName] || 0) + 1;
    if (c.semester) facets.semesterCounts[c.semester] = (facets.semesterCounts[c.semester] || 0) + 1;
    if (c.difficulty) facets.difficultyCounts[c.difficulty] = (facets.difficultyCounts[c.difficulty] || 0) + 1;
    if (c.subjectName) facets.subjectCounts[c.subjectName] = (facets.subjectCounts[c.subjectName] || 0) + 1;
  });

  // Zero result fallback check
  let fallback: ZeroResultFallbackPayload | null = null;
  if (cards.length === 0 && request.query) {
    fallback = await getZeroResultFallback(env, request.query);
  }

  return {
    query: request.query || "",
    normalizedQuery,
    mode: request.mode || "global",
    results: cards,
    facets,
    totalResults: searchResult.total,
    page: searchResult.page,
    limit: searchResult.limit,
    totalPages: searchResult.totalPages,
    fallback,
  };
}

/**
 * Returns live autocomplete and query suggestions.
 */
export async function getSearchAutocompleteSuggestions(
  env: Env,
  prefix: string
): Promise<SearchSuggestionResult[]> {
  if (!prefix || prefix.trim().length < 2) return [];

  const cleanPrefix = prefix.trim().toLowerCase();
  const suggestions: SearchSuggestionResult[] = [];

  try {
    const { results: subRows } = await env.DB.prepare(
      `SELECT name, code FROM subjects WHERE LOWER(name) LIKE ? OR LOWER(code) LIKE ? LIMIT 5`
    )
      .bind(`%${cleanPrefix}%`, `%${cleanPrefix}%`)
      .all<Record<string, unknown>>();

    (subRows || []).forEach((s: any) => {
      suggestions.push({
        term: String(s.name),
        type: "subject",
        displayText: `${s.name} (${s.code})`,
        contextInfo: "Subject",
      });
    });

    const { results: docRows } = await env.DB.prepare(
      `SELECT title, resource_type FROM documents WHERE LOWER(title) LIKE ? LIMIT 5`
    )
      .bind(`%${cleanPrefix}%`)
      .all<Record<string, unknown>>();

    (docRows || []).forEach((d: any) => {
      suggestions.push({
        term: String(d.title),
        type: "resource",
        displayText: String(d.title),
        contextInfo: String(d.resource_type).toUpperCase(),
      });
    });
  } catch (error) {
    console.error("Error in getSearchAutocompleteSuggestions:", error);
  }

  return suggestions;
}

/**
 * Returns personalized discovery feed (Continue learning, recommended next steps, trending).
 */
export async function getDiscoveryFeed(
  env: Env,
  studentProfile?: { branchId?: string; semester?: number }
): Promise<DiscoveryFeedPayload> {
  const searchResult = await executeEnterpriseSearch(env, {
    query: "",
    filters: { branchId: studentProfile?.branchId, semester: studentProfile?.semester },
    limit: 10,
  });

  return {
    continueLearningQueue: searchResult.results.slice(0, 3),
    recommendedNextSteps: searchResult.results.slice(3, 6),
    trendingMaterials: searchResult.results.slice(0, 5),
    facultyPicks: searchResult.results.filter((r) => r.isFacultyPick).slice(0, 4),
    popularSubjects: [
      { id: "sub_os", name: "Operating Systems", resourceCount: 42 },
      { id: "sub_dbms", name: "Database Management Systems", resourceCount: 38 },
      { id: "sub_cn", name: "Computer Networks", resourceCount: 35 },
    ],
  };
}

/**
 * Zero-result fallback engine providing suggestions when 0 exact results match.
 */
export async function getZeroResultFallback(
  env: Env,
  rawQuery: string
): Promise<ZeroResultFallbackPayload> {
  const normalizedQuery = await normalizeSearchQuery(env, rawQuery);

  const fallbackFeed = await executeEnterpriseSearch(env, { query: "", limit: 5 });

  return {
    originalQuery: rawQuery,
    normalizedQuery,
    suggestedSpelling: normalizedQuery !== rawQuery.trim().toLowerCase() ? normalizedQuery : null,
    suggestedSubjects: [
      { id: "sub_os", name: "Operating System", code: "3150702" },
      { id: "sub_dbms", name: "Database Management System", code: "3150703" },
    ],
    suggestedBroaderKeywords: ["Engineering Notes", "GTU PYQs", "Formula Sheets", "Lab Manuals"],
    trendingResources: fallbackFeed.results,
  };
}

/**
 * Convenience wrapper for searching catalog resources in personalization engine.
 */
export async function searchCatalogResources(
  env: Env,
  params: { query?: string; filters?: any; page?: number; limit?: number }
) {
  const searchResult = await executeEnterpriseSearch(env, {
    query: params.query || "",
    filters: params.filters,
    page: params.page || 1,
    limit: params.limit || 10,
  });

  return {
    items: searchResult.results,
    total: searchResult.totalResults,
    page: searchResult.page,
    limit: searchResult.limit,
  };
}
