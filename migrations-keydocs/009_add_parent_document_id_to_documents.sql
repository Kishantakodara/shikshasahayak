-- Add parent_document_id to documents table
ALTER TABLE documents ADD COLUMN parent_document_id TEXT REFERENCES documents(id) ON DELETE CASCADE;
