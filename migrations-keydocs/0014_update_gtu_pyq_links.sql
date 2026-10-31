-- Migration 0003: Update GTU PYQ Question Paper Links to New API Format
-- Old format: https://gtu.ac.in/uploads/{SESSION}/{COURSE}/{CODE}.pdf
-- New format: https://www.gtu.ac.in/api/v1/question-papers/archive/file/{SESSION}/{COURSE}/{CODE}.pdf
-- Target Database: DB (keydocs - 00000000-0000-0000-0000-000000000001)

UPDATE gtu_question_papers
SET 
  source_url = REPLACE(REPLACE(source_url, 'https://gtu.ac.in/uploads/', 'https://www.gtu.ac.in/api/v1/question-papers/archive/file/'), 'http://gtu.ac.in/uploads/', 'https://www.gtu.ac.in/api/v1/question-papers/archive/file/'),
  canonical_url = REPLACE(REPLACE(canonical_url, 'https://gtu.ac.in/uploads/', 'https://www.gtu.ac.in/api/v1/question-papers/archive/file/'), 'http://gtu.ac.in/uploads/', 'https://www.gtu.ac.in/api/v1/question-papers/archive/file/'),
  updated_at = CURRENT_TIMESTAMP
WHERE source_url LIKE '%gtu.ac.in/uploads/%' OR canonical_url LIKE '%gtu.ac.in/uploads/%';

UPDATE gtu_paper_registry
SET 
  canonical_pdf_url = REPLACE(REPLACE(canonical_pdf_url, 'https://gtu.ac.in/uploads/', 'https://www.gtu.ac.in/api/v1/question-papers/archive/file/'), 'http://gtu.ac.in/uploads/', 'https://www.gtu.ac.in/api/v1/question-papers/archive/file/'),
  updated_at = CURRENT_TIMESTAMP
WHERE canonical_pdf_url LIKE '%gtu.ac.in/uploads/%';

UPDATE document_files
SET 
  file_url = REPLACE(REPLACE(file_url, 'https://gtu.ac.in/uploads/', 'https://www.gtu.ac.in/api/v1/question-papers/archive/file/'), 'http://gtu.ac.in/uploads/', 'https://www.gtu.ac.in/api/v1/question-papers/archive/file/')
WHERE file_url LIKE '%gtu.ac.in/uploads/%';
