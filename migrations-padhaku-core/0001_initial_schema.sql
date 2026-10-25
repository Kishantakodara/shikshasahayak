-- ============================================================================
-- Migration 0001: Initial Schema for shiksha-core-db
-- Source Blueprint: shiksha-core-db-schema.md
-- ============================================================================

-- 1. Identity & Access
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    firebase_uid TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT,
    user_type TEXT NOT NULL CHECK (user_type IN ('student', 'teacher', 'admin', 'staff')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'disabled')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_type_status ON users(user_type, status);

CREATE TABLE IF NOT EXISTS user_roles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    granted_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    granted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at TEXT,
    UNIQUE(user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);

CREATE TABLE IF NOT EXISTS user_access (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    access_type TEXT NOT NULL,
    status TEXT NOT NULL,
    granted_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    granted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TEXT,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_user_access_user ON user_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_access_type ON user_access(access_type, status);

-- 2. Academic Master Data
CREATE TABLE IF NOT EXISTS universities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    short_name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    university_id TEXT NOT NULL REFERENCES universities(id) ON DELETE RESTRICT,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    level TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(university_id, code)
);

CREATE INDEX IF NOT EXISTS idx_courses_university ON courses(university_id);

CREATE TABLE IF NOT EXISTS colleges (
    id TEXT PRIMARY KEY,
    university_id TEXT NOT NULL REFERENCES universities(id) ON DELETE RESTRICT,
    college_code TEXT,
    name TEXT NOT NULL,
    short_name TEXT,
    city TEXT,
    district TEXT,
    state TEXT,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(university_id, college_code)
);

CREATE INDEX IF NOT EXISTS idx_colleges_university ON colleges(university_id);
CREATE INDEX IF NOT EXISTS idx_colleges_university_name ON colleges(university_id, name);

CREATE TABLE IF NOT EXISTS branches (
    id TEXT PRIMARY KEY,
    university_id TEXT NOT NULL REFERENCES universities(id) ON DELETE RESTRICT,
    course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    short_name TEXT,
    display_order INTEGER,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(university_id, course_id, code)
);

CREATE INDEX IF NOT EXISTS idx_branches_university_course ON branches(university_id, course_id);

CREATE TABLE IF NOT EXISTS subject_groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,
    university_id TEXT REFERENCES universities(id) ON DELETE RESTRICT,
    branch_id TEXT REFERENCES branches(id) ON DELETE RESTRICT,
    semester INTEGER NOT NULL CHECK (semester BETWEEN 0 AND 12),
    name TEXT NOT NULL,
    code TEXT,
    subject_group_id TEXT REFERENCES subject_groups(id) ON DELETE SET NULL,
    wef_year INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(branch_id, semester, code)
);

CREATE INDEX IF NOT EXISTS idx_subjects_branch_semester ON subjects(branch_id, semester);
CREATE INDEX IF NOT EXISTS idx_subjects_university_branch_sem ON subjects(university_id, branch_id, semester);

