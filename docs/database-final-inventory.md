# ShikshaSahayak 2.0 Complete Database Final Inventory

This document presents the complete table inventory, primary keys, foreign keys, indexes, and classification status for all tables in ShikshaSahayak 2.0.

---

## 📊 Complete Database Inventory Matrix

| Domain | Table Name | Purpose | Primary Key | Foreign Keys | Key Indexes | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **ACADEMIC** | `universities` | Institution base | `id` | None | Primary Key | **CANONICAL** |
| **ACADEMIC** | `branches` | Engineering stream | `id` | `university_id` | `university_id` | **CANONICAL** |
| **ACADEMIC** | `subjects` | Course offerings | `id` | `branch_id`, `university_id` | `branch_id, semester, slug` | **CANONICAL** |
| **ACADEMIC** | `curriculum_nodes` | Infinite syllabus tree | `id` | `subject_id`, `parent_id` | `idx_curriculum_nodes_subject_tree` | **CANONICAL** |
| **ACADEMIC** | `subject_units` | Legacy unit headings | `id` | `subject_id` | `subject_id` | **COMPATIBILITY** |
| **ACADEMIC** | `subject_topics` | Legacy topic headings | `id` | `unit_id` | `unit_id` | **COMPATIBILITY** |
| **KEYDOCS** | `documents` | Thin core catalog | `id` | `subject_id`, `curriculum_node_id` | `idx_documents_subject_type_status` | **CANONICAL** |
| **KEYDOCS** | `pyq_metadata` | Exam year & season | `document_id` | `document_id` | `idx_pyq_metadata_year_season` | **CANONICAL** |
| **KEYDOCS** | `syllabus_metadata` | Scheme & regulation | `document_id` | `document_id` | Primary Key | **CANONICAL** |
| **KEYDOCS** | `material_metadata` | Material kind & author | `document_id` | `document_id` | Primary Key | **CANONICAL** |
| **KEYDOCS** | `document_relations` | Solution & related links | `id` | `source_document_id`, `target_document_id` | `idx_doc_relations_source_type` | **CANONICAL** |
| **KEYDOCS** | `document_stats` | Views, likes, downloads | `document_id` | `document_id` | `idx_document_stats_id` | **CANONICAL** |
| **KEYDOCS** | `assets` | Physical R2 storage hash | `id` | None | `idx_assets_content_hash` | **CANONICAL** |
| **KEYDOCS** | `document_files` | Logical file attachments | `id` | `document_id`, `file_asset_id` | `idx_document_files_doc_primary` | **CANONICAL** |
| **KEYDOCS** | `file_assets` | Legacy storage registry | `id` | None | `content_hash` | **COMPATIBILITY** |
| **CONTENT** | `content_factory_jobs` | AI generation batch | `id` | `subject_id` | Primary Key | **ACTIVE** |
| **CONTENT** | `content_factory_items` | AI topic drafts | `id` | `subject_id`, `published_document_id` | Primary Key | **ACTIVE** |
| **CONTENT** | `blogs` | Editorial posts | `id` | `author_id`, `related_document_id` | Primary Key | **ACTIVE** |
| **CONTENT** | `announcements` | Site notices | `id` | None | Primary Key | **ACTIVE** |
| **IDENTITY** | `unified_users` | User accounts | `id` | None | `email` | **ACTIVE** |
| **IDENTITY** | `academic_profiles` | Student preferences | `user_id` | `user_id`, `university_id`, `branch_id` | Primary Key | **ACTIVE** |
| **GOVERNANCE**| `teacher_whitelist` | Teacher permissions | `email` | None | Primary Key | **ACTIVE** |
| **GOVERNANCE**| `admin_audit_logs` | Audit trail | `id` | None | `timestamp` | **ACTIVE** |

---

## 🔒 Governance Standard
Canonical tables handle 100% of live production traffic. Compatibility tables are read-only fallbacks with zero dual-write overhead.
