-- ============================================================================
-- SHIKSHA SAHAYAK - UNIVERSAL GTU PYQ SCHEMA FOR CLOUDFLARE D1
-- ============================================================================
-- Designed for zero-downtime idempotency (IF NOT EXISTS).
-- Supports both:
--   1. Main Student Document Catalog (documents, document_files, pyq_details, document_stats)
--   2. Canonical Question Paper Registry (canonical_subjects, gtu_subject_mappings, gtu_question_papers, gtu_paper_registry)
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ----------------------------------------------------------------------------
-- 1. BASE ACADEMIC ENTITIES (Preserved / Verified)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS universities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    short_name TEXT,
    slug TEXT NOT NULL UNIQUE,
    country TEXT DEFAULT 'India',
    state TEXT DEFAULT 'Gujarat',
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS branches (
    id TEXT PRIMARY KEY,
    university_id TEXT NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    short_name TEXT,
    code TEXT,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(university_id) REFERENCES universities(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,
    university_id TEXT NOT NULL,
    branch_id TEXT NOT NULL,
    semester INTEGER NOT NULL CHECK (semester BETWEEN 0 AND 12),
    name TEXT NOT NULL,
    code TEXT,
    slug TEXT NOT NULL,
    subject_group_id TEXT,
    wef_year INTEGER CHECK (wef_year IS NULL OR wef_year BETWEEN 2000 AND 2100),
    credits INTEGER NOT NULL DEFAULT 4,
    syllabus_url TEXT,
    syllabus_link TEXT,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(branch_id, semester, slug),
    UNIQUE(branch_id, semester, code),
    FOREIGN KEY(university_id) REFERENCES universities(id) ON DELETE CASCADE,
    FOREIGN KEY(branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- 2. CORE DOCUMENT CATALOG TABLES (Student Portal & Academic Views)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    document_type TEXT NOT NULL CHECK (document_type IN ('pyq', 'syllabus', 'study-material')),
    university_id TEXT NOT NULL,
    branch_id TEXT NOT NULL,
    semester INTEGER NOT NULL CHECK (semester BETWEEN 0 AND 12),
    subject_id TEXT NOT NULL,
    curriculum_node_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'review', 'published', 'archived', 'rejected')),
    approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    paper_year INTEGER CHECK (paper_year IS NULL OR paper_year BETWEEN 2000 AND 2100),
    season TEXT CHECK (season IS NULL OR season IN ('S', 'W')),
    exam_label TEXT,
    syllabus_year INTEGER CHECK (syllabus_year IS NULL OR syllabus_year BETWEEN 2000 AND 2100),
    regulation TEXT,
    version_label TEXT,
    material_kind TEXT DEFAULT 'notes' CHECK (material_kind IS NULL OR material_kind IN ('notes', 'book', 'assignment', 'practical', 'question_bank', 'video', 'other')),
    unit_no INTEGER CHECK (unit_no IS NULL OR unit_no >= 0),
    chapter TEXT,
    topic TEXT,
    author TEXT,
    views INTEGER NOT NULL DEFAULT 0 CHECK (views >= 0),
    likes INTEGER NOT NULL DEFAULT 0 CHECK (likes >= 0),
    downloads INTEGER NOT NULL DEFAULT 0 CHECK (downloads >= 0),
    uploaded_by TEXT,
    approved_by TEXT,
    approved_at TEXT,
    blog_id TEXT,
    parent_document_id TEXT,
    created_by TEXT,
    updated_by TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(university_id) REFERENCES universities(id) ON DELETE CASCADE,
    FOREIGN KEY(branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    FOREIGN KEY(subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS document_files (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('paper', 'solution', 'syllabus', 'material', 'thumbnail', 'other')),
    file_asset_id TEXT,
    original_filename TEXT,
    storage_key TEXT,
    file_url TEXT NOT NULL,
    mime_type TEXT,
    size_bytes INTEGER CHECK (size_bytes IS NULL OR size_bytes >= 0),
    is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pyq_details (
    document_id TEXT PRIMARY KEY,
    paper_year INTEGER NOT NULL CHECK (paper_year BETWEEN 2000 AND 2100),
    season TEXT NOT NULL CHECK (season IN ('S', 'W')),
    exam_label TEXT,
    FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS document_stats (
    document_id TEXT PRIMARY KEY,
    views INTEGER NOT NULL DEFAULT 0 CHECK (views >= 0),
    likes INTEGER NOT NULL DEFAULT 0 CHECK (likes >= 0),
    downloads INTEGER NOT NULL DEFAULT 0 CHECK (downloads >= 0),
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- 3. CANONICAL GTU PYQ INTELLIGENCE REGISTRY
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS canonical_subjects (
    id TEXT PRIMARY KEY,
    university_id TEXT NOT NULL DEFAULT 'gtu',
    degree TEXT NOT NULL DEFAULT 'BE',
    branch_id TEXT NOT NULL,
    semester INTEGER NOT NULL CHECK (semester BETWEEN 0 AND 12),
    canonical_name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    aliases TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'merged')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(university_id) REFERENCES universities(id) ON DELETE CASCADE,
    FOREIGN KEY(branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS gtu_subject_mappings (
    id TEXT PRIMARY KEY,
    canonical_subject_id TEXT NOT NULL,
    subject_code TEXT NOT NULL,
    official_subject_name TEXT NOT NULL,
    degree TEXT NOT NULL DEFAULT 'BE',
    branch_id TEXT NOT NULL,
    semester INTEGER NOT NULL CHECK (semester BETWEEN 0 AND 12),
    syllabus_version TEXT,
    effective_year INTEGER CHECK (effective_year IS NULL OR (effective_year BETWEEN 2000 AND 2100)),
    aliases TEXT,
    source TEXT NOT NULL DEFAULT 'GTU_OFFICIAL',
    confidence REAL NOT NULL DEFAULT 1.0,
    mapping_status TEXT NOT NULL DEFAULT 'confirmed' CHECK (mapping_status IN ('confirmed', 'probable', 'needs_review', 'unmatched')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(branch_id, semester, subject_code),
    FOREIGN KEY(canonical_subject_id) REFERENCES canonical_subjects(id) ON DELETE CASCADE,
    FOREIGN KEY(branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS gtu_question_papers (
    id TEXT PRIMARY KEY,
    canonical_subject_id TEXT NOT NULL,
    gtu_subject_mapping_id TEXT,
    subject_code TEXT NOT NULL,
    title TEXT NOT NULL,
    official_subject_name TEXT NOT NULL,
    degree TEXT NOT NULL DEFAULT 'BE',
    branch_id TEXT NOT NULL,
    semester INTEGER NOT NULL CHECK (semester BETWEEN 0 AND 12),
    exam_year INTEGER NOT NULL CHECK (exam_year BETWEEN 2000 AND 2100),
    exam_session TEXT NOT NULL CHECK (exam_session IN ('SUMMER', 'WINTER')),
    exam_date TEXT,
    document_type TEXT NOT NULL DEFAULT 'pyq',
    file_type TEXT NOT NULL DEFAULT 'paper',
    source TEXT NOT NULL DEFAULT 'GTU_OFFICIAL',
    source_url TEXT NOT NULL,
    canonical_url TEXT NOT NULL,
    verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('verified', 'unverified', 'broken', 'redirected')),
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    first_discovered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_verified_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(subject_code, exam_year, exam_session, source_url),
    FOREIGN KEY(canonical_subject_id) REFERENCES canonical_subjects(id) ON DELETE CASCADE,
    FOREIGN KEY(gtu_subject_mapping_id) REFERENCES gtu_subject_mappings(id) ON DELETE SET NULL,
    FOREIGN KEY(branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS gtu_paper_registry (
    id TEXT PRIMARY KEY,
    subject_code TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    session TEXT NOT NULL,
    exam_year INTEGER NOT NULL,
    season TEXT NOT NULL CHECK (season IN ('SUMMER', 'WINTER')),
    canonical_pdf_url TEXT NOT NULL,
    r2_storage_path TEXT,
    sha256_hash TEXT NOT NULL DEFAULT '',
    file_size_bytes INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'DISCOVERED' CHECK (status IN (
      'DISCOVERED', 'DOWNLOADED', 'EXTRACTED', 'TRANSFORMED', 'STAGED', 'FAILED', 'RETRY_PENDING'
    )),
    http_status INTEGER DEFAULT 200,
    extraction_attempts INTEGER DEFAULT 0,
    last_error_message TEXT,
    discovered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(subject_code, session)
);

CREATE TABLE IF NOT EXISTS gtu_sync_logs (
    id TEXT PRIMARY KEY,
    sync_started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sync_completed_at TEXT,
    status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
    candidates_generated INTEGER NOT NULL DEFAULT 0,
    discovered_count INTEGER NOT NULL DEFAULT 0,
    links_found INTEGER NOT NULL DEFAULT 0,
    links_new INTEGER NOT NULL DEFAULT 0,
    links_existing INTEGER NOT NULL DEFAULT 0,
    links_verified INTEGER NOT NULL DEFAULT 0,
    links_failed INTEGER NOT NULL DEFAULT 0,
    unverified_count INTEGER NOT NULL DEFAULT 0,
    errors TEXT,
    summary_json TEXT
);

-- ----------------------------------------------------------------------------
-- 4. PERFORMANCE & LOOKUP INDEXES
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_documents_pyq_lookup ON documents(document_type, branch_id, semester, approval_status);
CREATE INDEX IF NOT EXISTS idx_documents_subject_pyq ON documents(subject_id, document_type, paper_year, season);
CREATE INDEX IF NOT EXISTS idx_document_files_pyq_doc ON document_files(document_id, file_type);
CREATE INDEX IF NOT EXISTS idx_canonical_subjects_branch_sem ON canonical_subjects(branch_id, semester, status);
CREATE INDEX IF NOT EXISTS idx_gtu_subject_mappings_code ON gtu_subject_mappings(subject_code, branch_id);
CREATE INDEX IF NOT EXISTS idx_gtu_question_papers_lookup ON gtu_question_papers(subject_code, exam_year, exam_session);
CREATE INDEX IF NOT EXISTS idx_gtu_question_papers_branch_sem ON gtu_question_papers(branch_id, semester, is_active);
CREATE INDEX IF NOT EXISTS idx_gtu_paper_registry_code_session ON gtu_paper_registry(subject_code, session);
