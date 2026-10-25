-- Migration 011: Subject Group system
-- Adds subject_groups table + subject_group_id and wef_year columns to subjects
-- All new columns are NULLABLE for full backward compatibility.
-- Existing subjects and PYQs are completely unaffected.

PRAGMA foreign_keys = OFF;

-- ── 1. Create subject_groups table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subject_groups (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── 2. Add subject_group_id to subjects (nullable FK) ──────────────────────
-- D1 does not support ADD COLUMN ... REFERENCES in older SQLite versions,
-- so we add the column first, then enforce integrity in application logic.
ALTER TABLE subjects ADD COLUMN subject_group_id TEXT REFERENCES subject_groups(id) ON DELETE SET NULL;

-- ── 3. Add wef_year to subjects (nullable INTEGER) ──────────────────────────
-- The admin sets this to e.g. 2023 when assigning a subject to a group.
-- Used to order siblings so the "closest older version" is found correctly.
ALTER TABLE subjects ADD COLUMN wef_year INTEGER CHECK (wef_year IS NULL OR wef_year BETWEEN 2000 AND 2100);

-- ── 4. Indexes ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_subjects_group ON subjects(subject_group_id);

PRAGMA foreign_keys = ON;
