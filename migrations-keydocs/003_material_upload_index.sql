-- Query helper for Cloudflare D1 dashboard:
-- SELECT * FROM material_upload_index ORDER BY created_at DESC;

DROP VIEW IF EXISTS material_upload_index;

CREATE VIEW material_upload_index AS
SELECT
    m.id AS material_id,
    m.title,
    m.material_type,
    m.status,
    m.storage_key,
    m.exam_year,
    m.exam_session,
    m.uploaded_by,
    m.approved_by,
    m.created_at,
    b.id AS branch_id,
    b.name AS branch_name,
    b.slug AS branch_slug,
    so.semester_no AS semester,
    s.id AS subject_id,
    s.code AS subject_code,
    s.name AS subject_name,
    s.normalized_name AS subject_slug,
    so.id AS subject_offering_id,
    so.curriculum_version_id
FROM materials m
JOIN material_targets mt ON m.id = mt.material_id
JOIN subject_offerings so ON mt.subject_offering_id = so.id
JOIN subjects s ON so.subject_id = s.id
JOIN subject_offering_branches sob ON so.id = sob.subject_offering_id
JOIN branches b ON sob.branch_id = b.id;
