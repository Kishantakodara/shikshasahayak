-- Destructive reset for keydocs.
-- Drops the old ShikshaSahayak tables and recreates the document-centered schema.

PRAGMA foreign_keys = OFF;

DROP VIEW IF EXISTS material_upload_index;

DROP TABLE IF EXISTS document_stats;
DROP TABLE IF EXISTS study_material_details;
DROP TABLE IF EXISTS syllabus_details;
DROP TABLE IF EXISTS pyq_details;
DROP TABLE IF EXISTS document_files;
DROP TABLE IF EXISTS blogs;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS announcements;
DROP TABLE IF EXISTS academic_pyqs;
DROP TABLE IF EXISTS academic_study_materials;
DROP TABLE IF EXISTS academic_notes;
DROP TABLE IF EXISTS material_targets;
DROP TABLE IF EXISTS materials;
DROP TABLE IF EXISTS subject_offering_branches;
DROP TABLE IF EXISTS subject_offerings;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS curriculum_versions;
DROP TABLE IF EXISTS branches;
DROP TABLE IF EXISTS programs;
DROP TABLE IF EXISTS universities;

PRAGMA foreign_keys = ON;

CREATE TABLE universities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    short_name TEXT,
    slug TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE branches (
    id TEXT PRIMARY KEY,
    university_id TEXT NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    short_name TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(university_id) REFERENCES universities(id) ON DELETE CASCADE
);

CREATE TABLE subjects (
    id TEXT PRIMARY KEY,
    university_id TEXT NOT NULL,
    branch_id TEXT NOT NULL,
    semester INTEGER NOT NULL CHECK (semester BETWEEN 0 AND 12),
    name TEXT NOT NULL,
    code TEXT,
    slug TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(branch_id, semester, slug),
    UNIQUE(branch_id, semester, code),
    FOREIGN KEY(university_id) REFERENCES universities(id) ON DELETE CASCADE,
    FOREIGN KEY(branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

CREATE TABLE documents (
    id TEXT PRIMARY KEY,
    document_type TEXT NOT NULL CHECK (document_type IN ('pyq', 'syllabus', 'study-material')),
    university_id TEXT NOT NULL,
    branch_id TEXT NOT NULL,
    semester INTEGER NOT NULL CHECK (semester BETWEEN 0 AND 12),
    subject_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    approval_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    uploaded_by TEXT,
    approved_by TEXT,
    approved_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(university_id) REFERENCES universities(id) ON DELETE CASCADE,
    FOREIGN KEY(branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    FOREIGN KEY(subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

CREATE TABLE document_files (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('paper', 'solution', 'syllabus', 'material', 'thumbnail', 'other')),
    storage_key TEXT,
    file_url TEXT NOT NULL,
    mime_type TEXT,
    size_bytes INTEGER CHECK (size_bytes IS NULL OR size_bytes >= 0),
    is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE TABLE pyq_details (
    document_id TEXT PRIMARY KEY,
    paper_year INTEGER NOT NULL CHECK (paper_year BETWEEN 2000 AND 2100),
    season TEXT NOT NULL CHECK (season IN ('S', 'W')),
    exam_label TEXT,
    FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE TABLE syllabus_details (
    document_id TEXT PRIMARY KEY,
    syllabus_year INTEGER CHECK (syllabus_year IS NULL OR syllabus_year BETWEEN 2000 AND 2100),
    regulation TEXT,
    version_label TEXT,
    FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE TABLE study_material_details (
    document_id TEXT PRIMARY KEY,
    material_kind TEXT NOT NULL DEFAULT 'notes'
        CHECK (material_kind IN ('notes', 'book', 'assignment', 'practical', 'question_bank', 'video', 'other')),
    unit_no INTEGER CHECK (unit_no IS NULL OR unit_no >= 0),
    chapter TEXT,
    topic TEXT,
    author TEXT,
    FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE TABLE document_stats (
    document_id TEXT PRIMARY KEY,
    views INTEGER NOT NULL DEFAULT 0 CHECK (views >= 0),
    likes INTEGER NOT NULL DEFAULT 0 CHECK (likes >= 0),
    downloads INTEGER NOT NULL DEFAULT 0 CHECK (downloads >= 0),
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE TABLE blogs (
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

CREATE TABLE announcements (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    link TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_branches_university ON branches(university_id);
CREATE INDEX idx_subjects_lookup ON subjects(branch_id, semester, slug);
CREATE INDEX idx_documents_lookup ON documents(document_type, branch_id, semester, subject_id, approval_status);
CREATE INDEX idx_documents_status ON documents(approval_status, created_at DESC);
CREATE INDEX idx_document_files_document ON document_files(document_id, file_type, is_primary);
CREATE INDEX idx_pyq_details_lookup ON pyq_details(paper_year DESC, season);
CREATE INDEX idx_blogs_status_created ON blogs(status, created_at DESC);
CREATE INDEX idx_blogs_related_document ON blogs(related_document_id);

INSERT INTO universities (id, name, short_name, slug) VALUES
('univ_default', 'Default University', 'DU', 'default-university');

INSERT INTO branches (id, university_id, name, slug, short_name) VALUES
('branch_first_year', 'univ_default', '1st Year Common', 'first-year', 'FYC'),
('branch_computer', 'univ_default', 'Computer Engineering', 'computer', 'CSE'),
('branch_it', 'univ_default', 'Information Technology', 'it', 'IT'),
('branch_electrical', 'univ_default', 'Electrical Engineering', 'electrical', 'EE'),
('branch_ece', 'univ_default', 'Electronics and Communication', 'ece', 'ECE'),
('branch_mechanical', 'univ_default', 'Mechanical Engineering', 'mechanical', 'ME'),
('branch_civil', 'univ_default', 'Civil Engineering', 'civil', 'CE');
