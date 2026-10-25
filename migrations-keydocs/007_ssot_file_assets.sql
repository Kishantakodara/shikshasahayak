-- SSOT deduplication: content-addressable file_assets + branch context on documents.
-- documents + document_files act as the branch-to-file mapping (branch_files role).

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS file_assets (
    id TEXT PRIMARY KEY,
    content_hash TEXT NOT NULL UNIQUE,
    original_filename TEXT NOT NULL,
    storage_key TEXT NOT NULL UNIQUE,
    mime_type TEXT,
    size_bytes INTEGER CHECK (size_bytes IS NULL OR size_bytes >= 0),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_file_assets_hash ON file_assets(content_hash);
CREATE INDEX IF NOT EXISTS idx_file_assets_storage_key ON file_assets(storage_key);

ALTER TABLE document_files ADD COLUMN file_asset_id TEXT REFERENCES file_assets(id);
ALTER TABLE document_files ADD COLUMN original_filename TEXT;

CREATE INDEX IF NOT EXISTS idx_document_files_asset ON document_files(file_asset_id);
