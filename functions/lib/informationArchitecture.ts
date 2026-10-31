// ============================================================
// SHIKSHA SAHAYAK OS - INFORMATION ARCHITECTURE EDGE SERVICE
// ============================================================

import {
  MasterHierarchyBreadcrumb,
  ExploreModeTree,
  ContentRelationshipEdge,
  UniversalIASearchParams,
  DiscoveryChannel,
  IAVisibilityLevel,
  UniversityNode,
  DegreeNode,
  BranchNode,
  SubjectNode,
  UnitNode,
  TopicNode,
} from "../../src/types/information-architecture";
import { queryLearningResources, getLearningResourceById, Env } from "./contentEngine";
import { PaginatedResourceResponse, ResourceFilterQuery, ResourceVisibility } from "../../src/types/content-engine";

/**
 * Computes the full 12-level breadcrumb path for any given learning resource or context ID.
 */
export async function getCompleteHierarchyBreadcrumb(
  env: Env,
  resourceId: string
): Promise<MasterHierarchyBreadcrumb> {
  const resource = await getLearningResourceById(env, resourceId);

  const breadcrumb: MasterHierarchyBreadcrumb = {
    platform: {
      id: "platform_shikshasahayak",
      name: "ShikshaSahayak OS",
      domain: "shikshasahayak.org",
    },
  };

  if (!resource) return breadcrumb;

  breadcrumb.university = resource.universityId
    ? {
        id: resource.universityId,
        name: resource.universityName || "University",
        slug: resource.universitySlug || "university",
      }
    : undefined;

  breadcrumb.degree = resource.degreeId
    ? {
        id: resource.degreeId,
        universityId: resource.universityId,
        name: resource.degreeName || "Degree",
        slug: resource.degreeSlug || "degree",
      }
    : undefined;

  breadcrumb.branch = resource.branchId
    ? {
        id: resource.branchId,
        universityId: resource.universityId,
        name: resource.branchName || "Branch",
        slug: resource.branchSlug || "branch",
      }
    : undefined;

  breadcrumb.semester = resource.semester;

  breadcrumb.subject = resource.subjectId
    ? {
        id: resource.subjectId,
        universityId: resource.universityId,
        branchId: resource.branchId,
        semester: resource.semester,
        name: resource.subjectName || "Subject",
        code: resource.subjectCode,
        slug: resource.subjectSlug || "subject",
      }
    : undefined;

  breadcrumb.unit = resource.unitId
    ? {
        id: resource.unitId,
        subjectId: resource.subjectId,
        unitNo: resource.unitNo || 1,
        title: resource.unitTitle || `Unit ${resource.unitNo || 1}`,
      }
    : undefined;

  breadcrumb.topic = resource.topicId
    ? {
        id: resource.topicId,
        unitId: resource.unitId || "",
        topicNo: resource.topicNo || 1,
        title: resource.topicTitle || `Topic ${resource.topicNo || 1}`,
      }
    : undefined;

  breadcrumb.resource = resource;

  return breadcrumb;
}

/**
 * Builds the complete permission-aware Explore Mode Tree across all Universities, Degrees, Branches, and Semesters.
 */
export async function getExploreModeTree(
  env: Env,
  universityId?: string
): Promise<ExploreModeTree> {
  try {
    const univCond = universityId ? "WHERE id = ?" : "";
    const univBind = universityId ? [universityId] : [];
    const { results: univs } = await env.DB.prepare(
      `SELECT id, name, slug, short_name FROM universities ${univCond} ORDER BY name`
    )
      .bind(...univBind)
      .all<Record<string, unknown>>();

    const tree: ExploreModeTree = { universities: [] };

    for (const u of univs || []) {
      const uId = String(u.id);

      // Fetch Degrees for University
      const { results: degrees } = await env.DB.prepare(
        `SELECT id, name, slug, short_name FROM degrees WHERE university_id = ? ORDER BY name`
      )
        .bind(uId)
        .all<Record<string, unknown>>();

      // Fetch Branches for University
      const { results: branches } = await env.DB.prepare(
        `SELECT id, name, slug, short_name FROM branches WHERE university_id = ? ORDER BY name`
      )
        .bind(uId)
        .all<Record<string, unknown>>();

      const branchNodes: Array<BranchNode & { semesters: { semesterNo: number; subjectsCount: number; resourcesCount: number }[] }> = [];

      for (const b of branches || []) {
        const bId = String(b.id);

        // Aggregate Semesters 1 to 8 for Branch
        const { results: semStats } = await env.DB.prepare(
          `SELECT
             semester,
             COUNT(id) AS subjects_count
           FROM subjects
           WHERE branch_id = ?
           GROUP BY semester
           ORDER BY semester`
        )
          .bind(bId)
          .all<Record<string, unknown>>();

        const semNodes = (semStats || []).map((s) => ({
          semesterNo: Number(s.semester),
          subjectsCount: Number(s.subjects_count || 0),
          resourcesCount: 0,
        }));

        branchNodes.push({
          id: bId,
          universityId: uId,
          name: String(b.name),
          slug: String(b.slug),
          shortName: b.short_name ? String(b.short_name) : undefined,
          semesters: semNodes,
        });
      }

      const degreeNodes = (degrees || []).map((d) => ({
        id: String(d.id),
        universityId: uId,
        name: String(d.name),
        slug: String(d.slug),
        shortName: d.short_name ? String(d.short_name) : undefined,
        branches: branchNodes,
      }));

      tree.universities.push({
        id: uId,
        name: String(u.name),
        slug: String(u.slug),
        shortName: u.short_name ? String(u.short_name) : undefined,
        degrees: degreeNodes,
      });
    }

    return tree;
  } catch (error) {
    console.error("Error generating Explore Mode tree:", error);
    return { universities: [] };
  }
}

