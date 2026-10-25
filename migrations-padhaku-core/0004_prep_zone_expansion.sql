-- ============================================================
-- MIGRATION 0004: PREP ZONE & CAREER ECOSYSTEM EXPANSION
-- Non-destructive addition of Courses, Scholarships, Workshops,
-- Festivals, 100 Days Code, Coding Conquest & Career modules.
-- ============================================================

-- 1. COURSES & LESSONS
CREATE TABLE IF NOT EXISTS learning_courses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL, -- 'Programming', 'Web Development', 'AI/ML', 'Core Engineering', 'Aptitude'
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
    provider TEXT NOT NULL, -- e.g. 'Government of Gujarat', 'AICTE', 'Reliance Foundation'
    category TEXT NOT NULL DEFAULT 'Engineering Merit' CHECK (category IN ('Engineering Merit', 'Need-Based', 'State Govt', 'National', 'Corporate / Foundation')),
    amount_inr REAL NOT NULL,
    description TEXT,
    eligibility_criteria_json TEXT, -- array of eligibility requirements
    eligible_branches_json TEXT, -- array of branch slugs or ['all']
    min_gpa REAL DEFAULT 0.0,
    max_family_income_lpa REAL,
    required_documents_json TEXT, -- array of document checklist strings
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
    category TEXT NOT NULL, -- 'AI & Cloud', 'Robotics & IoT', 'Web3 & Security', 'Career Strategy', 'Core Engineering'
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
    category TEXT NOT NULL, -- 'Robotics', 'Coding', 'Gaming', 'Debate', 'Design', 'Cultural'
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
    required_skills_json TEXT, -- array of skill names
    eligible_branches_json TEXT, -- array of branch names
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
    theme TEXT NOT NULL, -- e.g. 'Resume & Core CS', 'Advanced DSA', 'System Design', 'Aptitude', 'Behavioral & Mock'
    description TEXT NOT NULL,
    tasks_json TEXT NOT NULL, -- array of { id, title, type: 'reading'|'practice'|'coding'|'checklist', estimatedMinutes, actionUrl }
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
    category TEXT NOT NULL, -- 'Basics', 'Arrays', 'Strings', 'Linked Lists', 'Trees', 'Graphs', 'DP'
    problem_statement TEXT NOT NULL,
    input_format TEXT,
    output_format TEXT,
    starter_code_json TEXT, -- { cpp, java, python, javascript }
    test_cases_json TEXT NOT NULL, -- array of { input, expectedOutput, isHidden }
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
    category TEXT NOT NULL, -- 'DSA Sprint', 'Algorithms Championship', 'Database SQL Blitz', 'Dynamic Programming Derby'
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced', 'All Divisions')),
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    problems_json TEXT NOT NULL, -- array of problem definitions
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

-- 9. STUDENT RESOURCE BOOKMARKS & STUDY VAULT
CREATE TABLE IF NOT EXISTS student_bookmarks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    resource_type TEXT NOT NULL DEFAULT 'study_material',
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    subject_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, resource_id)
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
CREATE INDEX IF NOT EXISTS idx_student_bookmarks_user ON student_bookmarks(user_id, created_at);
