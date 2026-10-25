# KeyDocs 3.0 Legacy Cleanup Plan

This document outlines the multi-phase deprecation and safe removal strategy for legacy database tables, columns, and API helper parameters in ShikshaSahayak.

---

## 🗺️ Legacy Usage Classification Matrix

| Legacy Item | Current Usage | KeyDocs 3.0 Replacement | Safe to Remove Now? | Dependencies | Recommended Removal Phase |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`subject_units`** | Legacy curriculum unit table | `curriculum_nodes` (`node_type = 'unit'`) | **No (Keep for Compatibility)** | Legacy Admin UI & Migration scripts | Phase 3 (Post-Deprecation) |
| **`subject_topics`** | Legacy curriculum topic table | `curriculum_nodes` (`node_type = 'topic'`) | **No (Keep for Compatibility)** | Legacy Admin UI & Migration scripts | Phase 3 (Post-Deprecation) |
| **`documents.paper_year`** | Legacy inline PYQ year | `pyq_metadata.exam_year` | **No (Kept as Backfill Column)** | Legacy student PYQ APIs (`/api/academic-pyqs`) | Phase 4 (Long-Term Schema Clean) |
| **`documents.season`** | Legacy inline PYQ season | `pyq_metadata.season` | **No (Kept as Backfill Column)** | Legacy student PYQ APIs | Phase 4 (Long-Term Schema Clean) |
| **`documents.material_kind`**| Legacy inline material kind | `material_metadata.material_kind` | **No (Kept as Backfill Column)** | Legacy student material APIs | Phase 4 (Long-Term Schema Clean) |
| **`documents.unit_no`** | Legacy inline unit number | `curriculum_nodes.node_number` | **No (Kept as Backfill Column)** | Legacy study material views | Phase 4 (Long-Term Schema Clean) |
| **`documents.parent_document_id`**| Legacy solution parent pointer | `document_relations` (`relation_type = 'solution'`) | **No (Kept as Backfill Column)** | Legacy solution file lookups | Phase 3 (Post-Deprecation) |
| **`documents.blog_id`** | Legacy document-to-blog link | `blogs.related_document_id` | **No (Kept as Backfill Column)** | Legacy blog detail queries | Phase 4 (Long-Term Schema Clean) |
| **`file_assets`** | Legacy physical asset hashes | `assets` | **No (Kept as Backfill Base)** | `functions/lib/fileAssets.ts` | Phase 4 (Long-Term Schema Clean) |
| **`pyq_details`** | Pre-Migration 011 table | `pyq_metadata` | **Yes (Already dropped in Migration 011)** | None | Completed |
| **`syllabus_details`** | Pre-Migration 011 table | `syllabus_metadata` | **Yes (Already dropped in Migration 011)** | None | Completed |
| **`study_material_details`**| Pre-Migration 011 table | `material_metadata` | **Yes (Already dropped in Migration 011)** | None | Completed |

---

## 🔄 Transition Roadmap

```text
Phase 1: Dual-Write & Additive Migration (CURRENT STATE)
 └── New KeyDocs 3.0 schema tables active.
 └── KeyDocs service layer backfills legacy columns on write for 100% backward compatibility.

Phase 2: Admin CMS Full Migration (COMPLETED)
 └── Admin CMS operates entirely on Subject Workspace & KeyDocs 3.0 APIs.

Phase 3: Student APIs Migration to KeyDocs Service Layer
 └── Refactor student endpoints (`/api/academic-pyqs`, etc.) to consume `queryDocuments` directly.

Phase 4: Legacy Column Deprecation & Schema Pruning
 └── Safely drop deprecated inline columns from `documents` table after 90 days of verified Phase 3 stability.
```
