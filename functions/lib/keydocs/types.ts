// ============================================================
// SHIKSHA SAHAYAK OS KEYDOCS 3.0: TYPE DEFINITIONS
// Central TypeScript contracts for KeyDocs service layer & APIs
// ============================================================

export type DocumentType = 'pyq' | 'syllabus' | 'study-material';

export type DocumentStatus = 'draft' | 'review' | 'published' | 'archived' | 'rejected';

export type CurriculumNodeType = 'unit' | 'topic' | 'subtopic';

export type MaterialKind = 'notes' | 'book' | 'assignment' | 'practical' | 'question_bank' | 'video' | 'other';

export type DocumentRelationType = 'solution' | 'revision' | 'translation' | 'duplicate' | 'related';

export type FileType = 'paper' | 'solution' | 'syllabus' | 'material' | 'thumbnail' | 'other';

export interface CurriculumNode {
  id: string;
  subject_id: string;
  parent_id?: string | null;
  node_type: CurriculumNodeType;
  node_number: number;
  title: string;
  description?: string | null;
  sort_order: number;
  is_active: number;
  created_at: string;
  updated_at: string;
  children?: CurriculumNode[];
  documents_count?: number;
}

export interface PyqMetadata {
  document_id: string;
  exam_year?: number | null;
  season?: 'S' | 'W' | null;
  exam_label?: string | null;
}

export interface SyllabusMetadata {
  document_id: string;
  effective_year?: number | null;
  regulation?: string | null;
  version_label?: string | null;
}

export interface MaterialMetadata {
  document_id: string;
  material_kind: MaterialKind;
  author?: string | null;
  publisher?: string | null;
}

export interface DocumentStats {
  document_id: string;
  views: number;
  likes: number;
  downloads: number;
  updated_at: string;
}

export interface DocumentRelation {
  id: string;
  source_document_id: string;
  target_document_id: string;
  relation_type: DocumentRelationType;
  target_title?: string;
  target_type?: DocumentType;
  created_at: string;
}

export interface AssetRecord {
  id: string;
  content_hash: string;
  storage_key: string;
  original_filename: string;
  mime_type?: string | null;
  size_bytes?: number | null;
  created_at: string;
}

export interface DocumentFileRecord {
  id: string;
  document_id: string;
  asset_id: string;
  file_type: FileType;
  is_primary: number;
  created_at: string;
  // Asset fields joined
  original_filename?: string;
  storage_key?: string;
  file_url?: string;
  mime_type?: string;
  size_bytes?: number;
}

export interface UnifiedDocument {
  id: string;
  document_type: DocumentType;
  subject_id: string;
  curriculum_node_id?: string | null;
  title: string;
  description?: string | null;
  status: DocumentStatus;
  created_by?: string | null;
  updated_by?: string | null;
  created_at: string;
  updated_at: string;

  // Joined Subject details
  subject_name?: string;
  subject_code?: string;
  semester?: number;
  branch_id?: string;
  branch_name?: string;
  university_id?: string;
  university_name?: string;

  // Joined Curriculum Node
  curriculum_node_title?: string;
  curriculum_unit_no?: number;

  // Type Metadata
  pyq_metadata?: PyqMetadata | null;
  syllabus_metadata?: SyllabusMetadata | null;
  material_metadata?: MaterialMetadata | null;

  // Associated Files & Stats & Relations
  files?: DocumentFileRecord[];
  stats?: DocumentStats;
  relations?: DocumentRelation[];

  // Backward compatibility legacy properties
  paper_year?: number | null;
  season?: 'S' | 'W' | null;
  exam_label?: string | null;
  syllabus_year?: number | null;
  regulation?: string | null;
  version_label?: string | null;
  material_kind?: MaterialKind;
  unit_no?: number | null;
  chapter?: string | null;
  topic?: string | null;
  author?: string | null;
  views?: number;
  likes?: number;
  downloads?: number;
}

export interface KeyDocsQueryFilters {
  subject_id?: string;
  branch_id?: string;
  semester?: number;
  university_id?: string;
  document_type?: DocumentType;
  status?: DocumentStatus;
  curriculum_node_id?: string;
  material_kind?: MaterialKind;
  paper_year?: number;
  season?: 'S' | 'W';
  search?: string;
  limit?: number;
  offset?: number;
}
