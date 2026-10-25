// ============================================================
// SHIKSHA SAHAYAK OS - FRONTEND CONTENT TAXONOMY API CLIENT
// ============================================================

import {
  ContentObjectTaxonomy,
  TaxonomyMasterLookup,
  TaxonomyQueryFilterParams,
  ContentTag,
} from "../types/content-taxonomy";
import { PaginatedResourceResponse } from "../types/content-engine";

/**
 * Fetches the master taxonomy lookup payload (8 Categories, Educational Purposes, Learning Stages, Quality Badges).
 */
export async function fetchTaxonomyMasterLookup(): Promise<TaxonomyMasterLookup | null> {
  try {
    const res = await fetch("/api/taxonomy/categories");
    if (!res.ok) {
      throw new Error(`Failed to fetch taxonomy categories (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error in TaxonomyClient.fetchTaxonomyMasterLookup:", error);
    return null;
  }
}

/**
 * Fetches 360-degree taxonomy metadata for a specific content object.
 */
export async function fetchResourceTaxonomy(
  documentId: string
): Promise<ContentObjectTaxonomy | null> {
  try {
    const res = await fetch(`/api/taxonomy/resource/${encodeURIComponent(documentId)}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch resource taxonomy (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error in TaxonomyClient.fetchResourceTaxonomy:", error);
    return null;
  }
}

/**
 * Multi-dimensional querying by taxonomy parameters.
 */
export async function queryByTaxonomy(
  params: TaxonomyQueryFilterParams = {}
): Promise<PaginatedResourceResponse> {
  try {
    const urlParams = new URLSearchParams();
    if (params.categoryCode) urlParams.set("category", params.categoryCode);
    if (params.educationalPurpose) urlParams.set("purpose", params.educationalPurpose);
    if (params.learningStage) urlParams.set("stage", params.learningStage);
    if (params.qualityBadge) urlParams.set("qualityBadge", params.qualityBadge);
    if (params.mediaType) urlParams.set("mediaType", params.mediaType);
    if (params.difficulty) urlParams.set("difficulty", params.difficulty);
    if (params.language) urlParams.set("language", params.language);
    if (params.visibility) urlParams.set("visibility", params.visibility);
    if (params.status) urlParams.set("status", params.status);
    if (params.searchQuery) urlParams.set("q", params.searchQuery);
    if (params.sortBy) urlParams.set("sortBy", params.sortBy);
    if (params.sortOrder) urlParams.set("sortOrder", params.sortOrder);
    if (params.page) urlParams.set("page", String(params.page));
    if (params.limit) urlParams.set("limit", String(params.limit));

    const res = await fetch(`/api/taxonomy/query?${urlParams.toString()}`);
    if (!res.ok) {
      throw new Error(`Failed to query by taxonomy (${res.status})`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error in TaxonomyClient.queryByTaxonomy:", error);
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
 * Searches tags by query or fetches top popular tags.
 */
export async function searchContentTags(
  query: string = "",
  limit: number = 30
): Promise<ContentTag[]> {
  try {
    const urlParams = new URLSearchParams();
    if (query) urlParams.set("q", query);
    urlParams.set("limit", String(limit));

    const res = await fetch(`/api/taxonomy/tags?${urlParams.toString()}`);
    if (!res.ok) {
      throw new Error(`Failed to search tags (${res.status})`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error in TaxonomyClient.searchContentTags:", error);
    return [];
  }
}