/**
 * Fetches connected graph edges for a given resource (next, previous, prerequisites, recommended, alternatives).
 */
export async function getContentRelationships(
  env: Env,
  resourceId: string
): Promise<ContentRelationshipEdge[]> {
  try {
    const { results } = await env.DB.prepare(
      `SELECT
         id,
         source_id,
         target_id,
         relationship_type,
         weight
       FROM content_graph_relationships
       WHERE source_id = ? OR target_id = ?
       ORDER BY weight DESC`
    )
      .bind(resourceId, resourceId)
      .all<Record<string, unknown>>();

    if (!results || results.length === 0) return [];

    const edges: ContentRelationshipEdge[] = [];

    for (const row of results) {
      const targetId = String(row.target_id) === resourceId ? String(row.source_id) : String(row.target_id);
      const targetRes = await getLearningResourceById(env, targetId);

      edges.push({
        id: String(row.id),
        sourceId: String(row.source_id),
        targetId: String(row.target_id),
        relationshipType: String(row.relationship_type) as any,
        weight: Number(row.weight || 1.0),
        targetResource: targetRes || undefined,
      });
    }

    return edges;
  } catch (error) {
    console.error("Error fetching content relationships:", error);
    return [];
  }
}

/**
 * Executes a multi-level search across the entire Information Architecture hierarchy.
 */
export async function executeUniversalIASearch(
  env: Env,
  params: UniversalIASearchParams
): Promise<PaginatedResourceResponse> {
  return queryLearningResources(env, {
    universityId: params.universityId,
    degreeId: params.degreeId,
    branchId: params.branchId,
    branchSlug: params.branchSlug,
    semester: params.semester,
    subjectId: params.subjectId,
    subjectSlug: params.subjectSlug,
    unitId: params.unitId,
    unitNo: params.unitNo,
    topicId: params.topicId,
    resourceType: params.resourceType,
    difficulty: params.difficulty as any,
    language: params.language,
    visibility: params.visibility as any,
    searchQuery: params.query,
    page: params.page || 1,
    limit: params.limit || 20,
    sortBy: "views",
    sortOrder: "desc",
  });
}

/**
 * Aggregates multi-channel content discovery feeds.
 */
export async function getDiscoveryFeed(
  env: Env,
  channel: DiscoveryChannel,
  params: UniversalIASearchParams = {}
): Promise<PaginatedResourceResponse> {
  let sortBy: "created_at" | "views" | "downloads" | "rating" | "updated_at" = "created_at";

  if (channel === "popular" || channel === "trending") {
    sortBy = "views";
  } else if (channel === "recently_uploaded" || channel === "recent_activity") {
    sortBy = "created_at";
  }

  const visibility = params.visibility === "public"
    ? (params.visibility as ResourceVisibility)
    : undefined;
  const queryParams: ResourceFilterQuery = {
    universityId: params.universityId,
    degreeId: params.degreeId,
    branchId: params.branchId,
    branchSlug: params.branchSlug,
    semester: params.semester,
    subjectId: params.subjectId,
    subjectSlug: params.subjectSlug,
    unitId: params.unitId,
    unitNo: params.unitNo,
    topicId: params.topicId,
    resourceType: params.resourceType,
    tags: params.tags,
    language: params.language,
    visibility,
    searchQuery: params.query,
    sortBy,
    sortOrder: "desc",
    page: params.page || 1,
    limit: params.limit || 12,
  };

  return queryLearningResources(env, queryParams);
}
