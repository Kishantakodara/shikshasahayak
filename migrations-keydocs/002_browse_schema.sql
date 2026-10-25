-- Run on existing D1: wrangler d1 execute padhakuportal-db --local --file=./migrations/002_browse_schema.sql

ALTER TABLE branches ADD COLUMN slug TEXT;
ALTER TABLE branches ADD COLUMN short_name TEXT;
ALTER TABLE programs ADD COLUMN slug TEXT;
ALTER TABLE materials ADD COLUMN exam_year INTEGER;
ALTER TABLE materials ADD COLUMN exam_session TEXT;

UPDATE programs SET slug = 'engineering' WHERE id = 'prog_eng' AND slug IS NULL;

UPDATE branches SET slug = 'computer', short_name = 'CSE' WHERE id = 'branch_computer';
UPDATE branches SET slug = 'it', short_name = 'IT' WHERE id = 'branch_it';
UPDATE branches SET slug = 'electrical', short_name = 'EE' WHERE id = 'branch_electrical';
UPDATE branches SET slug = 'ece', short_name = 'ECE' WHERE id = 'branch_ece';
UPDATE branches SET slug = 'mechanical', short_name = 'ME' WHERE id = 'branch_mechanical';
UPDATE branches SET slug = 'civil', short_name = 'CE' WHERE id = 'branch_civil';

UPDATE materials SET status = 'approved' WHERE status = 'published';
