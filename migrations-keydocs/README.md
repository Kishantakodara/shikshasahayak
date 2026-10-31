# KeyDocs D1 Migrations (`DB`)

Target Database: `keydocs` (`00000000-0000-0000-0000-000000000001`)  
Configuration Binding: `DB` in `wrangler.toml` (`migrations_dir = "migrations-keydocs"`)

## Migration Inventory & Sequence

The directory contains the complete historical migration sequence for the KeyDocs database matching the 14 rows recorded in remote `keydocs.d1_migrations`, plus the GTU PYQ link update:

1. `0001_allow_semester_zero.sql`
2. `002_browse_schema.sql`
3. `003_material_upload_index.sql`
4. `004_rename_notes_to_study_materials.sql`
5. `005_add_blogs_to_keydocs.sql`
6. `006_reset_keydocs_document_schema.sql`
7. `007_ssot_file_assets.sql`
8. `008_add_blog_id_to_documents.sql`
9. `009_add_parent_document_id_to_documents.sql`
10. `010_fix_semester_check_constraint.sql`
11. `011_simplify_keydocs_schema.sql`
12. `011_subject_groups.sql`
13. `012_create_website_popups.sql`
14. `013_create_bug_reports.sql`
15. `0014_update_gtu_pyq_links.sql` (Renumbered from `0003` to `0014` to cleanly follow `013` and prevent collision with `003_material_upload_index.sql`)

## Historical Context & Database Isolation

1. **Target Tables**:
   - `gtu_question_papers`
   - `gtu_paper_registry`
   - `document_files`
   These tables belong exclusively to the `keydocs` (`DB`) database. They do NOT exist in `PADHAKU_CORE_DB`.
   
2. **Current Production State**:
   - Migrations 1 through 14 are tracked in remote `d1_migrations` of `DB`.
   - All 2,640 affected GTU question paper records in production `keydocs` (`DB`) already have the new API URL format. Running `0014_update_gtu_pyq_links.sql` against `keydocs` is idempotent (`WHERE source_url LIKE '%gtu.ac.in/uploads/%'` matches 0 rows).
   
3. **Preservation**:
   The authentic SQL statements of `0014_update_gtu_pyq_links.sql` are preserved word-for-word. It was relocated from `migrations-shiksha-core/` and renumbered from `0003` to `0014` to reflect its proper sequence in the KeyDocs domain.
