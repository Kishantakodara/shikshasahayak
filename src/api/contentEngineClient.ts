// ============================================================
// SHIKSHA SAHAYAK OS - FRONTEND CONTENT ENGINE API CLIENT
// ============================================================

import {
  LearningResource,
  ResourceFilterQuery,
  PaginatedResourceResponse,
  ContentHierarchyNode,
  ResourceTypeConfig,
} from "../types/content-engine";

/**
 * Fetches a single learning resource by ID with full hydrated metadata.
 */
export async function fetchLearningResource(id: string): Promise<LearningResource | null> {
  try {
    const res = await fetch(`/api/content-engine/resources/${encodeURIComponent(id)}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch learning resource (${res.status})`);
    }
    const data: LearningResource = await res.json();
    return data;
  } catch (error) {
    console.error("Error in ContentEngineClient.fetchLearningResource:", error);
    return null;
  }
}

/**
 * Multi-dimensional querying, filtering, and searching for learning resources.
 */
export async function queryLearningResources(
  params: ResourceFilterQuery = {}
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
    if (params.resourceType) {
      if (Array.isArray(params.resourceType)) {
        params.resourceType.forEach((t) => urlParams.append("resourceType", t));
      } else {
        urlParams.set("resourceType", params.resourceType);
      }
    }
    if (params.difficulty) urlParams.set("difficulty", params.difficulty);
    if (params.language) urlParams.set("language", params.language);
    if (params.visibility) urlParams.set("visibility", params.visibility);
    if (params.status) urlParams.set("status", params.status);
    if (params.searchQuery) urlParams.set("q", params.searchQuery);
    if (params.sortBy) urlParams.set("sortBy", params.sortBy);
    if (params.sortOrder) urlParams.set("sortOrder", params.sortOrder);
    if (params.page) urlParams.set("page", String(params.page));
    if (params.limit) urlParams.set("limit", String(params.limit));

    const res = await fetch(`/api/content-engine/resources?${urlParams.toString()}`);
    if (!res.ok) {
      throw new Error(`Failed to query learning resources (${res.status})`);
    }

    const data: PaginatedResourceResponse = await res.json();
    return data;
  } catch (error) {
    console.error("Error in ContentEngineClient.queryLearningResources:", error);
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
 * Fetches metadata-driven content hierarchy tree:
 * University -> Degree -> Branch -> Semester -> Subject -> Unit -> Topic
 */
export async function fetchContentHierarchy(params?: {
  universityId?: string;
  branchId?: string;
  semester?: number;
}): Promise<ContentHierarchyNode[]> {
  try {
    const urlParams = new URLSearchParams();
    if (params?.universityId) urlParams.set("universityId", params.universityId);
    if (params?.branchId) urlParams.set("branchId", params.branchId);
    if (params?.semester !== undefined) urlParams.set("semester", String(params.semester));

    const res = await fetch(`/api/content-engine/hierarchy?${urlParams.toString()}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch content hierarchy (${res.status})`);
    }

    const data: ContentHierarchyNode[] = await res.json();
    return data;
  } catch (error) {
    console.error("Error in ContentEngineClient.fetchContentHierarchy:", error);
    return [];
  }
}

/**
 * Fetches all supported resource types, categories, and filter options.
 */
export async function fetchSupportedResourceTypes(): Promise<{
  resourceTypes: ResourceTypeConfig[];
  difficulties: string[];
  visibilities: string[];
  statuses: string[];
}> {
  try {
    const res = await fetch("/api/content-engine/types");
    if (!res.ok) {
      throw new Error(`Failed to fetch resource types (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error in ContentEngineClient.fetchSupportedResourceTypes:", error);
    return {
      resourceTypes: [],
      difficulties: ['beginner', 'intermediate', 'advanced', 'expert'],
      visibilities: ['public', 'private', 'unlisted', 'restricted'],
      statuses: ['draft', 'pending', 'approved', 'rejected', 'archived'],
    };
  }
}
