-- Migration 012: Create Website Popups System
-- Adds website_popups table for managing dynamic overlays on the site

PRAGMA foreign_keys = OFF;

CREATE TABLE IF NOT EXISTS website_popups (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'announcement', -- 'announcement', 'offer', 'maintenance', 'survey'
    html_content TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 0 CHECK (is_active IN (0, 1)),
    start_date TEXT, -- ISO DateTime string
    end_date TEXT, -- ISO DateTime string
    frequency TEXT NOT NULL DEFAULT 'once', -- 'always', 'once', 'session', 'days'
    expiry_days INTEGER DEFAULT 7,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_website_popups_active ON website_popups(is_active);

PRAGMA foreign_keys = ON;
