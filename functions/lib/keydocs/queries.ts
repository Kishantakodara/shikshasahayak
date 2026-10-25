// ============================================================
// SHIKSHA SAHAYAK OS KEYDOCS 3.0: UNIFIED SERVER-SIDE QUERY ENGINE
// Centralized server-side document query layer with full backward compatibility
// ============================================================

import { KeyDocsQueryFilters, UnifiedDocument, DocumentType, DocumentStatus } from "./types";
import { getDocumentFiles } from "./files";
import { getDocumentStats } from "./stats";
import { getDocumentRelations } from "./relations";

export async function queryDocuments(db: D1Database, filters: KeyDocsQueryFilters): Promise<{ documents: UnifiedDocument[]; total: number }> {
  let whereClauses: string[] = ["1=1"];
  let bindParams: any[] = [];

  if (filters.subject_id) {
    whereClauses.push("d.subject_id = ?");
    bindParams.push(filters.subject_id);
  }

  if (filters.branch_id) {
    whereClauses.push("d.branch_id = ?");
    bindParams.push(filters.branch_id);
  }

  if (filters.semester !== undefined && filters.semester !== null) {
    whereClauses.push("d.semester = ?");
    bindParams.push(filters.semester);
  }

  if (filters.university_id) {
    whereClauses.push("d.university_id = ?");
    bindParams.push(filters.university_id);
  }

  if (filters.document_type) {
    whereClauses.push("d.document_type = ?");
    bindParams.push(filters.document_type);
  }

  if (filters.status) {
    whereClauses.push("COALESCE(d.status, d.approval_status) = ?");
    bindParams.push(filters.status);
  }

  if (filters.curriculum_node_id) {
    whereClauses.push("d.curriculum_node_id = ?");
    bindParams.push(filters.curriculum_node_id);
  }

  if (filters.material_kind) {
    whereClauses.push("(mm.material_kind = ? OR d.material_kind = ?)");
    bindParams.push(filters.material_kind, filters.material_kind);
  }

  if (filters.paper_year) {
    whereClauses.push("(pm.exam_year = ? OR d.paper_year = ?)");
    bindParams.push(filters.paper_year, filters.paper_year);
  }

  if (filters.season) {
    whereClauses.push("(pm.season = ? OR d.season = ?)");
    bindParams.push(filters.season, filters.season);
  }

  if (filters.search && filters.search.trim()) {
    const searchPattern = `%${filters.search.trim()}%`;
    whereClauses.push("(d.title LIKE ? OR d.description LIKE ? OR s.name LIKE ? OR s.code LIKE ?)");
    bindParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }

  const whereSql = whereClauses.join(" AND ");

  // Count total matching
  const countRow = await db.prepare(`
    SELECT COUNT(1) as total
    FROM documents d
    LEFT JOIN subjects s ON s.id = d.subject_id
    LEFT JOIN pyq_metadata pm ON pm.document_id = d.id
    LEFT JOIN material_metadata mm ON mm.document_id = d.id
    LEFT JOIN syllabus_metadata sm ON sm.document_id = d.id
    WHERE ${whereSql}
  `).bind(...bindParams).first<any>();

  const total = Number(countRow?.total || 0);
  const limit = filters.limit || 50;
  const offset = filters.offset || 0;

  // Main Query
  const { results } = await db.prepare(`
    SELECT 
      d.id,
      d.document_type,
      d.subject_id,
      d.curriculum_node_id,
      d.title,
      d.description,
      COALESCE(d.status, d.approval_status, 'published') as status,
      d.created_by,
      d.updated_by,
      d.created_at,
      d.updated_at,
      
      -- Subject & Hierarchy Details
      s.name as subject_name,
      s.code as subject_code,
      s.semester,
      s.branch_id,
      b.name as branch_name,
      s.university_id,
      u.name as university_name,

      -- Curriculum Node Details
      cn.title as curriculum_node_title,
      cn.node_number as curriculum_unit_no,

      -- Type Metadata (New Tables)
      pm.exam_year as pm_exam_year,
      pm.season as pm_season,
      pm.exam_label as pm_exam_label,

      sm.effective_year as sm_effective_year,
      sm.regulation as sm_regulation,
      sm.version_label as sm_version_label,

      mm.material_kind as mm_material_kind,
      mm.author as mm_author,
      mm.publisher as mm_publisher,

      -- Stats
      ds.views as ds_views,
      ds.likes as ds_likes,
      ds.downloads as ds_downloads,

      -- Legacy Columns Fallback
      d.paper_year,
      d.season,
      d.exam_label,
      d.syllabus_year,
      d.regulation,
      d.version_label,
      d.material_kind,
      d.unit_no,
      d.chapter,
      d.topic,
      d.author,
      d.views,
      d.likes,
      d.downloads
    FROM documents d
    LEFT JOIN subjects s ON s.id = d.subject_id
    LEFT JOIN branches b ON b.id = s.branch_id OR b.id = d.branch_id
    LEFT JOIN universities u ON u.id = s.university_id OR u.id = d.university_id
    LEFT JOIN curriculum_nodes cn ON cn.id = d.curriculum_node_id
    LEFT JOIN pyq_metadata pm ON pm.document_id = d.id
    LEFT JOIN syllabus_metadata sm ON sm.document_id = d.id
    LEFT JOIN material_metadata mm ON mm.document_id = d.id
    LEFT JOIN document_stats ds ON ds.document_id = d.id
    WHERE ${whereSql}
    ORDER BY d.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(...bindParams, limit, offset).all<any>();

  if (!results || results.length === 0) {
    return { documents: [], total: 0 };
  }

  // Map into UnifiedDocument contract with fallback logic
  const documents: UnifiedDocument[] = results.map(row => {
    const docType = row.document_type as DocumentType;

    const pyqMeta = docType === 'pyq' ? {
      document_id: row.id,
      exam_year: row.pm_exam_year ?? row.paper_year,
      season: row.pm_season ?? row.season,
      exam_label: row.pm_exam_label ?? row.exam_label,
    } : null;

    const syllabusMeta = docType === 'syllabus' ? {
      document_id: row.id,
      effective_year: row.sm_effective_year ?? row.syllabus_year,
      regulation: row.sm_regulation ?? row.regulation,
      version_label: row.sm_version_label ?? row.version_label,
    } : null;

    const materialMeta = docType === 'study-material' ? {
      document_id: row.id,
      material_kind: row.mm_material_kind ?? row.material_kind ?? 'notes',
      author: row.mm_author ?? row.author,
      publisher: row.mm_publisher ?? null,
    } : null;

    const views = row.ds_views ?? row.views ?? 0;
    const likes = row.ds_likes ?? row.likes ?? 0;
    const downloads = row.ds_downloads ?? row.downloads ?? 0;

    return {
      id: row.id,
      document_type: docType,
      subject_id: row.subject_id,
      curriculum_node_id: row.curriculum_node_id,
      title: row.title,
      description: row.description,
      status: row.status as DocumentStatus,
      created_by: row.created_by,
      updated_by: row.updated_by,
      created_at: row.created_at,
      updated_at: row.updated_at,

      subject_name: row.subject_name,
      subject_code: row.subject_code,
      semester: row.semester,
      branch_id: row.branch_id,
      branch_name: row.branch_name,
      university_id: row.university_id,
      university_name: row.university_name,

      curriculum_node_title: row.curriculum_node_title,
      curriculum_unit_no: row.curriculum_unit_no ? Number(row.curriculum_unit_no) : undefined,

      pyq_metadata: pyqMeta,
      syllabus_metadata: syllabusMeta,
      material_metadata: materialMeta,

      stats: {
        document_id: row.id,
        views: Number(views),
        likes: Number(likes),
        downloads: Number(downloads),
        updated_at: row.updated_at,
      },

      // Backward compatibility legacy properties
      paper_year: pyqMeta?.exam_year,
      season: pyqMeta?.season,
      exam_label: pyqMeta?.exam_label,
      syllabus_year: syllabusMeta?.effective_year,
      regulation: syllabusMeta?.regulation,
      version_label: syllabusMeta?.version_label,
      material_kind: materialMeta?.material_kind ?? 'notes',
      unit_no: row.curriculum_unit_no ? Number(row.curriculum_unit_no) : row.unit_no,
      chapter: row.chapter,
      topic: row.topic,
      author: row.author,
      views: Number(views),
      likes: Number(likes),
      downloads: Number(downloads),
    };
  });

  return { documents, total };
}

export async function getDocumentById(db: D1Database, id: string): Promise<UnifiedDocument | null> {
  const { documents } = await queryDocuments(db, { limit: 1, search: undefined });
  const single = await db.prepare(`
    SELECT 
      d.id, d.document_type, d.subject_id, d.curriculum_node_id, d.title, d.description,
      COALESCE(d.status, d.approval_status, 'published') as status, d.created_by, d.updated_by, d.created_at, d.updated_at,
      s.name as subject_name, s.code as subject_code, s.semester, s.branch_id, b.name as branch_name, s.university_id, u.name as university_name,
      cn.title as curriculum_node_title, cn.node_number as curriculum_unit_no,
      pm.exam_year as pm_exam_year, pm.season as pm_season, pm.exam_label as pm_exam_label,
      sm.effective_year as sm_effective_year, sm.regulation as sm_regulation, sm.version_label as sm_version_label,
      mm.material_kind as mm_material_kind, mm.author as mm_author, mm.publisher as mm_publisher,
      ds.views as ds_views, ds.likes as ds_likes, ds.downloads as ds_downloads,
      d.paper_year, d.season, d.exam_label, d.syllabus_year, d.regulation, d.version_label, d.material_kind, d.unit_no, d.chapter, d.topic, d.author, d.views, d.likes, d.downloads
    FROM documents d
    LEFT JOIN subjects s ON s.id = d.subject_id
    LEFT JOIN branches b ON b.id = s.branch_id OR b.id = d.branch_id
    LEFT JOIN universities u ON u.id = s.university_id OR u.id = d.university_id
    LEFT JOIN curriculum_nodes cn ON cn.id = d.curriculum_node_id
    LEFT JOIN pyq_metadata pm ON pm.document_id = d.id
    LEFT JOIN syllabus_metadata sm ON sm.document_id = d.id
    LEFT JOIN material_metadata mm ON mm.document_id = d.id
    LEFT JOIN document_stats ds ON ds.document_id = d.id
    WHERE d.id = ?
  `).bind(id).first<any>();

  if (!single) return null;

  const docType = single.document_type as DocumentType;
  const files = await getDocumentFiles(db, id);
  const stats = await getDocumentStats(db, id);
  const relations = await getDocumentRelations(db, id);

  const pyqMeta = docType === 'pyq' ? {
    document_id: single.id,
    exam_year: single.pm_exam_year ?? single.paper_year,
    season: single.pm_season ?? single.season,
    exam_label: single.pm_exam_label ?? single.exam_label,
  } : null;

  const syllabusMeta = docType === 'syllabus' ? {
    document_id: single.id,
    effective_year: single.sm_effective_year ?? single.syllabus_year,
    regulation: single.sm_regulation ?? single.regulation,
    version_label: single.sm_version_label ?? single.version_label,
  } : null;

  const materialMeta = docType === 'study-material' ? {
    document_id: single.id,
    material_kind: single.mm_material_kind ?? single.material_kind ?? 'notes',
    author: single.mm_author ?? single.author,
    publisher: single.mm_publisher ?? null,
  } : null;

  return {
    id: single.id,
    document_type: docType,
    subject_id: single.subject_id,
    curriculum_node_id: single.curriculum_node_id,
    title: single.title,
    description: single.description,
    status: single.status as DocumentStatus,
    created_by: single.created_by,
    updated_by: single.updated_by,
    created_at: single.created_at,
    updated_at: single.updated_at,

    subject_name: single.subject_name,
    subject_code: single.subject_code,
    semester: single.semester,
    branch_id: single.branch_id,
    branch_name: single.branch_name,
    university_id: single.university_id,
    university_name: single.university_name,

    curriculum_node_title: single.curriculum_node_title,
    curriculum_unit_no: single.curriculum_unit_no ? Number(single.curriculum_unit_no) : undefined,

    pyq_metadata: pyqMeta,
    syllabus_metadata: syllabusMeta,
    material_metadata: materialMeta,

    files,
    stats,
    relations,

    paper_year: pyqMeta?.exam_year,
    season: pyqMeta?.season,
    exam_label: pyqMeta?.exam_label,
    syllabus_year: syllabusMeta?.effective_year,
    regulation: syllabusMeta?.regulation,
    version_label: syllabusMeta?.version_label,
    material_kind: materialMeta?.material_kind ?? 'notes',
    unit_no: single.curriculum_unit_no ? Number(single.curriculum_unit_no) : single.unit_no,
    chapter: single.chapter,
    topic: single.topic,
    author: single.author,
    views: stats.views,
    likes: stats.likes,
    downloads: stats.downloads,
  };
}
