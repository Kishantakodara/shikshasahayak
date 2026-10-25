-- Migration to rename academic_notes table to academic_study_materials
-- and update material_type records from 'notes' to 'study-material'.

ALTER TABLE academic_notes RENAME TO academic_study_materials;

UPDATE materials SET material_type = 'study-material' WHERE material_type = 'notes';