-- 3. Profiles
CREATE TABLE IF NOT EXISTS student_profiles (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone_number TEXT,
    dob TEXT,
    university_id TEXT REFERENCES universities(id) ON DELETE SET NULL,
    course_id TEXT REFERENCES courses(id) ON DELETE SET NULL,
    college_id TEXT REFERENCES colleges(id) ON DELETE SET NULL,
    branch_id TEXT REFERENCES branches(id) ON DELETE SET NULL,
    semester INTEGER,
    enrollment_number TEXT,
    enrollment_year INTEGER,
    graduation_year INTEGER,
    goals TEXT,
    avatar_url TEXT,
    marks_10th TEXT,
    marks_12th TEXT,
    special_skills TEXT,
    languages_known TEXT,
    experience TEXT,
    certifications TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_student_profiles_academic ON student_profiles(university_id, branch_id, semester);
CREATE INDEX IF NOT EXISTS idx_student_profiles_college ON student_profiles(college_id);

CREATE TABLE IF NOT EXISTS teacher_profiles (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    institution TEXT,
    department TEXT,
    designation TEXT,
    subjects_json TEXT,
    branches_json TEXT,
    semesters_json TEXT,
    is_onboarded INTEGER NOT NULL DEFAULT 0 CHECK (is_onboarded IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teacher_departments (
    id TEXT PRIMARY KEY,
    teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department_id TEXT,
    hierarchy TEXT,
    assigned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1))
);

CREATE INDEX IF NOT EXISTS idx_teacher_departments_teacher ON teacher_departments(teacher_id);

-- 4. Blogs & Documents
CREATE TABLE IF NOT EXISTS blogs (
    id TEXT PRIMARY KEY,
    related_document_id TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT,
    category TEXT,
    tags TEXT,
    thumbnail TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    views INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_blogs_status ON blogs(status);

CREATE TABLE IF NOT EXISTS file_assets (
    id TEXT PRIMARY KEY,
    content_hash TEXT UNIQUE,
    original_filename TEXT,
    storage_key TEXT NOT NULL UNIQUE,
    mime_type TEXT,
    size_bytes INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_file_assets_hash ON file_assets(content_hash);

CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    document_type TEXT NOT NULL,
    university_id TEXT REFERENCES universities(id) ON DELETE SET NULL,
    branch_id TEXT REFERENCES branches(id) ON DELETE SET NULL,
    semester INTEGER,
    subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    uploaded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    approved_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    approved_at TEXT,
    blog_id TEXT REFERENCES blogs(id) ON DELETE SET NULL,
    parent_document_id TEXT REFERENCES documents(id) ON DELETE SET NULL,
    paper_year INTEGER,
    season TEXT,
    exam_label TEXT,
    syllabus_year INTEGER,
    regulation TEXT,
    version_label TEXT,
    material_kind TEXT,
    unit_no INTEGER,
    chapter TEXT,
    topic TEXT,
    author TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_documents_branch_semester ON documents(branch_id, semester);
CREATE INDEX IF NOT EXISTS idx_documents_subject ON documents(subject_id);
CREATE INDEX IF NOT EXISTS idx_documents_type_status ON documents(document_type, approval_status);
CREATE INDEX IF NOT EXISTS idx_documents_parent ON documents(parent_document_id);

CREATE TABLE IF NOT EXISTS document_files (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    file_asset_id TEXT REFERENCES file_assets(id) ON DELETE SET NULL,
    file_type TEXT,
    original_filename TEXT,
    storage_key TEXT,
    file_url TEXT,
    mime_type TEXT,
    size_bytes INTEGER,
    is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_document_files_document ON document_files(document_id);
CREATE INDEX IF NOT EXISTS idx_document_files_asset ON document_files(file_asset_id);

CREATE TABLE IF NOT EXISTS pyq_details (
    document_id TEXT PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
    paper_year INTEGER,
    season TEXT,
    exam_label TEXT
);

CREATE TABLE IF NOT EXISTS syllabus_details (
    document_id TEXT PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
    syllabus_year INTEGER,
    regulation TEXT,
    version_label TEXT
);

CREATE TABLE IF NOT EXISTS study_material_details (
    document_id TEXT PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
    material_kind TEXT,
    unit_no INTEGER,
    chapter TEXT,
    topic TEXT,
    author TEXT
);

CREATE TABLE IF NOT EXISTS document_stats (
    document_id TEXT PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
    views INTEGER NOT NULL DEFAULT 0,
    likes INTEGER NOT NULL DEFAULT 0,
    downloads INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Classroom / LMS
CREATE TABLE IF NOT EXISTS classes (
    id TEXT PRIMARY KEY,
    teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    section TEXT,
    semester INTEGER,
    academic_year TEXT,
    join_code TEXT UNIQUE,
    grading_system TEXT,
    max_students INTEGER,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    cover_image TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_subject ON classes(subject_id);

CREATE TABLE IF NOT EXISTS class_enrollments (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    enrollment_number TEXT,
    enrollment_status TEXT NOT NULL DEFAULT 'active',
    enrolled_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    withdrawn_at TEXT,
    final_grade TEXT,
    is_placeholder INTEGER NOT NULL DEFAULT 0 CHECK (is_placeholder IN (0, 1)),
    invitation_sent_at TEXT,
    invitation_accepted_at TEXT,
    UNIQUE(class_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_class_enrollments_student ON class_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_class ON class_enrollments(class_id);

CREATE TABLE IF NOT EXISTS class_materials (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    title TEXT,
    description TEXT,
    is_visible INTEGER NOT NULL DEFAULT 1 CHECK (is_visible IN (0, 1)),
    uploaded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_class_materials_class ON class_materials(class_id);
CREATE INDEX IF NOT EXISTS idx_class_materials_document ON class_materials(document_id);

CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY,
    created_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    class_id TEXT REFERENCES classes(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT,
    target_audience TEXT,
    channels TEXT,
    attachments TEXT,
    is_published INTEGER NOT NULL DEFAULT 0 CHECK (is_published IN (0, 1)),
    published_at TEXT,
    expires_at TEXT,
    pin_to_top INTEGER NOT NULL DEFAULT 0 CHECK (pin_to_top IN (0, 1)),
    allow_comments INTEGER NOT NULL DEFAULT 0 CHECK (allow_comments IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_announcements_class ON announcements(class_id);
CREATE INDEX IF NOT EXISTS idx_announcements_created_by ON announcements(created_by);

CREATE TABLE IF NOT EXISTS announcement_reads (
    id TEXT PRIMARY KEY,
    announcement_id TEXT NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    read_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(announcement_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_announcement_reads_user ON announcement_reads(user_id);

-- 6. Quizzes
CREATE TABLE IF NOT EXISTS quizzes (
    id TEXT PRIMARY KEY,
    subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    code TEXT,
    category TEXT,
    duration INTEGER,
    questions_count INTEGER NOT NULL DEFAULT 0,
    difficulty TEXT,
    xp_reward INTEGER NOT NULL DEFAULT 0,
    published INTEGER NOT NULL DEFAULT 0 CHECK (published IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quizzes_subject ON quizzes(subject_id);

CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options TEXT,
    correct_answer INTEGER,
    explanation TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_questions_quiz ON questions(quiz_id);

CREATE TABLE IF NOT EXISTS quiz_attempts (
    id TEXT PRIMARY KEY,
    quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER,
    xp_earned INTEGER NOT NULL DEFAULT 0,
    coins_earned INTEGER NOT NULL DEFAULT 0,
    attempted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);

CREATE TABLE IF NOT EXISTS quiz_class_assignments (
    id TEXT PRIMARY KEY,
    quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    assigned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_visible INTEGER NOT NULL DEFAULT 1 CHECK (is_visible IN (0, 1)),
    UNIQUE(quiz_id, class_id)
);

CREATE INDEX IF NOT EXISTS idx_quiz_class_assignments_class ON quiz_class_assignments(class_id);

-- 7. Assignments & Grading
CREATE TABLE IF NOT EXISTS assignments (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    total_marks REAL,
    due_date TEXT,
    published_at TEXT,
    allow_late_submission INTEGER NOT NULL DEFAULT 0 CHECK (allow_late_submission IN (0, 1)),
    late_penalty_percent REAL,
    max_file_size_mb REAL,
    allowed_file_types TEXT,
    rubric TEXT,
    attachments TEXT,
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assignments_class ON assignments(class_id);

CREATE TABLE IF NOT EXISTS assignment_questions (
    id TEXT PRIMARY KEY,
    assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    question_type TEXT,
    max_marks REAL,
    options TEXT,
    correct_answer TEXT,
    required INTEGER NOT NULL DEFAULT 1 CHECK (required IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assignment_id, question_number)
);

CREATE INDEX IF NOT EXISTS idx_assignment_questions_assignment ON assignment_questions(assignment_id);

CREATE TABLE IF NOT EXISTS assignment_submissions (
    id TEXT PRIMARY KEY,
    assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT,
    text_content TEXT,
    attachments TEXT,
    external_links TEXT,
    submitted_at TEXT,
    graded_at TEXT,
    graded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    marks REAL,
    feedback TEXT,
    annotations TEXT,
    is_late INTEGER NOT NULL DEFAULT 0 CHECK (is_late IN (0, 1)),
    resubmit_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_submissions_student ON assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON assignment_submissions(assignment_id);

CREATE TABLE IF NOT EXISTS submission_answers (
    id TEXT PRIMARY KEY,
    submission_id TEXT NOT NULL REFERENCES assignment_submissions(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL REFERENCES assignment_questions(id) ON DELETE CASCADE,
    answer_text TEXT,
    answer_file TEXT,
    marks_awarded REAL,
    feedback TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(submission_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_submission_answers_sub ON submission_answers(submission_id);

CREATE TABLE IF NOT EXISTS assignment_templates (
    id TEXT PRIMARY KEY,
    created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    total_marks INTEGER,
    default_due_days INTEGER,
    allow_late_submission INTEGER NOT NULL DEFAULT 0 CHECK (allow_late_submission IN (0, 1)),
    late_penalty_percent INTEGER,
    max_file_size_mb INTEGER,
    allowed_file_types TEXT,
    rubric TEXT,
    questions TEXT,
    attachments TEXT,
    tags TEXT,
    is_public INTEGER NOT NULL DEFAULT 0 CHECK (is_public IN (0, 1)),
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rubric_scores (
    id TEXT PRIMARY KEY,
    submission_id TEXT NOT NULL REFERENCES assignment_submissions(id) ON DELETE CASCADE,
    criterion_id TEXT,
    points REAL,
    max_points REAL,
    feedback TEXT,
    graded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    graded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rubric_scores_submission ON rubric_scores(submission_id);

CREATE TABLE IF NOT EXISTS question_grades (
    id TEXT PRIMARY KEY,
    submission_id TEXT NOT NULL REFERENCES assignment_submissions(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL REFERENCES assignment_questions(id) ON DELETE CASCADE,
    marks REAL,
    max_marks REAL,
    feedback TEXT,
    graded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    graded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_question_grades_sub ON question_grades(submission_id);

CREATE TABLE IF NOT EXISTS grade_audit_log (
    id TEXT PRIMARY KEY,
    submission_id TEXT NOT NULL REFERENCES assignment_submissions(id) ON DELETE CASCADE,
    old_marks REAL,
    new_marks REAL,
    old_status TEXT,
    new_status TEXT,
    reason TEXT,
    changed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    changed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_grade_audit_submission ON grade_audit_log(submission_id);

CREATE TABLE IF NOT EXISTS peer_review_assignments (
    id TEXT PRIMARY KEY,
    assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    reviewer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewee_submission_id TEXT NOT NULL REFERENCES assignment_submissions(id) ON DELETE CASCADE,
    status TEXT,
    review_rubric TEXT,
    review_feedback TEXT,
    review_scores TEXT,
    total_score REAL,
    max_score REAL,
    submitted_at TEXT,
    due_date TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_peer_review_reviewer ON peer_review_assignments(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_peer_review_submission ON peer_review_assignments(reviewee_submission_id);

CREATE TABLE IF NOT EXISTS grade_distributions (
    id TEXT PRIMARY KEY,
    assignment_id TEXT REFERENCES assignments(id) ON DELETE CASCADE,
    class_id TEXT REFERENCES classes(id) ON DELETE CASCADE,
    period_type TEXT,
    distribution_data TEXT,
    calculated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_grade_dist_assignment ON grade_distributions(assignment_id);

-- 8. Attendance
CREATE TABLE IF NOT EXISTS attendance_sessions (
    id TEXT PRIMARY KEY,
    teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
    session_date TEXT,
    class_name TEXT,
    session_code TEXT,
    challenge_word TEXT,
    qr_code_token TEXT UNIQUE,
    duration_minutes INTEGER,
    geofence_enabled INTEGER NOT NULL DEFAULT 0 CHECK (geofence_enabled IN (0, 1)),
    geofence_latitude REAL,
    geofence_longitude REAL,
    geofence_radius_meters REAL,
    starts_at TEXT,
    expires_at TEXT,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attendance_sessions_class ON attendance_sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_teacher ON attendance_sessions(teacher_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_sessions_qr ON attendance_sessions(qr_code_token);

CREATE TABLE IF NOT EXISTS attendance_records (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    notes TEXT,
    recorded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_records_student ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_session ON attendance_records(session_id);

CREATE TABLE IF NOT EXISTS attendance_submissions (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_name TEXT,
    enrollment_number TEXT,
    latitude REAL,
    longitude REAL,
    distance_meters REAL,
    status TEXT,
    submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attendance_submissions_session ON attendance_submissions(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_submissions_student ON attendance_submissions(student_id);

-- 9. Engagement & Gamification
CREATE TABLE IF NOT EXISTS student_stats (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    xp INTEGER NOT NULL DEFAULT 0,
    coins INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_active TEXT,
    claimed_daily_reward INTEGER NOT NULL DEFAULT 0 CHECK (claimed_daily_reward IN (0, 1))
);

CREATE TABLE IF NOT EXISTS student_projects (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    author TEXT,
    dept TEXT,
    github TEXT,
    desc TEXT,
    status TEXT,
    upvotes INTEGER NOT NULL DEFAULT 0,
    tech TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_student_projects_user ON student_projects(user_id);

CREATE TABLE IF NOT EXISTS material_stats (
    id TEXT PRIMARY KEY,
    material_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    viewed_at TEXT,
    download_count INTEGER NOT NULL DEFAULT 0,
    last_accessed TEXT
);

CREATE INDEX IF NOT EXISTS idx_material_stats_student ON material_stats(student_id);
CREATE INDEX IF NOT EXISTS idx_material_stats_material ON material_stats(material_id);

-- 10. Messaging & Real-Time
CREATE TABLE IF NOT EXISTS message_threads (
    id TEXT PRIMARY KEY,
    title TEXT,
    thread_type TEXT,
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    class_id TEXT REFERENCES classes(id) ON DELETE CASCADE,
    assignment_id TEXT REFERENCES assignments(id) ON DELETE CASCADE,
    is_archived INTEGER NOT NULL DEFAULT 0 CHECK (is_archived IN (0, 1)),
    last_message_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_message_threads_class ON message_threads(class_id);

CREATE TABLE IF NOT EXISTS thread_participants (
    id TEXT PRIMARY KEY,
    thread_id TEXT NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT,
    joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_read_at TEXT,
    is_muted INTEGER NOT NULL DEFAULT 0 CHECK (is_muted IN (0, 1)),
    notification_preferences TEXT,
    UNIQUE(thread_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_thread_participants_user ON thread_participants(user_id);

CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    thread_id TEXT NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
    sender_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    message_type TEXT,
    content TEXT,
    attachments TEXT,
    reply_to_message_id TEXT REFERENCES messages(id) ON DELETE SET NULL,
    is_edited INTEGER NOT NULL DEFAULT 0 CHECK (is_edited IN (0, 1)),
    edited_at TEXT,
    sent_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

CREATE TABLE IF NOT EXISTS message_read_receipts (
    id TEXT PRIMARY KEY,
    message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    read_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, user_id)
);

CREATE TABLE IF NOT EXISTS typing_indicators (
    id TEXT PRIMARY KEY,
    thread_id TEXT NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_typing INTEGER NOT NULL DEFAULT 0 CHECK (is_typing IN (0, 1)),
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(thread_id, user_id)
);

-- 11. System, Notifications & Admin
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT,
    channel TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    metadata TEXT,
    is_read INTEGER NOT NULL DEFAULT 0 CHECK (is_read IN (0, 1)),
    read_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read, created_at);

CREATE TABLE IF NOT EXISTS parent_communications (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_email TEXT,
    parent_name TEXT,
    parent_phone TEXT,
    communication_type TEXT,
    subject TEXT,
    message TEXT,
    attachments TEXT,
    sent_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    sent_at TEXT,
    delivery_status TEXT,
    delivery_attempts INTEGER NOT NULL DEFAULT 0,
    last_attempt_at TEXT,
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_parent_comms_student ON parent_communications(student_id);

CREATE TABLE IF NOT EXISTS website_popups (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT,
    html_content TEXT,
    is_active INTEGER NOT NULL DEFAULT 0 CHECK (is_active IN (0, 1)),
    start_date TEXT,
    end_date TEXT,
    frequency TEXT,
    expiry_days INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bug_reports (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    user_email TEXT,
    description TEXT NOT NULL,
    screenshot_url TEXT,
    screenshot_storage_key TEXT,
    error_stack TEXT,
    browser_info TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON bug_reports(status);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id TEXT PRIMARY KEY,
    admin_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    details TEXT,
    details_json TEXT,
    ip_address TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON admin_audit_logs(action);

CREATE TABLE IF NOT EXISTS feature_flags (
    flag_key TEXT PRIMARY KEY,
    is_enabled INTEGER NOT NULL DEFAULT 0 CHECK (is_enabled IN (0, 1)),
    description TEXT,
    updated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS d1_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
