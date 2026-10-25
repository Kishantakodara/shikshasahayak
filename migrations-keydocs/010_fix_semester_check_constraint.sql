-- Fix the semester CHECK constraint that was accidentally changed to BETWEEN 1 AND 12
-- It must be BETWEEN 0 AND 12 to support Semester 0 ("1 OR 2 common").

PRAGMA foreign_keys = OFF;

-- Fix subjects table if it was affected
CREATE TABLE IF NOT EXISTS subjects_new (
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

INSERT INTO subjects_new SELECT * FROM subjects;
DROP TABLE subjects;
ALTER TABLE subjects_new RENAME TO subjects;
CREATE INDEX IF NOT EXISTS idx_subjects_lookup ON subjects(branch_id, semester, slug);

-- Fix documents table
CREATE TABLE IF NOT EXISTS documents_new (
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
    blog_id TEXT,
    parent_document_id TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(university_id) REFERENCES universities(id) ON DELETE CASCADE,
    FOREIGN KEY(branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    FOREIGN KEY(subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY(blog_id) REFERENCES blogs(id) ON DELETE SET NULL,
    FOREIGN KEY(parent_document_id) REFERENCES documents(id) ON DELETE CASCADE
);

INSERT INTO documents_new (
    id, document_type, university_id, branch_id, semester, subject_id, title,
    description, approval_status, uploaded_by, approved_by, approved_at,
    blog_id, parent_document_id, created_at, updated_at
)
SELECT 
    id, document_type, university_id, branch_id, semester, subject_id, title,
    description, approval_status, uploaded_by, approved_by, approved_at,
    blog_id, parent_document_id, created_at, updated_at
FROM documents;
DROP TABLE documents;
ALTER TABLE documents_new RENAME TO documents;

CREATE INDEX IF NOT EXISTS idx_documents_lookup ON documents(document_type, branch_id, semester, subject_id, approval_status);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(approval_status, created_at DESC);

PRAGMA foreign_keys = ON;
