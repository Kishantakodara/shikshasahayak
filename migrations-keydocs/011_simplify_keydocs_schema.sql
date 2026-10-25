-- Migration 011: Simplify keydocs schema by unifying detail and stat tables into documents
PRAGMA foreign_keys = OFF;

-- 1. Add missing columns to documents table if they don't already exist
ALTER TABLE documents ADD COLUMN paper_year INTEGER CHECK (paper_year IS NULL OR paper_year BETWEEN 2000 AND 2100);
ALTER TABLE documents ADD COLUMN season TEXT CHECK (season IS NULL OR season IN ('S', 'W'));
ALTER TABLE documents ADD COLUMN exam_label TEXT;

ALTER TABLE documents ADD COLUMN syllabus_year INTEGER CHECK (syllabus_year IS NULL OR syllabus_year BETWEEN 2000 AND 2100);
ALTER TABLE documents ADD COLUMN regulation TEXT;
ALTER TABLE documents ADD COLUMN version_label TEXT;

ALTER TABLE documents ADD COLUMN material_kind TEXT DEFAULT 'notes' CHECK (material_kind IS NULL OR material_kind IN ('notes', 'book', 'assignment', 'practical', 'question_bank', 'video', 'other'));
ALTER TABLE documents ADD COLUMN unit_no INTEGER CHECK (unit_no IS NULL OR unit_no >= 0);
ALTER TABLE documents ADD COLUMN chapter TEXT;
ALTER TABLE documents ADD COLUMN topic TEXT;
ALTER TABLE documents ADD COLUMN author TEXT;

ALTER TABLE documents ADD COLUMN views INTEGER NOT NULL DEFAULT 0 CHECK (views >= 0);
ALTER TABLE documents ADD COLUMN likes INTEGER NOT NULL DEFAULT 0 CHECK (likes >= 0);
ALTER TABLE documents ADD COLUMN downloads INTEGER NOT NULL DEFAULT 0 CHECK (downloads >= 0);

-- 2. Backfill existing data from pyq_details
UPDATE documents SET 
  paper_year = (SELECT paper_year FROM pyq_details WHERE pyq_details.document_id = documents.id),
  season = (SELECT season FROM pyq_details WHERE pyq_details.document_id = documents.id),
  exam_label = (SELECT exam_label FROM pyq_details WHERE pyq_details.document_id = documents.id)
WHERE document_type = 'pyq' AND EXISTS (SELECT 1 FROM pyq_details WHERE pyq_details.document_id = documents.id);

-- 3. Backfill existing data from syllabus_details
UPDATE documents SET 
  syllabus_year = (SELECT syllabus_year FROM syllabus_details WHERE syllabus_details.document_id = documents.id),
  regulation = (SELECT regulation FROM syllabus_details WHERE syllabus_details.document_id = documents.id),
  version_label = (SELECT version_label FROM syllabus_details WHERE syllabus_details.document_id = documents.id)
WHERE document_type = 'syllabus' AND EXISTS (SELECT 1 FROM syllabus_details WHERE syllabus_details.document_id = documents.id);

-- 4. Backfill existing data from study_material_details
UPDATE documents SET 
  material_kind = (SELECT material_kind FROM study_material_details WHERE study_material_details.document_id = documents.id),
  unit_no = (SELECT unit_no FROM study_material_details WHERE study_material_details.document_id = documents.id),
  chapter = (SELECT chapter FROM study_material_details WHERE study_material_details.document_id = documents.id),
  topic = (SELECT topic FROM study_material_details WHERE study_material_details.document_id = documents.id),
  author = (SELECT author FROM study_material_details WHERE study_material_details.document_id = documents.id)
WHERE document_type = 'study-material' AND EXISTS (SELECT 1 FROM study_material_details WHERE study_material_details.document_id = documents.id);

-- 5. Backfill existing stats from document_stats
UPDATE documents SET 
  views = COALESCE((SELECT views FROM document_stats WHERE document_stats.document_id = documents.id), 0),
  likes = COALESCE((SELECT likes FROM document_stats WHERE document_stats.document_id = documents.id), 0),
  downloads = COALESCE((SELECT downloads FROM document_stats WHERE document_stats.document_id = documents.id), 0)
WHERE EXISTS (SELECT 1 FROM document_stats WHERE document_stats.document_id = documents.id);

-- 6. Drop obsolete split detail and stats tables
DROP TABLE IF EXISTS pyq_details;
DROP TABLE IF EXISTS syllabus_details;
DROP TABLE IF EXISTS study_material_details;
DROP TABLE IF EXISTS document_stats;

PRAGMA foreign_keys = ON;
