-- Add blog_id to documents table
ALTER TABLE documents ADD COLUMN blog_id TEXT REFERENCES blogs(id) ON DELETE SET NULL;

-- Populate existing blog_ids
UPDATE documents
SET blog_id = (
  SELECT id FROM blogs
  WHERE related_document_id = documents.id
  LIMIT 1
)
WHERE id IN (
  SELECT related_document_id FROM blogs
  WHERE related_document_id IS NOT NULL
);
