-- ============================================================
-- SHIKSHA SAHAYAK 2.0 - CANONICAL D1 SCHEMA
-- Single Source of Truth for Database Architecture
-- ============================================================

PRAGMA foreign_keys = ON;

-- 1. UNIVERSITIES
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

-- 2. BRANCHES
CREATE TABLE IF NOT EXISTS branches (
    id TEXT PRIMARY KEY,
    university_id TEXT NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    short_name TEXT,
    code TEXT,
    Code INT,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(university_id) REFERENCES universities(id) ON DELETE CASCADE
);

-- 3. SUBJECT GROUPS
CREATE TABLE IF NOT EXISTS subject_groups (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. SUBJECTS
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
    FOREIGN KEY(branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    FOREIGN KEY(subject_group_id) REFERENCES subject_groups(id) ON DELETE SET NULL
);

-- 5. ACADEMIC YEARS
CREATE TABLE IF NOT EXISTS academic_years (
    id TEXT PRIMARY KEY,
    year TEXT NOT NULL UNIQUE,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Upcoming', 'Inactive', 'Archived')),
    description TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. CURRICULUM NODES (Canonical KeyDocs 3.0 Infinite Hierarchy)
CREATE TABLE IF NOT EXISTS curriculum_nodes (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL,
    parent_id TEXT,
    node_type TEXT NOT NULL CHECK (node_type IN ('unit', 'topic', 'subtopic')),
    node_number REAL,
    title TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY(parent_id) REFERENCES curriculum_nodes(id) ON DELETE CASCADE
);

-- Legacy Curriculum Tables (Preserved for compatibility)
CREATE TABLE IF NOT EXISTS subject_units (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL,
    unit_no INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS subject_topics (
    id TEXT PRIMARY KEY,
    unit_id TEXT NOT NULL,
    topic_no REAL,
    title TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(unit_id) REFERENCES subject_units(id) ON DELETE CASCADE
);

-- 8. DOCUMENTS (Thin Core Document Catalog)
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
    
    -- Legacy Backfill Columns (Preserved for zero-downtime student API compatibility)
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
    FOREIGN KEY(subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY(curriculum_node_id) REFERENCES curriculum_nodes(id) ON DELETE SET NULL
);

-- KEYDOCS 3.0 TYPE-SPECIFIC METADATA & RELATIONS
CREATE TABLE IF NOT EXISTS pyq_metadata (
    document_id TEXT PRIMARY KEY,
    exam_year INTEGER CHECK (exam_year IS NULL OR exam_year BETWEEN 2000 AND 2100),
    season TEXT CHECK (season IS NULL OR season IN ('S', 'W')),
    exam_label TEXT,
    FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS syllabus_metadata (
    document_id TEXT PRIMARY KEY,
    effective_year INTEGER CHECK (effective_year IS NULL OR effective_year BETWEEN 2000 AND 2100),
    regulation TEXT,
    version_label TEXT,
    FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS material_metadata (
    document_id TEXT PRIMARY KEY,
    material_kind TEXT DEFAULT 'notes' CHECK (material_kind IS NULL OR material_kind IN ('notes', 'book', 'assignment', 'practical', 'question_bank', 'video', 'other')),
    author TEXT,
    publisher TEXT,
    FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pyq_details (
    document_id TEXT PRIMARY KEY,
    paper_year INTEGER NOT NULL CHECK (paper_year BETWEEN 2000 AND 2100),
    season TEXT NOT NULL CHECK (season IN ('S', 'W')),
    exam_label TEXT,
    FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS syllabus_details (
    document_id TEXT PRIMARY KEY,
    syllabus_year INTEGER CHECK (syllabus_year IS NULL OR syllabus_year BETWEEN 2000 AND 2100),
    regulation TEXT,
    version_label TEXT,
    FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS study_material_details (
    document_id TEXT PRIMARY KEY,
    material_kind TEXT NOT NULL DEFAULT 'notes' CHECK (material_kind IN ('notes', 'book', 'assignment', 'practical', 'question_bank', 'video', 'other')),
    unit_no INTEGER CHECK (unit_no IS NULL OR unit_no >= 0),
    chapter TEXT,
    topic TEXT,
    author TEXT,
    FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS document_relations (
    id TEXT PRIMARY KEY,
    source_document_id TEXT NOT NULL,
    target_document_id TEXT NOT NULL,
    relation_type TEXT NOT NULL CHECK (relation_type IN ('solution', 'revision', 'translation', 'duplicate', 'related')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(source_document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY(target_document_id) REFERENCES documents(id) ON DELETE CASCADE,
    UNIQUE(source_document_id, target_document_id, relation_type)
);

CREATE TABLE IF NOT EXISTS document_stats (
    document_id TEXT PRIMARY KEY,
    views INTEGER NOT NULL DEFAULT 0 CHECK (views >= 0),
    likes INTEGER NOT NULL DEFAULT 0 CHECK (likes >= 0),
    downloads INTEGER NOT NULL DEFAULT 0 CHECK (downloads >= 0),
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    content_hash TEXT NOT NULL UNIQUE,
    storage_key TEXT NOT NULL UNIQUE,
    original_filename TEXT NOT NULL,
    mime_type TEXT,
    size_bytes INTEGER CHECK (size_bytes IS NULL OR size_bytes >= 0),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. FILE ASSETS & DOCUMENT FILES
CREATE TABLE IF NOT EXISTS file_assets (
    id TEXT PRIMARY KEY,
    content_hash TEXT NOT NULL UNIQUE,
    original_filename TEXT NOT NULL,
    storage_key TEXT NOT NULL UNIQUE,
    mime_type TEXT,
    size_bytes INTEGER CHECK (size_bytes IS NULL OR size_bytes >= 0),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
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
    FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY(file_asset_id) REFERENCES file_assets(id)
);

-- 10. CONTENT FACTORY
CREATE TABLE IF NOT EXISTS content_factory_jobs (
    id TEXT PRIMARY KEY,
    university_id TEXT NOT NULL,
    branch_id TEXT NOT NULL,
    semester INTEGER NOT NULL,
    subject_id TEXT NOT NULL,
    unit_no INTEGER NOT NULL,
    topics TEXT NOT NULL,
    content_types TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    total_topics INTEGER NOT NULL DEFAULT 0,
    completed_topics INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    created_by TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS content_factory_items (
    id TEXT PRIMARY KEY,
    job_id TEXT,
    university_id TEXT NOT NULL,
    branch_id TEXT NOT NULL,
    semester INTEGER NOT NULL,
    subject_id TEXT NOT NULL,
    unit_no INTEGER NOT NULL,
    unit_title TEXT,
    topic TEXT NOT NULL,
    content_type TEXT NOT NULL,
    difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    structured_content TEXT NOT NULL,
    raw_markdown TEXT,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED')),
    validation_status TEXT DEFAULT 'valid' CHECK (validation_status IN ('valid', 'flagged', 'warning')),
    validation_notes TEXT,
    published_document_id TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(job_id) REFERENCES content_factory_jobs(id) ON DELETE SET NULL,
    FOREIGN KEY(published_document_id) REFERENCES documents(id) ON DELETE SET NULL
);

-- 11. USER ACCESS, RBAC & WHITELISTS
CREATE TABLE IF NOT EXISTS unified_users (
    id TEXT PRIMARY KEY,
    uid TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT,
    user_type TEXT NOT NULL DEFAULT 'student' CHECK (
        user_type IN ('guest', 'student', 'teacher', 'moderator', 'admin', 'super_admin', 'parent', 'alumni')
    ),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deactivated', 'pending')),
    ai_beta_enabled INTEGER NOT NULL DEFAULT 0 CHECK (ai_beta_enabled IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS academic_profiles (
    user_id TEXT PRIMARY KEY,
    university_id TEXT,
    college_name TEXT,
    degree_id TEXT,
    branch_id TEXT,
    semester_id TEXT,
    enrollment_year INTEGER,
    graduation_year INTEGER,
    enrollment_number TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES unified_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS teacher_whitelist (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    department TEXT,
    college TEXT,
    status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('approved', 'pending', 'suspended')),
    notes TEXT,
    added_by TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_beta_access (
    user_id TEXT PRIMARY KEY,
    is_beta_tester INTEGER NOT NULL DEFAULT 1 CHECK (is_beta_tester IN (0, 1)),
    custom_flags_json TEXT,
    notes TEXT,
    granted_by TEXT,
    granted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_active_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS custom_roles (
    id TEXT PRIMARY KEY,
    role_key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    badge_color TEXT DEFAULT 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    icon_name TEXT DEFAULT 'Shield',
    is_system INTEGER NOT NULL DEFAULT 0 CHECK (is_system IN (0, 1)),
    permissions_json TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles_and_permissions (
    id TEXT PRIMARY KEY,
    role_key TEXT NOT NULL,
    permission_key TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_key, permission_key)
);

-- 12. PLATFORM CONFIGURATION & AUDIT
CREATE TABLE IF NOT EXISTS feature_flags (
    flag_key TEXT PRIMARY KEY,
    is_enabled INTEGER NOT NULL DEFAULT 1 CHECK (is_enabled IN (0, 1)),
    description TEXT,
    updated_by TEXT,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id TEXT PRIMARY KEY,
    admin_id TEXT NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    details TEXT,
    details_json TEXT,
    ip_address TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 13. CONTENT EXTENSIONS
CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    link TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blogs (
    id TEXT PRIMARY KEY,
    related_document_id TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT DEFAULT 'Admin',
    category TEXT DEFAULT 'Study Guides',
    tags TEXT,
    thumbnail TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    views INTEGER DEFAULT 0 CHECK (views >= 0),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(related_document_id) REFERENCES documents(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS bug_reports (
    id TEXT PRIMARY KEY,
    user_email TEXT NOT NULL,
    description TEXT NOT NULL,
    screenshot_url TEXT,
    error_stack TEXT,
    browser_info TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'closed')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS website_popups (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'announcement',
    html_content TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 0 CHECK (is_active IN (0, 1)),
    start_date TEXT,
    end_date TEXT,
    frequency TEXT NOT NULL DEFAULT 'once',
    expiry_days INTEGER DEFAULT 7,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 14. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_universities_active ON universities(is_active);
CREATE INDEX IF NOT EXISTS idx_branches_university ON branches(university_id, is_active);
CREATE INDEX IF NOT EXISTS idx_subjects_lookup ON subjects(branch_id, semester, slug);
CREATE INDEX IF NOT EXISTS idx_subject_units_subject ON subject_units(subject_id, unit_no);
CREATE INDEX IF NOT EXISTS idx_subject_topics_unit ON subject_topics(unit_id, topic_no);
CREATE INDEX IF NOT EXISTS idx_documents_lookup ON documents(document_type, branch_id, semester, subject_id, approval_status);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(approval_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_assets_hash ON file_assets(content_hash);
CREATE INDEX IF NOT EXISTS idx_file_assets_storage_key ON file_assets(storage_key);
CREATE INDEX IF NOT EXISTS idx_document_files_document ON document_files(document_id, file_type, is_primary);
CREATE INDEX IF NOT EXISTS idx_document_files_asset ON document_files(file_asset_id);
CREATE INDEX IF NOT EXISTS idx_documents_pyq_lookup ON documents(paper_year DESC, season);
CREATE INDEX IF NOT EXISTS idx_blogs_status_created ON blogs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blogs_related_document ON blogs(related_document_id);
CREATE INDEX IF NOT EXISTS idx_website_popups_active ON website_popups(is_active);
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON bug_reports(status);
CREATE INDEX IF NOT EXISTS idx_bug_reports_created ON bug_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cf_jobs_status ON content_factory_jobs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cf_items_lookup ON content_factory_items(university_id, branch_id, semester, subject_id, unit_no);
CREATE INDEX IF NOT EXISTS idx_cf_items_status ON content_factory_items(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cf_items_job ON content_factory_items(job_id);
CREATE INDEX IF NOT EXISTS idx_teacher_whitelist_email ON teacher_whitelist(email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON admin_audit_logs(created_at DESC);

-- 15. SEED DATA
INSERT OR IGNORE INTO universities (id, name, short_name, slug, country, state, is_active) VALUES
('gtu', 'Gujarat Technological University', 'GTU', 'gtu', 'India', 'Gujarat', 1),
('univ_default', 'Default University', 'DU', 'default-university', 'India', 'Gujarat', 1);

INSERT OR IGNORE INTO branches (id, university_id, name, slug, short_name, code, is_active) VALUES
('branch_00', 'gtu', '1st Year Common', 'first-year', 'FYC', '00', 1),
('branch_05', 'gtu', 'Chemical Engineering', 'chemical-engineering', 'Chemical', '05', 1),
('branch_06', 'gtu', 'Civil Engineering', 'civil-engineering', 'Civil', '06', 1),
('branch_07', 'gtu', 'Computer Engineering', 'computer-engineering', 'CE', '07', 1),
('branch_09', 'gtu', 'Electrical Engineering', 'electrical-engineering', 'EE', '09', 1),
('branch_11', 'gtu', 'Electronics & Communication Engineering', 'electronics-and-communication-engineering', 'ECE', '11', 1),
('branch_16', 'gtu', 'Information Technology', 'information-technology', 'IT', '16', 1),
('branch_19', 'gtu', 'Mechanical Engineering', 'mechanical-engineering', 'Mechanical', '19', 1),
('branch_first_year', 'univ_default', '1st Year Common', 'first-year-default', 'FYC', '00', 1),
('branch_computer', 'univ_default', 'Computer Engineering', 'computer', 'CSE', '07', 1),
('branch_it', 'univ_default', 'Information Technology', 'it', 'IT', '16', 1),
('branch_electrical', 'univ_default', 'Electrical Engineering', 'electrical', 'EE', '09', 1),
('branch_ece', 'univ_default', 'Electronics and Communication', 'ece', 'ECE', '11', 1),
('branch_mechanical', 'univ_default', 'Mechanical Engineering', 'mechanical', 'ME', '19', 1),
('branch_civil', 'univ_default', 'Civil Engineering', 'civil', 'CE', '06', 1);

INSERT OR IGNORE INTO academic_years (id, year, start_date, end_date, status, description) VALUES
('ay_2026_27', '2026-27', '2026-06-01', '2027-05-31', 'Active', 'Current Academic Calendar Year 2026-2027'),

('ay_2025_26', '2025-26', '2025-06-01', '2026-05-31', 'Upcoming', 'Academic Calendar Year 2025-2026'),
('ay_2024_25', '2024-25', '2024-06-01', '2025-05-31', 'Inactive', 'Archived Calendar Year 2024-2025'),
('ay_2023_24', '2023-24', '2023-06-01', '2024-05-31', 'Archived', 'Historical Calendar Year 2023-2024');

-- ============================================================
-- 15. CANONICAL GTU PYQ SYSTEM (MIGRATION 064)
-- ============================================================

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

CREATE TABLE IF NOT EXISTS gtu_sync_logs (
    id TEXT PRIMARY KEY,
    sync_started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sync_completed_at TEXT,
    status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
    candidates_generated INTEGER NOT NULL DEFAULT 0,
    discovered_count INTEGER NOT NULL DEFAULT 0,
    verified_count INTEGER NOT NULL DEFAULT 0,
    broken_count INTEGER NOT NULL DEFAULT 0,
    unverified_count INTEGER NOT NULL DEFAULT 0,
    indexed_count INTEGER NOT NULL DEFAULT 0,
    mapping_review_count INTEGER NOT NULL DEFAULT 0,
    links_found INTEGER NOT NULL DEFAULT 0,
    links_new INTEGER NOT NULL DEFAULT 0,
    links_existing INTEGER NOT NULL DEFAULT 0,
    links_updated INTEGER NOT NULL DEFAULT 0,
    links_verified INTEGER NOT NULL DEFAULT 0,
    links_failed INTEGER NOT NULL DEFAULT 0,
    metadata_unresolved INTEGER NOT NULL DEFAULT 0,
    mapping_review_required INTEGER NOT NULL DEFAULT 0,
    errors TEXT,
    summary_json TEXT
);

-- ============================================================
-- 16. QUESTION INTELLIGENCE ENGINE (MIGRATIONS 069-076)
-- ============================================================


-- Master Question Bank
CREATE TABLE IF NOT EXISTS master_question_bank (
    id TEXT PRIMARY KEY,
    source_type TEXT NOT NULL CHECK (source_type IN ('GTU', 'GATE', 'AI_PRACTICE', 'TEACHER', 'OTHER', 'MANUAL')),
    is_original_pyq INTEGER NOT NULL DEFAULT 1 CHECK (is_original_pyq IN (0, 1)),
    is_ai_generated INTEGER NOT NULL DEFAULT 0 CHECK (is_ai_generated IN (0, 1)),
    parent_question_id TEXT,
    provenance_id TEXT,
    source_url TEXT,
    exam_name TEXT NOT NULL DEFAULT 'GTU',
    exam_year INTEGER CHECK (exam_year IS NULL OR (exam_year BETWEEN 2000 AND 2100)),
    exam_session TEXT CHECK (exam_session IS NULL OR exam_session IN ('SUMMER', 'WINTER', 'FEBRUARY', 'NONE')),
    exam_paper_code TEXT,
    question_no TEXT,
    sub_question_no TEXT,
    canonical_subject_id TEXT,
    subject_code TEXT,
    subject_name TEXT NOT NULL,
    semester INTEGER NOT NULL CHECK (semester BETWEEN 0 AND 12),
    curriculum_node_id TEXT,
    unit_no INTEGER,
    topic_name TEXT,
    subtopic_name TEXT,
    question_type TEXT NOT NULL CHECK (question_type IN ('MCQ', 'MSQ', 'NAT')),
    question_text TEXT NOT NULL,
    question_html TEXT,
    question_image_url TEXT,
    options_json TEXT,
    correct_answer_json TEXT NOT NULL,
    acceptable_numerical_range_json TEXT,
    explanation TEXT,
    step_by_step_solution_json TEXT,
    latex_formulas_json TEXT,
    diagram_needed INTEGER DEFAULT 0 CHECK (diagram_needed IN (0, 1)),
    diagram_r2_url TEXT,
    marks REAL NOT NULL DEFAULT 1.0,
    negative_marking REAL NOT NULL DEFAULT 0.0,
    difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    bloom_level TEXT CHECK (bloom_level IS NULL OR bloom_level IN ('REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE')),
    tags_json TEXT,
    verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'draft', 'needs_review', 'pending', 'verified', 'approved', 'rejected', 'flagged', 'archived')),
    verified_by TEXT,
    verified_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(parent_question_id) REFERENCES master_question_bank(id) ON DELETE SET NULL,
    FOREIGN KEY(canonical_subject_id) REFERENCES canonical_subjects(id) ON DELETE SET NULL,
    FOREIGN KEY(curriculum_node_id) REFERENCES curriculum_nodes(id) ON DELETE SET NULL
);


-- Question Branch Mappings
CREATE TABLE IF NOT EXISTS question_branch_mappings (
    id TEXT PRIMARY KEY,
    question_id TEXT NOT NULL,
    branch_id TEXT NOT NULL,
    is_primary INTEGER DEFAULT 1 CHECK (is_primary IN (0, 1)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES master_question_bank(id) ON DELETE CASCADE,
    UNIQUE(question_id, branch_id)
);

-- Ingestion Queue
CREATE TABLE IF NOT EXISTS question_ingestion_queue (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL CHECK (source IN ('GTU_PDF', 'GATE_ZIP', 'AI_GENERATOR', 'MANUAL_IMPORT', 'GTU', 'GATE', 'AI_PRACTICE', 'MANUAL')),
    raw_payload_json TEXT NOT NULL DEFAULT '{}',
    extracted_question_text TEXT,
    detected_type TEXT CHECK (detected_type IS NULL OR detected_type IN ('MCQ', 'MSQ', 'NAT')),
    confidence_score REAL DEFAULT 0.0,
    processing_status TEXT NOT NULL DEFAULT 'staged' CHECK (processing_status IN ('staged', 'processing', 'approved', 'rejected', 'failed', 'pending', 'needs_review')),
    error_log TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Student MCQ Attempts & Bookmarks
CREATE TABLE IF NOT EXISTS student_mcq_attempts (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    selected_option_id TEXT NOT NULL,
    is_correct INTEGER NOT NULL CHECK (is_correct IN (0, 1)),
    time_taken_seconds INTEGER DEFAULT 0,
    practice_mode TEXT DEFAULT 'RANDOM' CHECK(practice_mode IN ('TOPIC_WISE', 'PYQ_WISE', 'RANDOM', 'CUSTOM')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES master_question_bank(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS student_mcq_bookmarks (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES master_question_bank(id) ON DELETE CASCADE,
    UNIQUE(student_id, question_id)
);

-- Test Sessions
CREATE TABLE IF NOT EXISTS test_sessions (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    test_type TEXT NOT NULL CHECK(test_type IN (
        'RANDOM_TEST', 'TOPIC_TEST', 'SUBJECT_TEST', 'BRANCH_TEST',
        'GTU_PYQ_TEST', 'GATE_PYQ_TEST', 'MIXED_TEST', 'CUSTOM_TEST',
        'WEAK_TOPIC_TEST', 'INCORRECT_QUESTION_TEST', 'BOOKMARK_TEST'
    )),
    source_mode TEXT DEFAULT 'ALL' CHECK(source_mode IN ('GTU_PYQ', 'GATE_PYQ', 'AI_GENERATED', 'PRACTICE', 'ALL')),
    practice_mode TEXT DEFAULT 'EXAM_MODE' CHECK(practice_mode IN ('EXAM_MODE', 'IMMEDIATE_PRACTICE')),
    branch_id TEXT,
    semester INTEGER,
    subject_code TEXT,
    topic_name TEXT,
    question_count INTEGER NOT NULL,
    duration_minutes INTEGER NOT NULL,
    negative_marking INTEGER DEFAULT 0 CHECK(negative_marking IN (0, 1)),
    negative_mark_value REAL DEFAULT 0.25,
    seed TEXT,
    config_json TEXT,
    status TEXT DEFAULT 'CREATED' CHECK(status IN ('CREATED', 'IN_PROGRESS', 'SUBMITTED', 'EXPIRED', 'ABANDONED')),
    started_at DATETIME,
    submitted_at DATETIME,
    total_marks REAL DEFAULT 0.0,
    obtained_marks REAL DEFAULT 0.0,
    correct_count INTEGER DEFAULT 0,
    incorrect_count INTEGER DEFAULT 0,
    unanswered_count INTEGER DEFAULT 0,
    accuracy_percentage REAL DEFAULT 0.0,
    time_taken_seconds INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS test_session_questions (
    id TEXT PRIMARY KEY,
    test_session_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    sequence_number INTEGER NOT NULL,
    marks REAL DEFAULT 1.0,
    negative_marks REAL DEFAULT 0.25,
    selected_answer TEXT,
    is_correct INTEGER DEFAULT 0 CHECK(is_correct IN (0, 1)),
    marks_obtained REAL DEFAULT 0.0,
    time_taken_seconds INTEGER DEFAULT 0,
    answered_at DATETIME,
    FOREIGN KEY(test_session_id) REFERENCES test_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY(question_id) REFERENCES master_question_bank(id) ON DELETE RESTRICT,
    UNIQUE(test_session_id, question_id),
    UNIQUE(test_session_id, sequence_number)
);

CREATE TABLE IF NOT EXISTS question_audit_logs (
    id TEXT PRIMARY KEY,
    admin_id TEXT NOT NULL,
    admin_email TEXT,
    question_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK(action IN (
        'QUESTION_APPROVED', 'QUESTION_REJECTED', 'QUESTION_EDITED',
        'QUESTION_DUPLICATE', 'QUESTION_ARCHIVED', 'QUESTION_METADATA_UPDATED',
        'QUESTION_PUBLISHED', 'BULK_APPROVED', 'BULK_REJECTED', 'BULK_ARCHIVED', 'BULK_METADATA_UPDATED'
    )),
    old_value_json TEXT,
    new_value_json TEXT,
    previous_state_json TEXT,
    new_state_json TEXT,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(question_id) REFERENCES master_question_bank(id) ON DELETE CASCADE
);


-- GTU Automation Registry
CREATE TABLE IF NOT EXISTS gtu_paper_registry (
    id TEXT PRIMARY KEY,
    subject_code TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    session TEXT NOT NULL,
    exam_year INTEGER NOT NULL,
    season TEXT NOT NULL CHECK (season IN ('SUMMER', 'WINTER')),
    canonical_pdf_url TEXT NOT NULL,
    r2_storage_path TEXT,
    sha256_hash TEXT NOT NULL,
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

CREATE TABLE IF NOT EXISTS gtu_paper_discovery_runs (
    id TEXT PRIMARY KEY,
    trigger_source TEXT NOT NULL CHECK (trigger_source IN ('SCHEDULER', 'MANUAL', 'ADMIN_API')),
    subjects_scanned INTEGER DEFAULT 0,
    new_papers_discovered INTEGER DEFAULT 0,
    papers_failed INTEGER DEFAULT 0,
    duration_ms INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'FAILED')),
    run_log TEXT,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME
);

-- Pipeline Orchestrator Jobs
CREATE TABLE IF NOT EXISTS question_pipeline_jobs (
    job_id TEXT PRIMARY KEY,
    source_type TEXT NOT NULL CHECK (source_type IN ('GTU', 'GATE', 'AI_PRACTICE', 'MANUAL')),
    subject_code TEXT,
    requested_scope TEXT DEFAULT 'ALL',
    trigger_mode TEXT NOT NULL CHECK (trigger_mode IN ('SCHEDULER', 'MANUAL', 'RETRY', 'RECOVERY')),
    status TEXT NOT NULL DEFAULT 'CREATED' CHECK (status IN (
      'CREATED', 'RUNNING', 'PAUSED', 'COMPLETED', 'FAILED', 'CANCELLED'
    )),
    current_stage TEXT NOT NULL DEFAULT 'DISCOVERY' CHECK (current_stage IN (
      'DISCOVERY', 'DOWNLOAD', 'EXTRACTION', 'NORMALIZATION',
      'CLASSIFICATION', 'TRANSFORMATION', 'VALIDATION',
      'DUPLICATE_CHECK', 'QUEUE_STAGING', 'FINALIZED'
    )),
    total_items INTEGER DEFAULT 0,
    processed_items INTEGER DEFAULT 0,
    failed_items INTEGER DEFAULT 0,
    staged_items INTEGER DEFAULT 0,
    is_non_mutating_preview INTEGER DEFAULT 0 CHECK (is_non_mutating_preview IN (0, 1)),
    checkpoint_json TEXT,
    error_summary TEXT,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME
);

CREATE TABLE IF NOT EXISTS question_pipeline_checkpoints (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL,
    stage_name TEXT NOT NULL,
    last_processed_item_id TEXT,
    items_completed INTEGER DEFAULT 0,
    checkpoint_state_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES question_pipeline_jobs(job_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS question_pipeline_errors (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL,
    item_id TEXT,
    stage_name TEXT NOT NULL,
    error_category TEXT NOT NULL CHECK (error_category IN (
      'NETWORK', 'PARSE_FAILURE', 'AI_TRANSFORM_FAILURE',
      'VALIDATION_FAILURE', 'DUPLICATE_REJECT', 'PERMANENT', 'TRANSIENT'
    )),
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    retry_count INTEGER DEFAULT 0,
    is_resolved INTEGER DEFAULT 0 CHECK (is_resolved IN (0, 1)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES question_pipeline_jobs(job_id) ON DELETE CASCADE
);

-- Quality Engine
CREATE TABLE IF NOT EXISTS question_quality_metrics (
    question_id TEXT PRIMARY KEY,
    total_attempts INTEGER DEFAULT 0,
    unique_students INTEGER DEFAULT 0,
    correct_attempts INTEGER DEFAULT 0,
    incorrect_attempts INTEGER DEFAULT 0,
    skipped_attempts INTEGER DEFAULT 0,
    accuracy_percentage REAL DEFAULT 0.0,
    difficulty_index REAL DEFAULT 0.5,
    average_time_seconds REAL DEFAULT 0.0,
    sample_confidence_band TEXT NOT NULL DEFAULT 'LOW_SAMPLE' CHECK (sample_confidence_band IN ('LOW_SAMPLE', 'LIMITED_SAMPLE', 'RELIABLE', 'HIGH_CONFIDENCE')),
    quality_score REAL DEFAULT 80.0,
    quality_band TEXT NOT NULL DEFAULT 'GOOD' CHECK (quality_band IN ('EXCELLENT', 'GOOD', 'WATCH', 'NEEDS_REVIEW', 'CRITICAL')),
    health_flags_json TEXT DEFAULT '[]',
    review_priority_score REAL DEFAULT 0.0,
    review_priority_level TEXT NOT NULL DEFAULT 'NORMAL' CHECK (review_priority_level IN ('NORMAL', 'WATCH', 'HIGH', 'CRITICAL')),
    lifecycle_status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (lifecycle_status IN ('ACTIVE', 'WATCH', 'NEEDS_REVIEW', 'QUARANTINED', 'RETIRED')),
    quarantine_reason TEXT,
    quarantined_by TEXT,
    quarantined_at DATETIME,
    last_evaluated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(question_id) REFERENCES master_question_bank(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS question_issue_reports (
    id TEXT PRIMARY KEY,
    question_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    report_type TEXT NOT NULL CHECK (report_type IN (
      'WRONG_ANSWER', 'AMBIGUOUS', 'TYPO', 'BROKEN_LATEX',
      'INCORRECT_EXPLANATION', 'BAD_EXPLANATION', 'DUPLICATE', 'OUT_OF_SYLLABUS', 'LATEX_BROKEN', 'TECHNICAL_ERROR', 'OTHER'
    )),
    message TEXT,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'PENDING', 'INVESTIGATING', 'RESOLVED', 'DISMISSED')),
    resolution_note TEXT,
    resolution_notes TEXT,
    resolved_by TEXT,
    resolved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES master_question_bank(id) ON DELETE CASCADE,
    UNIQUE(question_id, student_id, report_type)
);


CREATE TABLE IF NOT EXISTS question_quality_events (
    id TEXT PRIMARY KEY,
    question_id TEXT NOT NULL,
    actor_id TEXT NOT NULL DEFAULT 'system',
    actor_role TEXT NOT NULL DEFAULT 'system',
    event_type TEXT NOT NULL CHECK (event_type IN (
      'REPORT_FILED', 'REPORT_RESOLVED', 'QUALITY_RECALCULATED',
      'HEALTH_FLAGGED', 'QUARANTINED', 'RESTORED', 'RETIRED'
    )),
    previous_state_json TEXT,
    new_state_json TEXT,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(question_id) REFERENCES master_question_bank(id) ON DELETE CASCADE
);


-- Student Mastery & Adaptive Engine
CREATE TABLE IF NOT EXISTS student_topic_mastery (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    branch_id TEXT NOT NULL,
    subject_code TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    topic_name TEXT NOT NULL,
    mastery_score REAL DEFAULT 0.0,
    mastery_level TEXT NOT NULL DEFAULT 'LOW_CONFIDENCE' CHECK (mastery_level IN (
      'LOW_CONFIDENCE', 'DEVELOPING', 'PRACTICING', 'PROFICIENT', 'MASTERED'
    )),
    confidence_band TEXT NOT NULL DEFAULT 'LOW_SAMPLE' CHECK (confidence_band IN (
      'LOW_SAMPLE', 'LIMITED_SAMPLE', 'RELIABLE', 'HIGH_CONFIDENCE'
    )),
    total_attempts INTEGER DEFAULT 0,
    correct_attempts INTEGER DEFAULT 0,
    incorrect_attempts INTEGER DEFAULT 0,
    skipped_attempts INTEGER DEFAULT 0,
    accuracy_percentage REAL DEFAULT 0.0,
    recent_accuracy_percentage REAL DEFAULT 0.0,
    average_time_seconds REAL DEFAULT 0.0,
    last_practiced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, branch_id, subject_code, topic_name)
);

CREATE TABLE IF NOT EXISTS student_adaptive_recommendations (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    branch_id TEXT NOT NULL,
    subject_code TEXT NOT NULL,
    topic_name TEXT NOT NULL,
    recommended_mode TEXT NOT NULL CHECK (recommended_mode IN (
      'WEAK_TOPIC_MODE', 'REVISION_MODE', 'MASTER_TOPIC_MODE',
      'BALANCED_PRACTICE', 'EXAM_MODE', 'RECOVERY_MODE', 'CHALLENGE_MODE'
    )),
    reason TEXT NOT NULL,
    target_question_count INTEGER DEFAULT 10,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'DISMISSED')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_mastery_events (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    subject_code TEXT NOT NULL,
    topic_name TEXT NOT NULL,
    previous_mastery REAL DEFAULT 0.0,
    new_mastery REAL DEFAULT 0.0,
    previous_level TEXT,
    new_level TEXT,
    trigger_event TEXT NOT NULL CHECK (trigger_event IN ('ATTEMPT_COMPLETED', 'SESSION_SUBMITTED', 'MANUAL_RECALCULATION')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_mcq_topic_progress (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    branch_id TEXT NOT NULL,
    subject_code TEXT NOT NULL,
    topic_name TEXT NOT NULL,
    total_attempted INTEGER DEFAULT 0,
    total_correct INTEGER DEFAULT 0,
    last_practiced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, branch_id, subject_code, topic_name)
);

CREATE TABLE IF NOT EXISTS gtu_discovery_runs (
    id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL UNIQUE,
    trigger_mode TEXT NOT NULL CHECK (trigger_mode IN ('MANUAL', 'BATCH', 'SCHEDULED')),
    status TEXT NOT NULL DEFAULT 'RUNNING' CHECK (status IN ('RUNNING', 'COMPLETED', 'FAILED')),
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    finished_at DATETIME,
    papers_checked INTEGER DEFAULT 0,
    papers_found INTEGER DEFAULT 0,
    new_papers INTEGER DEFAULT 0,
    already_processed INTEGER DEFAULT 0,
    downloads_count INTEGER DEFAULT 0,
    extraction_success_count INTEGER DEFAULT 0,
    questions_extracted_count INTEGER DEFAULT 0,
    ai_transformations_count INTEGER DEFAULT 0,
    validation_passed_count INTEGER DEFAULT 0,
    duplicate_candidates_count INTEGER DEFAULT 0,
    queued_count INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    summary_json TEXT
);

CREATE TABLE IF NOT EXISTS gtu_paper_ingestion_tracker (
    id TEXT PRIMARY KEY,
    paper_id TEXT NOT NULL UNIQUE,
    source_url TEXT NOT NULL,
    session TEXT NOT NULL,
    year INTEGER NOT NULL,
    course TEXT NOT NULL DEFAULT 'BE',
    subject_code TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    content_hash TEXT,
    pipeline_status TEXT NOT NULL DEFAULT 'DISCOVERED' CHECK (pipeline_status IN (
      'DISCOVERED', 'AVAILABLE', 'DOWNLOADING', 'DOWNLOADED', 'EXTRACTING',
      'EXTRACTED', 'CLASSIFYING', 'TRANSFORMING', 'VALIDATING', 'DUPLICATE_CHECK',
      'QUEUED', 'COMPLETED', 'DOWNLOAD_FAILED', 'EXTRACTION_FAILED',
      'TRANSFORMATION_FAILED', 'VALIDATION_FAILED', 'QUEUE_FAILED', 'ALREADY_PROCESSED'
    )),
    retry_count INTEGER DEFAULT 0,
    max_retry_count INTEGER DEFAULT 3,
    last_error TEXT,
    next_retry_at DATETIME,
    first_discovered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gpit_status ON gtu_paper_ingestion_tracker(pipeline_status);
CREATE INDEX IF NOT EXISTS idx_gpit_paper_code ON gtu_paper_ingestion_tracker(subject_code, year, session);
CREATE INDEX IF NOT EXISTS idx_gpit_next_retry ON gtu_paper_ingestion_tracker(next_retry_at);
CREATE INDEX IF NOT EXISTS idx_gdr_run_id ON gtu_discovery_runs(run_id);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_mqb_subject ON master_question_bank(subject_code, verification_status);
CREATE INDEX IF NOT EXISTS idx_mqb_topic ON master_question_bank(subject_code, topic_name);
CREATE INDEX IF NOT EXISTS idx_qiq_status ON question_ingestion_queue(processing_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ts_student ON test_sessions(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gtu_status ON gtu_paper_registry(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_qpj_status ON question_pipeline_jobs(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_qqm_score ON question_quality_metrics(quality_score, lifecycle_status);
CREATE INDEX IF NOT EXISTS idx_stm_student ON student_topic_mastery(student_id);
CREATE INDEX IF NOT EXISTS idx_stm_student_subj ON student_topic_mastery(student_id, subject_code);

-- ============================================================
-- 19. QUESTION BANK INTELLIGENCE, CLUSTERING & EXAM INTELLIGENCE (MIGRATIONS 079-080)
-- ============================================================

-- 1. Question Duplicate Clusters
CREATE TABLE IF NOT EXISTS question_duplicate_clusters (
    id TEXT PRIMARY KEY,
    cluster_hash TEXT NOT NULL UNIQUE,
    canonical_question_text TEXT NOT NULL,
    subject_code TEXT NOT NULL,
    semester INTEGER NOT NULL DEFAULT 1,
    total_occurrences INTEGER DEFAULT 1,
    first_appeared_session TEXT,
    first_appeared_year INTEGER,
    last_appeared_session TEXT,
    last_appeared_year INTEGER,
    repeat_frequency_band TEXT NOT NULL DEFAULT 'UNIQUE' CHECK(repeat_frequency_band IN ('VERY_HIGH_REPEAT', 'HIGH_REPEAT', 'MEDIUM_REPEAT', 'LOW_REPEAT', 'UNIQUE')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Question Duplicate Cluster Members (Preserving exact provenance)
CREATE TABLE IF NOT EXISTS question_duplicate_cluster_members (
    id TEXT PRIMARY KEY,
    cluster_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    paper_id TEXT,
    exam_session TEXT,
    exam_year INTEGER,
    similarity_score REAL DEFAULT 1.0,
    is_primary_representative INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cluster_id, question_id),
    FOREIGN KEY(cluster_id) REFERENCES question_duplicate_clusters(id) ON DELETE CASCADE,
    FOREIGN KEY(question_id) REFERENCES master_question_bank(id) ON DELETE CASCADE
);

-- 3. Question Curriculum Mappings
CREATE TABLE IF NOT EXISTS question_curriculum_mappings (
    question_id TEXT PRIMARY KEY,
    subject_code TEXT NOT NULL,
    unit_no INTEGER,
    unit_name TEXT,
    topic_name TEXT,
    subtopic_name TEXT,
    concept_tags_json TEXT DEFAULT '[]',
    mapping_confidence REAL DEFAULT 1.0,
    mapping_status TEXT NOT NULL DEFAULT 'AUTO_MAPPED' CHECK(mapping_status IN ('AUTO_MAPPED', 'REVIEW_REQUIRED', 'UNMAPPED')),
    mapped_by TEXT DEFAULT 'SYSTEM',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(question_id) REFERENCES master_question_bank(id) ON DELETE CASCADE
);

-- 4. Question Difficulty Profiles
CREATE TABLE IF NOT EXISTS question_difficulty_profiles (
    question_id TEXT PRIMARY KEY,
    difficulty_band TEXT NOT NULL DEFAULT 'MEDIUM' CHECK(difficulty_band IN ('EASY', 'MEDIUM', 'HARD', 'VERY_HARD')),
    difficulty_score REAL DEFAULT 0.5,
    difficulty_confidence REAL DEFAULT 0.8,
    difficulty_source TEXT NOT NULL DEFAULT 'INFERRED' CHECK(difficulty_source IN ('EXPLICIT', 'INFERRED', 'CALCULATED')),
    marks INTEGER DEFAULT 1,
    has_math_formula INTEGER DEFAULT 0,
    has_code_block INTEGER DEFAULT 0,
    sub_parts_count INTEGER DEFAULT 1,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(question_id) REFERENCES master_question_bank(id) ON DELETE CASCADE
);

-- 5. Question Bank Health Snapshots
CREATE TABLE IF NOT EXISTS question_bank_health_snapshots (
    id TEXT PRIMARY KEY,
    snapshot_id TEXT NOT NULL UNIQUE,
    total_questions INTEGER DEFAULT 0,
    verified_questions INTEGER DEFAULT 0,
    staged_questions INTEGER DEFAULT 0,
    rejected_questions INTEGER DEFAULT 0,
    archived_questions INTEGER DEFAULT 0,
    duplicate_clusters INTEGER DEFAULT 0,
    overall_health_score REAL DEFAULT 0.0,
    coverage_score REAL DEFAULT 0.0,
    quality_score REAL DEFAULT 0.0,
    moderation_backlog INTEGER DEFAULT 0,
    failure_rate REAL DEFAULT 0.0,
    retry_backlog INTEGER DEFAULT 0,
    metadata_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Student Exam Readiness Snapshots
CREATE TABLE IF NOT EXISTS student_exam_readiness_snapshots (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    subject_code TEXT NOT NULL,
    semester INTEGER NOT NULL DEFAULT 1,
    overall_readiness_score REAL DEFAULT 0.0,
    readiness_level TEXT NOT NULL DEFAULT 'NOT_STARTED' CHECK(readiness_level IN (
      'NOT_STARTED', 'FOUNDATION', 'DEVELOPING', 'PREPARING', 'EXAM_READY', 'STRONG'
    )),
    content_coverage_score REAL DEFAULT 0.0,
    topic_mastery_score REAL DEFAULT 0.0,
    pyq_mastery_score REAL DEFAULT 0.0,
    exam_pattern_score REAL DEFAULT 0.0,
    difficulty_score REAL DEFAULT 0.0,
    recent_performance_score REAL DEFAULT 0.0,
    revision_health_score REAL DEFAULT 0.0,
    weak_areas_json TEXT DEFAULT '[]',
    strong_areas_json TEXT DEFAULT '[]',
    recommended_actions_json TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Student Topic Risk Profiles
CREATE TABLE IF NOT EXISTS student_topic_risk_profiles (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    subject_code TEXT NOT NULL,
    unit_no INTEGER,
    topic_name TEXT NOT NULL,
    historical_priority_level TEXT NOT NULL DEFAULT 'MEDIUM',
    student_mastery_score REAL DEFAULT 0.0,
    student_attempts_count INTEGER DEFAULT 0,
    risk_level TEXT NOT NULL DEFAULT 'NO_STUDENT_DATA' CHECK(risk_level IN (
      'CRITICAL_RISK', 'HIGH_RISK', 'MODERATE_RISK', 'LOW_RISK', 'NO_STUDENT_DATA'
    )),
    risk_reason TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, subject_code, topic_name)
);

-- 8. Student Preparation Plans
CREATE TABLE IF NOT EXISTS student_preparation_plans (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    subject_code TEXT NOT NULL,
    target_exam_session TEXT,
    plan_status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(plan_status IN ('ACTIVE', 'COMPLETED', 'ARCHIVED')),
    daily_target_questions INTEGER DEFAULT 10,
    today_tasks_json TEXT DEFAULT '[]',
    upcoming_milestones_json TEXT DEFAULT '[]',
    revision_queue_json TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, subject_code, plan_status)
);

-- 9. Exam Topic Trend Snapshots
CREATE TABLE IF NOT EXISTS exam_topic_trend_snapshots (
    id TEXT PRIMARY KEY,
    subject_code TEXT NOT NULL,
    topic_name TEXT NOT NULL,
    unit_no INTEGER,
    historical_frequency INTEGER DEFAULT 0,
    recent_frequency INTEGER DEFAULT 0,
    repeat_cluster_count INTEGER DEFAULT 0,
    trend_direction TEXT NOT NULL DEFAULT 'STABLE' CHECK(trend_direction IN (
      'RISING', 'STABLE', 'DECLINING', 'RECENTLY_APPEARED', 'LONG_ABSENCE',
      'HIGH_RECURRENCE', 'LOW_RECURRENCE', 'INSUFFICIENT_DATA'
    )),
    priority_score REAL DEFAULT 50.0,
    priority_level TEXT NOT NULL DEFAULT 'MEDIUM' CHECK(priority_level IN (
      'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INSUFFICIENT_DATA'
    )),
    confidence REAL DEFAULT 0.8,
    evidence_json TEXT DEFAULT '[]',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(subject_code, topic_name)
);

CREATE INDEX IF NOT EXISTS idx_qdc_subj ON question_duplicate_clusters(subject_code, semester);
CREATE INDEX IF NOT EXISTS idx_qdc_repeat ON question_duplicate_clusters(repeat_frequency_band);
CREATE INDEX IF NOT EXISTS idx_qdcm_cluster ON question_duplicate_cluster_members(cluster_id);
CREATE INDEX IF NOT EXISTS idx_qdcm_question ON question_duplicate_cluster_members(question_id);
CREATE INDEX IF NOT EXISTS idx_qcm_topic ON question_curriculum_mappings(subject_code, topic_name);
CREATE INDEX IF NOT EXISTS idx_qdp_diff ON question_difficulty_profiles(difficulty_band, difficulty_score);
CREATE INDEX IF NOT EXISTS idx_qbhs_created ON question_bank_health_snapshots(created_at);
CREATE INDEX IF NOT EXISTS idx_sers_student ON student_exam_readiness_snapshots(student_id, subject_code);
CREATE INDEX IF NOT EXISTS idx_strp_student ON student_topic_risk_profiles(student_id, subject_code, risk_level);
CREATE INDEX IF NOT EXISTS idx_spp_student ON student_preparation_plans(student_id, subject_code);
CREATE INDEX IF NOT EXISTS idx_etts_subj ON exam_topic_trend_snapshots(subject_code, priority_score DESC);

-- ============================================================
-- 20. PREP ZONE & CAREER ECOSYSTEM EXPANSION TABLES
-- ============================================================

-- 1. COURSES & LESSONS
CREATE TABLE IF NOT EXISTS learning_courses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    level TEXT NOT NULL DEFAULT 'Beginner' CHECK (level IN ('Beginner', 'Intermediate', 'Advanced', 'All Levels')),
    description TEXT,
    thumbnail_url TEXT,
    instructor_name TEXT NOT NULL DEFAULT 'ShikshaSahayak Faculty',
    duration_hours REAL DEFAULT 10.0,
    enrolled_count INTEGER DEFAULT 0,
    rating REAL DEFAULT 4.9,
    rating_count INTEGER DEFAULT 0,
    is_published INTEGER NOT NULL DEFAULT 1 CHECK (is_published IN (0, 1)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS course_modules (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(course_id) REFERENCES learning_courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS course_lessons (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    module_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content_markdown TEXT,
    video_url TEXT,
    duration_minutes INTEGER DEFAULT 15,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_free_preview INTEGER DEFAULT 1 CHECK (is_free_preview IN (0, 1)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(course_id) REFERENCES learning_courses(id) ON DELETE CASCADE,
    FOREIGN KEY(module_id) REFERENCES course_modules(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS student_course_enrollments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    course_id TEXT NOT NULL,
    enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    progress_percent REAL DEFAULT 0.0,
    last_accessed_lesson_id TEXT,
    UNIQUE(user_id, course_id),
    FOREIGN KEY(course_id) REFERENCES learning_courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS student_lesson_progress (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    course_id TEXT NOT NULL,
    lesson_id TEXT NOT NULL,
    is_completed INTEGER DEFAULT 0 CHECK (is_completed IN (0, 1)),
    completed_at DATETIME,
    UNIQUE(user_id, lesson_id),
    FOREIGN KEY(course_id) REFERENCES learning_courses(id) ON DELETE CASCADE,
    FOREIGN KEY(lesson_id) REFERENCES course_lessons(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS student_course_certificates (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    course_id TEXT NOT NULL,
    certificate_number TEXT NOT NULL UNIQUE,
    student_name TEXT NOT NULL,
    course_title TEXT NOT NULL,
    issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    verification_code TEXT NOT NULL UNIQUE,
    FOREIGN KEY(course_id) REFERENCES learning_courses(id) ON DELETE CASCADE
);

-- 2. SCHOLARSHIPS DIRECTORY
CREATE TABLE IF NOT EXISTS scholarships (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    provider TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Engineering Merit' CHECK (category IN ('Engineering Merit', 'Need-Based', 'State Govt', 'National', 'Corporate / Foundation')),
    amount_inr REAL NOT NULL,
    description TEXT,
    eligibility_criteria_json TEXT,
    eligible_branches_json TEXT,
    min_gpa REAL DEFAULT 0.0,
    max_family_income_lpa REAL,
    required_documents_json TEXT,
    application_deadline TEXT,
    official_application_url TEXT NOT NULL,
    is_verified INTEGER NOT NULL DEFAULT 1 CHECK (is_verified IN (0, 1)),
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_scholarship_bookmarks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    scholarship_id TEXT NOT NULL,
    status TEXT DEFAULT 'SAVED' CHECK (status IN ('SAVED', 'APPLIED', 'AWARDED')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, scholarship_id),
    FOREIGN KEY(scholarship_id) REFERENCES scholarships(id) ON DELETE CASCADE
);

-- 3. ENGINEERING WORKSHOPS & WEBINARS
CREATE TABLE IF NOT EXISTS workshops (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    category TEXT NOT NULL,
    speaker_name TEXT NOT NULL,
    speaker_bio TEXT,
    speaker_company_or_institution TEXT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    venue_or_url TEXT NOT NULL,
    is_online INTEGER NOT NULL DEFAULT 1 CHECK (is_online IN (0, 1)),
    max_participants INTEGER DEFAULT 250,
    current_participants INTEGER DEFAULT 0,
    prerequisites TEXT,
    status TEXT DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING', 'LIVE', 'COMPLETED', 'ARCHIVED')),
    is_published INTEGER NOT NULL DEFAULT 1 CHECK (is_published IN (0, 1)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workshop_registrations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    workshop_id TEXT NOT NULL,
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    attendance_status TEXT DEFAULT 'REGISTERED' CHECK (attendance_status IN ('REGISTERED', 'ATTENDED', 'MISSED')),
    feedback TEXT,
    rating INTEGER CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
    UNIQUE(user_id, workshop_id),
    FOREIGN KEY(workshop_id) REFERENCES workshops(id) ON DELETE CASCADE
);

-- 4. COLLEGE FESTIVALS & TECH EVENTS
CREATE TABLE IF NOT EXISTS college_festivals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    college_name TEXT NOT NULL,
    location TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'Gujarat',
    fest_type TEXT NOT NULL CHECK (fest_type IN ('Technical', 'Cultural', 'Sports', 'Symposium', 'Hackathon')),
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    registration_deadline TEXT,
    description TEXT,
    banner_url TEXT,
    website_url TEXT,
    contact_email TEXT,
    is_verified INTEGER NOT NULL DEFAULT 1 CHECK (is_verified IN (0, 1)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fest_events (
    id TEXT PRIMARY KEY,
    festival_id TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    entry_fee REAL DEFAULT 0.0,
    prize_pool REAL DEFAULT 0.0,
    description TEXT,
    rules_json TEXT,
    registration_url TEXT,
    min_team_size INTEGER DEFAULT 1,
    max_team_size INTEGER DEFAULT 4,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(festival_id) REFERENCES college_festivals(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS student_fest_registrations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    festival_id TEXT NOT NULL,
    event_id TEXT NOT NULL,
    team_name TEXT,
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'WAITLISTED', 'CANCELLED')),
    UNIQUE(user_id, event_id),
    FOREIGN KEY(festival_id) REFERENCES college_festivals(id) ON DELETE CASCADE,
    FOREIGN KEY(event_id) REFERENCES fest_events(id) ON DELETE CASCADE
);

-- 5. VERIFIED CAREER LISTINGS (INTERNSHIPS & JOBS)
CREATE TABLE IF NOT EXISTS career_listings (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    company_logo_url TEXT,
    listing_type TEXT NOT NULL CHECK (listing_type IN ('INTERNSHIP', 'JOB')),
    workplace_type TEXT NOT NULL DEFAULT 'Hybrid' CHECK (workplace_type IN ('On-site', 'Remote', 'Hybrid')),
    location TEXT NOT NULL,
    stipend_or_salary TEXT,
    experience_level TEXT DEFAULT 'Entry Level / Fresher' CHECK (experience_level IN ('Entry Level / Fresher', '0-1 Years', '1-3 Years', 'Internship')),
    required_skills_json TEXT,
    eligible_branches_json TEXT,
    description TEXT NOT NULL,
    official_application_url TEXT NOT NULL,
    application_deadline TEXT,
    is_verified INTEGER NOT NULL DEFAULT 1 CHECK (is_verified IN (0, 1)),
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    posted_by TEXT DEFAULT 'ShikshaSahayak Admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. 5-DAY INTERVIEW PREPARATION PROGRAM
CREATE TABLE IF NOT EXISTS interview_prep_modules (
    id TEXT PRIMARY KEY,
    day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 5),
    title TEXT NOT NULL,
    theme TEXT NOT NULL,
    description TEXT NOT NULL,
    tasks_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_interview_progress (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 5),
    task_id TEXT NOT NULL,
    is_completed INTEGER NOT NULL DEFAULT 0 CHECK (is_completed IN (0, 1)),
    completed_at DATETIME,
    UNIQUE(user_id, day_number, task_id)
);

-- 7. 100 DAYS TO CODE CHALLENGE
CREATE TABLE IF NOT EXISTS coding_100_days_problems (
    id TEXT PRIMARY KEY,
    day_number INTEGER NOT NULL UNIQUE CHECK (day_number BETWEEN 1 AND 100),
    title TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    category TEXT NOT NULL,
    problem_statement TEXT NOT NULL,
    input_format TEXT,
    output_format TEXT,
    starter_code_json TEXT,
    test_cases_json TEXT NOT NULL,
    xp_reward INTEGER DEFAULT 30,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_100_days_progress (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 100),
    status TEXT DEFAULT 'SOLVED' CHECK (status IN ('SOLVED', 'ATTEMPTED', 'SKIPPED')),
    language TEXT NOT NULL,
    submitted_code TEXT,
    passed_tests INTEGER NOT NULL DEFAULT 0,
    total_tests INTEGER NOT NULL DEFAULT 0,
    execution_time_ms INTEGER DEFAULT 0,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, day_number)
);

-- 8. CODING CONQUEST (COMPETITIVE CODING ARENA)
CREATE TABLE IF NOT EXISTS coding_conquests (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced', 'All Divisions')),
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    problems_json TEXT NOT NULL,
    participant_count INTEGER DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coding_conquest_submissions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    conquest_id TEXT NOT NULL,
    problem_id TEXT NOT NULL,
    language TEXT NOT NULL,
    code TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('ACCEPTED', 'WRONG_ANSWER', 'TIME_LIMIT_EXCEEDED', 'COMPILATION_ERROR')),
    execution_time_ms INTEGER DEFAULT 0,
    score INTEGER NOT NULL DEFAULT 0,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(conquest_id) REFERENCES coding_conquests(id) ON DELETE CASCADE
);

-- Indexes for Fast Query Performance
CREATE INDEX IF NOT EXISTS idx_courses_slug ON learning_courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_cat ON learning_courses(category, is_published);
CREATE INDEX IF NOT EXISTS idx_lessons_course ON course_lessons(course_id, module_id, order_index);
CREATE INDEX IF NOT EXISTS idx_enrollment_user ON student_course_enrollments(user_id, course_id);

CREATE INDEX IF NOT EXISTS idx_scholarships_slug ON scholarships(slug);
CREATE INDEX IF NOT EXISTS idx_scholarships_active ON scholarships(is_active, application_deadline);

CREATE INDEX IF NOT EXISTS idx_workshops_time ON workshops(start_time, status);
CREATE INDEX IF NOT EXISTS idx_festivals_date ON college_festivals(start_date, is_verified);

CREATE INDEX IF NOT EXISTS idx_career_type ON career_listings(listing_type, is_active, application_deadline);
CREATE INDEX IF NOT EXISTS idx_100days_day ON coding_100_days_problems(day_number);
CREATE INDEX IF NOT EXISTS idx_conquest_time ON coding_conquests(start_time, end_time, is_active);

-- 9. 100 DAYS OF CODE EXPANSION (MULTI-TRACK, ATTEMPTS, PROJECTS, ACHIEVEMENTS)
CREATE TABLE IF NOT EXISTS student_100_days_tracks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    track_id TEXT NOT NULL DEFAULT 'dsa',
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_active_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, track_id)
);
CREATE INDEX IF NOT EXISTS idx_100_days_tracks_user ON student_100_days_tracks(user_id, is_active);

CREATE TABLE IF NOT EXISTS student_100_days_attempts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    track_id TEXT NOT NULL DEFAULT 'dsa',
    day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 100),
    action_type TEXT NOT NULL CHECK (action_type IN ('RUN', 'SUBMIT')),
    language TEXT NOT NULL,
    submitted_code TEXT NOT NULL,
    status TEXT NOT NULL,
    passed_tests INTEGER NOT NULL DEFAULT 0,
    total_tests INTEGER NOT NULL DEFAULT 0,
    execution_time_ms INTEGER DEFAULT 0,
    feedback TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_100_days_attempts_user ON student_100_days_attempts(user_id, day_number);

CREATE TABLE IF NOT EXISTS student_100_days_projects (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    track_id TEXT NOT NULL DEFAULT 'dsa',
    phase_number INTEGER CHECK (phase_number BETWEEN 1 AND 5),
    day_number INTEGER CHECK (day_number BETWEEN 1 AND 100),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    tech_stack TEXT NOT NULL,
    repo_url TEXT,
    demo_url TEXT,
    status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'PUBLISHED')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_100_days_projects_user ON student_100_days_projects(user_id);

CREATE TABLE IF NOT EXISTS student_100_days_achievements (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    badge_key TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, badge_key)
);
CREATE INDEX IF NOT EXISTS idx_100_days_achievements_user ON student_100_days_achievements(user_id);


