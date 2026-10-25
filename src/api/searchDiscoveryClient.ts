// ============================================================
// SHIKSHA SAHAYAK OS - FRONTEND SEARCH & DISCOVERY API CLIENT
// ============================================================

import {
  SearchQueryRequest,
  SearchResponsePayload,
  SearchSuggestionResult,
  DiscoveryFeedPayload,
  ZeroResultFallbackPayload,
} from "../types/search-discovery";

/**
 * Executes platform-wide enterprise search with relevance ranking & facets.
 */
export async function executeGlobalSearch(
  request: SearchQueryRequest
): Promise<SearchResponsePayload | null> {
  try {
    const urlParams = new URLSearchParams();
    if (request.query) urlParams.set("q", request.query);
    if (request.mode) urlParams.set("mode", request.mode);
    if (request.filters?.universityId) urlParams.set("universityId", request.filters.universityId);
    if (request.filters?.branchId) urlParams.set("branchId", request.filters.branchId);
    if (request.filters?.semester !== undefined) urlParams.set("semester", String(request.filters.semester));
    if (request.filters?.subjectId) urlParams.set("subjectId", request.filters.subjectId);
    if (request.filters?.resourceType) urlParams.set("resourceType", request.filters.resourceType);
    if (request.filters?.difficulty) urlParams.set("difficulty", request.filters.difficulty);
    if (request.filters?.isFeatured) urlParams.set("isFeatured", "true");
    if (request.filters?.isTrending) urlParams.set("isTrending", "true");
    if (request.studentProfile?.branchId) urlParams.set("userBranch", request.studentProfile.branchId);
    if (request.studentProfile?.semester !== undefined) urlParams.set("userSem", String(request.studentProfile.semester));
    if (request.page) urlParams.set("page", String(request.page));
    if (request.limit) urlParams.set("limit", String(request.limit));
    if (request.sortBy) urlParams.set("sortBy", request.sortBy);

    const res = await fetch(`/api/search/global?${urlParams.toString()}`);
    if (!res.ok) {
      throw new Error(`Failed to execute global search (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error in SearchDiscoveryClient.executeGlobalSearch:", error);
    return null;
  }
}

/**
 * Fetches live autocomplete & query suggestions.
 */
export async function fetchSearchSuggestions(
  prefix: string
): Promise<SearchSuggestionResult[]> {
  try {
    if (!prefix || prefix.trim().length < 2) return [];
    const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(prefix)}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error in SearchDiscoveryClient.fetchSearchSuggestions:", error);
    return [];
  }
}

/**
 * Fetches personalized discovery feed (continue learning, trending, recommendations).
 */
export async function fetchDiscoveryFeed(profile?: {
  branchId?: string;
  semester?: number;
}): Promise<DiscoveryFeedPayload | null> {
  try {
    const urlParams = new URLSearchParams();
    if (profile?.branchId) urlParams.set("branchId", profile.branchId);
    if (profile?.semester !== undefined) urlParams.set("semester", String(profile.semester));

    const res = await fetch(`/api/search/discovery?${urlParams.toString()}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch discovery feed (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error in SearchDiscoveryClient.fetchDiscoveryFeed:", error);
    return null;
  }
}

/**
 * Fetches zero-result fallback recommendations when 0 exact results match.
 */
export async function fetchZeroResultFallback(
  query: string
): Promise<ZeroResultFallbackPayload | null> {
  try {
    const res = await fetch(`/api/search/fallback?q=${encodeURIComponent(query)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Error in SearchDiscoveryClient.fetchZeroResultFallback:", error);
    return null;
  }
}
