-- Migration to allow semester 0

PRAGMA foreign_keys = OFF;

CREATE TABLE new_subjects (
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

INSERT INTO new_subjects SELECT * FROM subjects;
DROP TABLE subjects;
ALTER TABLE new_subjects RENAME TO subjects;

CREATE TABLE new_documents (
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

INSERT INTO new_documents SELECT * FROM documents;
DROP TABLE documents;
ALTER TABLE new_documents RENAME TO documents;

CREATE INDEX IF NOT EXISTS idx_subjects_lookup ON subjects(branch_id, semester, slug);
CREATE INDEX IF NOT EXISTS idx_documents_lookup ON documents(document_type, branch_id, semester, subject_id, approval_status);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(approval_status, created_at DESC);

PRAGMA foreign_keys = ON;
