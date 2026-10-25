-- ============================================================
-- MIGRATION: 0006_hundred_days_of_code_expansion.sql
-- Section: 100 Days of Code Learning Tracks, Enrollments, Portfolio & Badges
-- ============================================================

-- 1. Student Track Enrollments (Multi-Track Progress Support)
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

-- 2. Student Submission Attempts History (Run & Submit Log)
CREATE TABLE IF NOT EXISTS student_100_days_attempts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    track_id TEXT NOT NULL DEFAULT 'dsa',
    day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 100),
    action_type TEXT NOT NULL CHECK (action_type IN ('RUN', 'SUBMIT')),
    language TEXT NOT NULL,
    submitted_code TEXT NOT NULL,
    status TEXT NOT NULL, -- 'ACCEPTED', 'WRONG_ANSWER', 'COMPILATION_ERROR', 'TIME_LIMIT_EXCEEDED', 'FORMAT_VALIDATED'
    passed_tests INTEGER NOT NULL DEFAULT 0,
    total_tests INTEGER NOT NULL DEFAULT 0,
    execution_time_ms INTEGER DEFAULT 0,
    feedback TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_100_days_attempts_user ON student_100_days_attempts(user_id, day_number);

-- 3. Student 100 Days Project Portfolio
CREATE TABLE IF NOT EXISTS student_100_days_projects (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    track_id TEXT NOT NULL DEFAULT 'dsa',
    phase_number INTEGER CHECK (phase_number BETWEEN 1 AND 5),
    day_number INTEGER CHECK (day_number BETWEEN 1 AND 100),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    tech_stack TEXT NOT NULL, -- JSON array of string tags
    repo_url TEXT,
    demo_url TEXT,
    status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'PUBLISHED')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_100_days_projects_user ON student_100_days_projects(user_id);

-- 4. Student 100 Days Badges & Achievements
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
