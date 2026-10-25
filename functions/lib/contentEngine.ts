// ============================================================
// SHIKSHA SAHAYAK OS - CONTENT ENGINE EDGE SERVICE (Cloudflare Worker Helper)
// ============================================================

import {
  LearningResource,
  ResourceFilterQuery,
  PaginatedResourceResponse,
  ContentHierarchyNode,
  ResourceType,
  ResourceDifficulty,
  ResourceVisibility,
  ResourceStatus,
} from "../../src/types/content-engine";

export interface Env {
  DB: D1Database;
  PADHAKU_CORE_DB?: D1Database;
  ASSESSMENT_DB?: D1Database;
  [key: string]: any;
}

/** Helper to safely parse JSON strings or return fallback empty array */
function parseJsonArray(input: unknown): string[] {
  if (!input || typeof input !== "string") return [];
  try {
    const parsed = JSON.parse(input);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

/**
 * Hydrates a D1 raw document record into a rich, structured `LearningResource` object.
 */
export async function getLearningResourceById(
  env: Env,
  id: string
): Promise<LearningResource | null> {
  const query = `
    SELECT
      d.id,
      d.title,
      d.description,
      d.document_type,
      d.university_id,
      d.branch_id,
      d.semester,
      d.subject_id,
      d.approval_status AS status,
      d.uploaded_by,
      d.approved_by,
      d.approved_at,
      d.created_at,
      d.updated_at,
      u.name AS university_name,
      u.slug AS university_slug,
      b.name AS branch_name,
      b.slug AS branch_slug,
      s.name AS subject_name,
      s.code AS subject_code,
      s.slug AS subject_slug,
      rm.subtitle,
      rm.degree_id,
      rm.unit_id,
      rm.topic_id,
      rm.sub_topic,
      rm.resource_type,
      rm.difficulty,
      rm.language,
      rm.tags,
      rm.keywords,
      rm.visibility,
      rm.version,
      rm.estimated_reading_time,
      rm.thumbnail_url,
      rm.preview_url,
      rm.rating_avg,
      rm.rating_count,
      rm.prerequisites,
      rm.recommended_next_id,
      deg.name AS degree_name,
      deg.slug AS degree_slug,
      su.unit_no,
      su.title AS unit_title,
      st.topic_no,
      st.title AS topic_title,
      df.file_url,
      df.storage_key,
      df.mime_type,
      df.size_bytes,
      df.original_filename,
      ds.views,
      ds.downloads,
      ds.likes
    FROM documents d
    LEFT JOIN universities u ON u.id = d.university_id
    LEFT JOIN branches b ON b.id = d.branch_id
    LEFT JOIN subjects s ON s.id = d.subject_id
    LEFT JOIN resource_metadata rm ON rm.document_id = d.id
    LEFT JOIN degrees deg ON deg.id = rm.degree_id
    LEFT JOIN subject_units su ON su.id = rm.unit_id
    LEFT JOIN subject_topics st ON st.id = rm.topic_id
    LEFT JOIN document_files df ON df.document_id = d.id AND df.is_primary = 1
    LEFT JOIN document_stats ds ON ds.document_id = d.id
    WHERE d.id = ?
    LIMIT 1
  `;

  try {
    const row = await env.DB.prepare(query).bind(id).first<Record<string, unknown>>();

    if (!row) return null;

    // Fallback resource_type to document_type mapping if metadata not yet populated
    let resType: ResourceType = (row.resource_type as ResourceType) || "notes";
    if (!row.resource_type) {
      if (row.document_type === "pyq") resType = "pyq";
      else if (row.document_type === "syllabus") resType = "notes";
      else resType = "notes";
    }

    const resource: LearningResource = {
      id: String(row.id),
      title: String(row.title),
      subtitle: row.subtitle ? String(row.subtitle) : null,
      description: row.description ? String(row.description) : null,

      universityId: String(row.university_id),
      universityName: row.university_name ? String(row.university_name) : undefined,
      universitySlug: row.university_slug ? String(row.university_slug) : undefined,

      degreeId: row.degree_id ? String(row.degree_id) : null,
      degreeName: row.degree_name ? String(row.degree_name) : undefined,
      degreeSlug: row.degree_slug ? String(row.degree_slug) : undefined,

      branchId: String(row.branch_id),
      branchName: row.branch_name ? String(row.branch_name) : undefined,
      branchSlug: row.branch_slug ? String(row.branch_slug) : undefined,

      semester: Number(row.semester),

      subjectId: String(row.subject_id),
      subjectName: row.subject_name ? String(row.subject_name) : undefined,
      subjectCode: row.subject_code ? String(row.subject_code) : undefined,
      subjectSlug: row.subject_slug ? String(row.subject_slug) : undefined,

      unitId: row.unit_id ? String(row.unit_id) : null,
      unitNo: row.unit_no !== null && row.unit_no !== undefined ? Number(row.unit_no) : null,
      unitTitle: row.unit_title ? String(row.unit_title) : null,

      topicId: row.topic_id ? String(row.topic_id) : null,
      topicNo: row.topic_no !== null && row.topic_no !== undefined ? Number(row.topic_no) : null,
      topicTitle: row.topic_title ? String(row.topic_title) : null,
      subTopic: row.sub_topic ? String(row.sub_topic) : null,

      resourceType: resType,
      difficulty: (row.difficulty as ResourceDifficulty) || null,
      language: row.language ? String(row.language) : "en",
      tags: parseJsonArray(row.tags),
      keywords: parseJsonArray(row.keywords),
      visibility: (row.visibility as ResourceVisibility) || "public",
      version: row.version ? String(row.version) : "1.0",
      status: (row.status as ResourceStatus) || "approved",

      author: null,
      uploadedBy: row.uploaded_by ? String(row.uploaded_by) : null,
      approvedBy: row.approved_by ? String(row.approved_by) : null,
      approvedAt: row.approved_at ? String(row.approved_at) : null,
      createdAt: String(row.created_at || new Date().toISOString()),
      updatedAt: String(row.updated_at || new Date().toISOString()),

      fileUrl: row.file_url ? String(row.file_url) : null,
      storageKey: row.storage_key ? String(row.storage_key) : null,
      mimeType: row.mime_type ? String(row.mime_type) : null,
      sizeBytes: row.size_bytes ? Number(row.size_bytes) : null,
      originalFilename: row.original_filename ? String(row.original_filename) : null,
      thumbnailUrl: row.thumbnail_url ? String(row.thumbnail_url) : null,
      previewUrl: row.preview_url ? String(row.preview_url) : null,

      estimatedReadingTimeMinutes: row.estimated_reading_time ? Number(row.estimated_reading_time) : null,
      views: Number(row.views || 0),
      downloads: Number(row.downloads || 0),
      likes: Number(row.likes || 0),
      bookmarks: 0,
      ratingAvg: Number(row.rating_avg || 0.0),
      ratingCount: Number(row.rating_count || 0),

      prerequisiteIds: parseJsonArray(row.prerequisites),
      recommendedNextId: row.recommended_next_id ? String(row.recommended_next_id) : null,
      relatedResourceIds: [],
    };

    return resource;
  } catch (error) {
    console.error("Error fetching learning resource by ID:", error);
    return null;
  }
}

/**
 * Queries and filters learning resources across multiple dimensions.
 */
export async function queryLearningResources(
  env: Env,
  params: ResourceFilterQuery
): Promise<PaginatedResourceResponse> {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const offset = (page - 1) * limit;

  const conditions: string[] = ["1=1"];
  const bindings: (string | number)[] = [];

  if (params.universityId) {
    conditions.push("d.university_id = ?");
    bindings.push(params.universityId);
  }
  if (params.branchId) {
    conditions.push("d.branch_id = ?");
    bindings.push(params.branchId);
  }
  if (params.branchSlug) {
    conditions.push("b.slug = ?");
    bindings.push(params.branchSlug);
  }
  if (params.semester !== undefined && params.semester !== null) {
    conditions.push("d.semester = ?");
    bindings.push(Number(params.semester));
  }
  if (params.subjectId) {
    conditions.push("d.subject_id = ?");
    bindings.push(params.subjectId);
  }
  if (params.subjectSlug) {
    conditions.push("s.slug = ?");
    bindings.push(params.subjectSlug);
  }
  if (params.unitId) {
    conditions.push("rm.unit_id = ?");
    bindings.push(params.unitId);
  }
  if (params.unitNo !== undefined && params.unitNo !== null) {
    conditions.push("su.unit_no = ?");
    bindings.push(Number(params.unitNo));
  }
  if (params.topicId) {
    conditions.push("rm.topic_id = ?");
    bindings.push(params.topicId);
  }
  if (params.resourceType) {
    if (Array.isArray(params.resourceType)) {
      const placeholders = params.resourceType.map(() => "?").join(",");
      conditions.push(`(rm.resource_type IN (${placeholders}) OR d.document_type IN (${placeholders}))`);
      bindings.push(...params.resourceType, ...params.resourceType);
    } else {
      conditions.push("(rm.resource_type = ? OR d.document_type = ?)");
      bindings.push(params.resourceType, params.resourceType);
    }
  }
  if (params.difficulty) {
    conditions.push("rm.difficulty = ?");
    bindings.push(params.difficulty);
  }
  if (params.visibility) {
    conditions.push("(rm.visibility = ? OR rm.visibility IS NULL)");
    bindings.push(params.visibility);
  }
  if (params.status) {
    conditions.push("d.approval_status = ?");
    bindings.push(params.status);
  } else {
    // Default to approved documents for public queries
    conditions.push("d.approval_status = 'approved'");
  }

  if (params.searchQuery && params.searchQuery.trim()) {
    const q = `%${params.searchQuery.trim()}%`;
    conditions.push("(d.title LIKE ? OR d.description LIKE ? OR rm.subtitle LIKE ? OR rm.tags LIKE ?)");
    bindings.push(q, q, q, q);
  }

  const whereClause = conditions.join(" AND ");

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM documents d
    LEFT JOIN branches b ON b.id = d.branch_id
    LEFT JOIN subjects s ON s.id = d.subject_id
    LEFT JOIN resource_metadata rm ON rm.document_id = d.id
    LEFT JOIN subject_units su ON su.id = rm.unit_id
    WHERE ${whereClause}
  `;

  let sortByColumn = "d.created_at";
  if (params.sortBy === "updated_at") sortByColumn = "d.updated_at";
  else if (params.sortBy === "views") sortByColumn = "COALESCE(ds.views, 0)";
  else if (params.sortBy === "downloads") sortByColumn = "COALESCE(ds.downloads, 0)";
  else if (params.sortBy === "rating") sortByColumn = "COALESCE(rm.rating_avg, 0)";
  else if (params.sortBy === "title") sortByColumn = "d.title";

  const sortOrderDir = params.sortOrder === "asc" ? "ASC" : "DESC";

  const dataQuery = `
    SELECT
      d.id,
      d.title,
      d.description,
      d.document_type,
      d.university_id,
      d.branch_id,
      d.semester,
      d.subject_id,
      d.approval_status AS status,
      d.uploaded_by,
      d.approved_by,
      d.approved_at,
      d.created_at,
      d.updated_at,
      u.name AS university_name,
      u.slug AS university_slug,
      b.name AS branch_name,
      b.slug AS branch_slug,
      s.name AS subject_name,
      s.code AS subject_code,
      s.slug AS subject_slug,
      rm.subtitle,
      rm.degree_id,
      rm.unit_id,
      rm.topic_id,
      rm.sub_topic,
      rm.resource_type,
      rm.difficulty,
      rm.language,
      rm.tags,
      rm.keywords,
      rm.visibility,
      rm.version,
      rm.estimated_reading_time,
      rm.thumbnail_url,
      rm.preview_url,
      rm.rating_avg,
      rm.rating_count,
      rm.prerequisites,
      rm.recommended_next_id,
      deg.name AS degree_name,
      deg.slug AS degree_slug,
      su.unit_no,
      su.title AS unit_title,
      st.topic_no,
      st.title AS topic_title,
      df.file_url,
      df.storage_key,
      df.mime_type,
      df.size_bytes,
      df.original_filename,
      ds.views,
      ds.downloads,
      ds.likes
    FROM documents d
    LEFT JOIN universities u ON u.id = d.university_id
    LEFT JOIN branches b ON b.id = d.branch_id
    LEFT JOIN subjects s ON s.id = d.subject_id
    LEFT JOIN resource_metadata rm ON rm.document_id = d.id
    LEFT JOIN degrees deg ON deg.id = rm.degree_id
    LEFT JOIN subject_units su ON su.id = rm.unit_id
    LEFT JOIN subject_topics st ON st.id = rm.topic_id
    LEFT JOIN document_files df ON df.document_id = d.id AND df.is_primary = 1
    LEFT JOIN document_stats ds ON ds.document_id = d.id
    WHERE ${whereClause}
    ORDER BY ${sortByColumn} ${sortOrderDir}
    LIMIT ? OFFSET ?
  `;

  try {
    const countRow = await env.DB.prepare(countQuery).bind(...bindings).first<{ total: number }>();
    const total = countRow?.total || 0;

    const dataBindings = [...bindings, limit, offset];
    const { results } = await env.DB.prepare(dataQuery).bind(...dataBindings).all<Record<string, unknown>>();

    const resources: LearningResource[] = (results || []).map((row) => {
      let resType: ResourceType = (row.resource_type as ResourceType) || "notes";
      if (!row.resource_type) {
        if (row.document_type === "pyq") resType = "pyq";
        else resType = "notes";
      }

      return {
        id: String(row.id),
        title: String(row.title),
        subtitle: row.subtitle ? String(row.subtitle) : null,
        description: row.description ? String(row.description) : null,

        universityId: String(row.university_id),
        universityName: row.university_name ? String(row.university_name) : undefined,
        universitySlug: row.university_slug ? String(row.university_slug) : undefined,

        degreeId: row.degree_id ? String(row.degree_id) : null,
        degreeName: row.degree_name ? String(row.degree_name) : undefined,
        degreeSlug: row.degree_slug ? String(row.degree_slug) : undefined,

        branchId: String(row.branch_id),
        branchName: row.branch_name ? String(row.branch_name) : undefined,
        branchSlug: row.branch_slug ? String(row.branch_slug) : undefined,

        semester: Number(row.semester),

        subjectId: String(row.subject_id),
        subjectName: row.subject_name ? String(row.subject_name) : undefined,
        subjectCode: row.subject_code ? String(row.subject_code) : undefined,
        subjectSlug: row.subject_slug ? String(row.subject_slug) : undefined,

        unitId: row.unit_id ? String(row.unit_id) : null,
        unitNo: row.unit_no !== null && row.unit_no !== undefined ? Number(row.unit_no) : null,
        unitTitle: row.unit_title ? String(row.unit_title) : null,

        topicId: row.topic_id ? String(row.topic_id) : null,
        topicNo: row.topic_no !== null && row.topic_no !== undefined ? Number(row.topic_no) : null,
        topicTitle: row.topic_title ? String(row.topic_title) : null,
        subTopic: row.sub_topic ? String(row.sub_topic) : null,

        resourceType: resType,
        difficulty: (row.difficulty as ResourceDifficulty) || null,
        language: row.language ? String(row.language) : "en",
        tags: parseJsonArray(row.tags),
        keywords: parseJsonArray(row.keywords),
        visibility: (row.visibility as ResourceVisibility) || "public",
        version: row.version ? String(row.version) : "1.0",
        status: (row.status as ResourceStatus) || "approved",

        author: null,
        uploadedBy: row.uploaded_by ? String(row.uploaded_by) : null,
        approvedBy: row.approved_by ? String(row.approved_by) : null,
        approvedAt: row.approved_at ? String(row.approved_at) : null,
        createdAt: String(row.created_at || new Date().toISOString()),
        updatedAt: String(row.updated_at || new Date().toISOString()),

        fileUrl: row.file_url ? String(row.file_url) : null,
        storageKey: row.storage_key ? String(row.storage_key) : null,
        mimeType: row.mime_type ? String(row.mime_type) : null,
        sizeBytes: row.size_bytes ? Number(row.size_bytes) : null,
        originalFilename: row.original_filename ? String(row.original_filename) : null,
        thumbnailUrl: row.thumbnail_url ? String(row.thumbnail_url) : null,
        previewUrl: row.preview_url ? String(row.preview_url) : null,

        estimatedReadingTimeMinutes: row.estimated_reading_time ? Number(row.estimated_reading_time) : null,
        views: Number(row.views || 0),
        downloads: Number(row.downloads || 0),
        likes: Number(row.likes || 0),
        bookmarks: 0,
        ratingAvg: Number(row.rating_avg || 0.0),
        ratingCount: Number(row.rating_count || 0),

        prerequisiteIds: parseJsonArray(row.prerequisites),
        recommendedNextId: row.recommended_next_id ? String(row.recommended_next_id) : null,
        relatedResourceIds: [],
      };
    });

    return {
      resources,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error("Error querying learning resources:", error);
    return {
      resources: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
    };
  }
}

/**
 * Builds the metadata-driven content hierarchy tree:
 * University -> Degree -> Branch -> Semester -> Subject -> Unit -> Topic
 */
export async function getContentHierarchy(
  env: Env,
  universityId?: string,
  branchId?: string,
  semester?: number
): Promise<ContentHierarchyNode[]> {
  try {
    const univQuery = `SELECT id, name, slug FROM universities ${universityId ? "WHERE id = ?" : ""}`;
    const univBindings = universityId ? [universityId] : [];
    const { results: univs } = await env.DB.prepare(univQuery).bind(...univBindings).all<Record<string, unknown>>();

    if (!univs || univs.length === 0) return [];

    const nodes: ContentHierarchyNode[] = [];

    for (const u of univs) {
      const uNode: ContentHierarchyNode = {
        id: String(u.id),
        name: String(u.name),
        slug: String(u.slug),
        type: "university",
        children: [],
      };

      // Fetch Degrees for University
      const { results: degrees } = await env.DB.prepare(
        `SELECT id, name, slug, short_name FROM degrees WHERE university_id = ?`
      )
        .bind(String(u.id))
        .all<Record<string, unknown>>();

      const degreeChildren: ContentHierarchyNode[] = (degrees || []).map((deg) => ({
        id: String(deg.id),
        name: String(deg.name),
        slug: String(deg.slug),
        code: deg.short_name ? String(deg.short_name) : undefined,
        type: "degree",
        children: [],
      }));

      // Fetch Branches for University
      const branchCond = branchId ? "AND id = ?" : "";
      const branchBindings = branchId ? [String(u.id), branchId] : [String(u.id)];
      const { results: branches } = await env.DB.prepare(
        `SELECT id, name, slug, short_name FROM branches WHERE university_id = ? ${branchCond}`
      )
        .bind(...branchBindings)
        .all<Record<string, unknown>>();

      const branchChildren: ContentHierarchyNode[] = [];

      for (const b of branches || []) {
        const bNode: ContentHierarchyNode = {
          id: String(b.id),
          name: String(b.name),
          slug: String(b.slug),
          code: b.short_name ? String(b.short_name) : undefined,
          type: "branch",
          children: [],
        };

        // Fetch Subjects for Branch
        const semCond = semester !== undefined && semester !== null ? "AND semester = ?" : "";
        const semBindings =
          semester !== undefined && semester !== null ? [String(b.id), Number(semester)] : [String(b.id)];

        const { results: subjects } = await env.DB.prepare(
          `SELECT id, name, code, slug, semester FROM subjects WHERE branch_id = ? ${semCond} ORDER BY semester, name`
        )
          .bind(...semBindings)
          .all<Record<string, unknown>>();

        bNode.children = (subjects || []).map((sub) => ({
          id: String(sub.id),
          name: String(sub.name),
          code: sub.code ? String(sub.code) : undefined,
          slug: String(sub.slug),
          type: "subject",
          childrenCount: 0,
        }));

        branchChildren.push(bNode);
      }

      uNode.children = [...degreeChildren, ...branchChildren];
      nodes.push(uNode);
    }

    return nodes;
  } catch (error) {
    console.error("Error building content hierarchy:", error);
    return [];
  }
}
