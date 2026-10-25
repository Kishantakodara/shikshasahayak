-- Migration 013: Create Bug Reports System
-- Adds bug_reports table to store user-submitted bugs and auto-captured error logs

PRAGMA foreign_keys = OFF;

CREATE TABLE IF NOT EXISTS bug_reports (
    id TEXT PRIMARY KEY,
    user_email TEXT NOT NULL,
    description TEXT NOT NULL,
    screenshot_url TEXT,
    screenshot_storage_key TEXT,
    error_stack TEXT,
    browser_info TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'closed')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON bug_reports(status);
CREATE INDEX IF NOT EXISTS idx_bug_reports_created ON bug_reports(created_at DESC);

PRAGMA foreign_keys = ON;
