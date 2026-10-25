-- ============================================================
-- Local Setup: Question Bank & Test Sessions for DB (keydocs)
-- ============================================================

CREATE TABLE IF NOT EXISTS canonical_subjects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT,
    branch_id TEXT,
    semester INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS curriculum_nodes (
    id TEXT PRIMARY KEY,
    canonical_subject_id TEXT,
    unit_no INTEGER,
    topic_name TEXT NOT NULL,
    subtopic_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

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
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mqb_subject ON master_question_bank(subject_code, verification_status);
CREATE INDEX IF NOT EXISTS idx_mqb_topic ON master_question_bank(subject_code, topic_name);
CREATE INDEX IF NOT EXISTS idx_mqb_exam ON master_question_bank(exam_name, exam_year);

CREATE TABLE IF NOT EXISTS question_branch_mappings (
    id TEXT PRIMARY KEY,
    question_id TEXT NOT NULL,
    branch_id TEXT NOT NULL,
    is_primary INTEGER DEFAULT 1 CHECK (is_primary IN (0, 1)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES master_question_bank(id) ON DELETE CASCADE,
    UNIQUE(question_id, branch_id)
);

CREATE TABLE IF NOT EXISTS test_sessions (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    test_type TEXT NOT NULL,
    source_mode TEXT DEFAULT 'ALL',
    practice_mode TEXT DEFAULT 'EXAM_MODE',
    branch_id TEXT,
    semester INTEGER,
    subject_code TEXT,
    topic_name TEXT,
    question_count INTEGER NOT NULL,
    duration_minutes INTEGER NOT NULL,
    negative_marking INTEGER DEFAULT 0,
    negative_mark_value REAL DEFAULT 0.25,
    seed TEXT,
    config_json TEXT,
    status TEXT DEFAULT 'CREATED',
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

CREATE INDEX IF NOT EXISTS idx_ts_student ON test_sessions(student_id, created_at DESC);

CREATE TABLE IF NOT EXISTS test_session_questions (
    id TEXT PRIMARY KEY,
    test_session_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    sequence_number INTEGER NOT NULL,
    marks REAL DEFAULT 1.0,
    negative_marks REAL DEFAULT 0.25,
    selected_answer TEXT,
    is_correct INTEGER DEFAULT 0,
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
    action TEXT NOT NULL,
    old_value_json TEXT,
    new_value_json TEXT,
    previous_state_json TEXT,
    new_state_json TEXT,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(question_id) REFERENCES master_question_bank(id) ON DELETE CASCADE
);
