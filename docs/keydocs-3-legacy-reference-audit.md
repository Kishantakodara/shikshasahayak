# KeyDocs 3.0 Legacy Reference Audit

This document classifies every textual reference to legacy tables, columns, and helpers across the ShikshaSahayak repository.

---

## 🔍 Classification Matrix

| Legacy Reference | Code Category | File Location | Classification | Action & Context |
| :--- | :--- | :--- | :--- | :--- |
| **`pyq_details`** | Historical Migration | `migrations/011_simplify_keydocs_schema.sql` | `SAFE` | Dropped in Migration 011; retained in historical DDL logs |
| **`syllabus_details`** | Historical Migration | `migrations/011_simplify_keydocs_schema.sql` | `SAFE` | Dropped in Migration 011; retained in historical DDL logs |
| **`study_material_details`** | Historical Migration | `migrations/011_simplify_keydocs_schema.sql` | `SAFE` | Dropped in Migration 011; retained in historical DDL logs |
| **`parent_document_id`** | D1 Schema Column | `schema.sql` | `COMPATIBILITY` | Retained as backfill column for legacy solution links |
| **`parent_document_id`** | KeyDocs Service | `functions/lib/keydocs/relations.ts` | `MIGRATE` | Populates `document_relations` (`relation_type = 'solution'`) |
| **`file_assets`** | File Storage Helper | `functions/lib/fileAssets.ts` | `COMPATIBILITY` | Maintained alongside `assets` for zero-downtime attachment resolution |
| **`subject_units`** | Admin API Endpoint | `functions/api/admin/academic/units/index.ts` | `COMPATIBILITY` | Dual-writes to `curriculum_nodes` (`node_type = 'unit'`) |
| **`subject_topics`** | Admin API Endpoint | `functions/api/admin/academic/topics/index.ts` | `COMPATIBILITY` | Dual-writes to `curriculum_nodes` (`node_type = 'topic'`) |

---

## 🎯 Summary
- Zero active production code path queries dropped tables (`pyq_details`, `syllabus_details`, `study_material_details`).
- All active application pathways gracefully handle both legacy and canonical KeyDocs 3.0 data models.
