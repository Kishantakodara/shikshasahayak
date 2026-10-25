// ============================================================
// SHIKSHA SAHAYAK OS - FRONTEND UNIVERSAL METADATA API CLIENT
// ============================================================

import {
  UniversalMetadataObject,
  UniversalMetadataQueryParams,
} from "../types/universal-metadata";
import { PaginatedResourceResponse } from "../types/content-engine";

/**
 * Fetches the complete 10-domain Universal Metadata Object for a resource ID.
 */
export async function fetchUniversalMetadata(
  resourceId: string
): Promise<UniversalMetadataObject | null> {
  try {
    const res = await fetch(`/api/metadata/resource/${encodeURIComponent(resourceId)}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch universal metadata (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error in MetadataClient.fetchUniversalMetadata:", error);
    return null;
  }
}

/**
 * Multi-domain metadata querying and filtering.
 */
export async function queryByUniversalMetadata(
  params: UniversalMetadataQueryParams = {}
): Promise<PaginatedResourceResponse> {
  try {
    const urlParams = new URLSearchParams();
    if (params.universityId) urlParams.set("universityId", params.universityId);
    if (params.branchId) urlParams.set("branchId", params.branchId);
    if (params.semester !== undefined) urlParams.set("semester", String(params.semester));
    if (params.subjectId) urlParams.set("subjectId", params.subjectId);
    if (params.unitNo !== undefined) urlParams.set("unitNo", String(params.unitNo));
    if (params.resourceType) urlParams.set("resourceType", params.resourceType);
    if (params.difficulty) urlParams.set("difficulty", params.difficulty);
    if (params.isFeatured) urlParams.set("isFeatured", "true");
    if (params.isTrending) urlParams.set("isTrending", "true");
    if (params.isPopular) urlParams.set("isPopular", "true");
    if (params.isFacultyPick) urlParams.set("isFacultyPick", "true");
    if (params.examImportance) urlParams.set("examImportance", params.examImportance);
    if (params.query) urlParams.set("q", params.query);
    if (params.page) urlParams.set("page", String(params.page));
    if (params.limit) urlParams.set("limit", String(params.limit));

    const res = await fetch(`/api/metadata/query?${urlParams.toString()}`);
    if (!res.ok) {
      throw new Error(`Failed to query universal metadata (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error in MetadataClient.queryByUniversalMetadata:", error);
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
 * Fetches master JSON schema specification for Universal Metadata Architecture.
 */
export async function fetchMetadataSchemaSpec(): Promise<{
  specVersion: string;
  specificationName: string;
  domains: Array<{ name: string; description: string }>;
} | null> {
  try {
    const res = await fetch("/api/metadata/schema");
    if (!res.ok) {
      throw new Error(`Failed to fetch metadata schema (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error in MetadataClient.fetchMetadataSchemaSpec:", error);
    return null;
  }
}
