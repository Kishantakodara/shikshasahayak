// ============================================================
// SHIKSHA SAHAYAK OS - FRONTEND INFORMATION ARCHITECTURE CLIENT
// ============================================================

import {
  MasterHierarchyBreadcrumb,
  ExploreModeTree,
  ContentRelationshipEdge,
  UniversalIASearchParams,
  DiscoveryChannel,
} from "../types/information-architecture";
import { PaginatedResourceResponse } from "../types/content-engine";

/**
 * Fetches the complete 12-level hierarchy breadcrumb trail for a given resource ID.
 */
export async function fetchHierarchyBreadcrumb(
  resourceId: string
): Promise<MasterHierarchyBreadcrumb | null> {
  try {
    const res = await fetch(`/api/ia/hierarchy?resourceId=${encodeURIComponent(resourceId)}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch hierarchy breadcrumb (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error in IAClient.fetchHierarchyBreadcrumb:", error);
    return null;
  }
}

/**
 * Fetches the permission-aware Explore Mode Tree across Universities, Degrees, Branches, Semesters.
 */
export async function fetchExploreModeTree(
  universityId?: string
): Promise<ExploreModeTree> {
  try {
    const url = universityId
      ? `/api/ia/explore?universityId=${encodeURIComponent(universityId)}`
      : "/api/ia/explore";
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch Explore Mode tree (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error in IAClient.fetchExploreModeTree:", error);
    return { universities: [] };
  }
}

/**
 * Fetches connected graph edges for a given resource (next, previous, prerequisites, recommendations).
 */
export async function fetchContentRelationships(
  resourceId: string
): Promise<ContentRelationshipEdge[]> {
  try {
    const res = await fetch(`/api/ia/relationships/${encodeURIComponent(resourceId)}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error in IAClient.fetchContentRelationships:", error);
    return [];
  }
}

/**
 * Executes a multi-level search across the entire Information Architecture hierarchy.
 */
export async function executeIASearch(
  params: UniversalIASearchParams = {}
): Promise<PaginatedResourceResponse> {
  try {
    const urlParams = new URLSearchParams();
    if (params.universityId) urlParams.set("universityId", params.universityId);
    if (params.degreeId) urlParams.set("degreeId", params.degreeId);
    if (params.branchId) urlParams.set("branchId", params.branchId);
    if (params.branchSlug) urlParams.set("branchSlug", params.branchSlug);
    if (params.semester !== undefined) urlParams.set("semester", String(params.semester));
    if (params.subjectId) urlParams.set("subjectId", params.subjectId);
    if (params.subjectSlug) urlParams.set("subjectSlug", params.subjectSlug);
    if (params.unitId) urlParams.set("unitId", params.unitId);
    if (params.unitNo !== undefined) urlParams.set("unitNo", String(params.unitNo));
    if (params.topicId) urlParams.set("topicId", params.topicId);
    if (params.difficulty) urlParams.set("difficulty", params.difficulty);
    if (params.language) urlParams.set("language", params.language);
    if (params.visibility) urlParams.set("visibility", params.visibility);
    if (params.query) urlParams.set("q", params.query);
    if (params.page) urlParams.set("page", String(params.page));
    if (params.limit) urlParams.set("limit", String(params.limit));

    const res = await fetch(`/api/ia/search?${urlParams.toString()}`);
    if (!res.ok) {
      throw new Error(`Failed to execute IA search (${res.status})`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error in IAClient.executeIASearch:", error);
    return {
      resources: [],
      total: 0,
      page: params.page || 1,
      limit: params.limit || 20,
      totalPages: 0,
    };
  }
}

/**
 * Fetches discovery feed by channel (Browse, Popular, Trending, Faculty Recommended, Recent).
 */
export async function fetchDiscoveryFeed(
  channel: DiscoveryChannel = "popular",
  params: UniversalIASearchParams = {}
): Promise<PaginatedResourceResponse> {
  try {
    const urlParams = new URLSearchParams();
    urlParams.set("channel", channel);
    if (params.universityId) urlParams.set("universityId", params.universityId);
    if (params.branchId) urlParams.set("branchId", params.branchId);
    if (params.branchSlug) urlParams.set("branchSlug", params.branchSlug);
    if (params.semester !== undefined) urlParams.set("semester", String(params.semester));
    if (params.subjectId) urlParams.set("subjectId", params.subjectId);
    if (params.limit) urlParams.set("limit", String(params.limit));

    const res = await fetch(`/api/ia/discovery?${urlParams.toString()}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch discovery feed (${res.status})`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error in IAClient.fetchDiscoveryFeed:", error);
    return {
      resources: [],
      total: 0,
      page: 1,
      limit: params.limit || 12,
      totalPages: 0,
    };
  }
}
