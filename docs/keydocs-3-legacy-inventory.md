# KeyDocs 3.0 Legacy Inventory & Transition Classification

This document inventories every legacy database table, column, and API reference in ShikshaSahayak, classifying its current status and replacement mapping in KeyDocs 3.0.

---

## 📊 Complete Legacy Inventory Matrix

| Legacy Item | Location | Usage | Replacement | Action |
| :--- | :--- | :--- | :--- | :--- |
| **`subject_units`** | Database table | Stores legacy 1-level unit headings | `curriculum_nodes` (`node_type = 'unit'`) | `COMPATIBILITY` (Dual-written, preserved for old queries) |
| **`subject_topics`** | Database table | Stores legacy topic headings under units | `curriculum_nodes` (`node_type = 'topic'`) | `COMPATIBILITY` (Dual-written, preserved for old queries) |
| **`pyq_details`** | Database table (Obsolete) | Pre-Migration 011 PYQ metadata | `pyq_metadata` | `REMOVE` (Dropped in Migration 011) |
| **`syllabus_details`** | Database table (Obsolete) | Pre-Migration 011 Syllabus metadata | `syllabus_metadata` | `REMOVE` (Dropped in Migration 011) |
| **`study_material_details`** | Database table (Obsolete) | Pre-Migration 011 Material metadata | `material_metadata` | `REMOVE` (Dropped in Migration 011) |
| **`parent_document_id`** | Column in `documents` | Points to parent question paper for solution PDFs | `document_relations` (`relation_type = 'solution'`) | `MIGRATE` (Migrated to `document_relations`, column kept as backfill) |
| **`file_assets`** | Database table | Single-source-of-truth physical storage hash registry | `assets` | `COMPATIBILITY` (Dual-referenced by legacy file helpers) |
| **`documents.blog_id`** | Column in `documents` | Optional pointer to editorial article | `blogs.related_document_id` | `DEPRECATE` (Unidirectional blog-to-document link preferred) |
| **`documents.paper_year`** | Column in `documents` | Inline PYQ exam year | `pyq_metadata.exam_year` | `COMPATIBILITY` (Backfilled on write for legacy student APIs) |
| **`documents.season`** | Column in `documents` | Inline PYQ exam season ('S'/'W') | `pyq_metadata.season` | `COMPATIBILITY` (Backfilled on write for legacy student APIs) |
| **`documents.material_kind`**| Column in `documents` | Inline material kind ('notes', etc.) | `material_metadata.material_kind` | `COMPATIBILITY` (Backfilled on write for legacy student APIs) |
| **`documents.unit_no`** | Column in `documents` | Inline unit number | `curriculum_nodes.node_number` | `COMPATIBILITY` (Backfilled on write for legacy student views) |
| **`documents.chapter`** / **`topic`** | Columns in `documents` | Inline topic title text | `curriculum_nodes.title` | `COMPATIBILITY` (Backfilled on write for legacy student views) |

---

## 🔍 Classification Definitions
- **`KEEP`**: Essential canonical component of KeyDocs 3.0.
- **`MIGRATE`**: Actively migrated to new canonical structure, legacy pointer maintained as fallback.
- **`COMPATIBILITY`**: Maintained for zero-downtime student API backward compatibility.
- **`DEPRECATE`**: Flagged for eventual phase-out once student endpoints complete migration.
- **`REMOVE`**: Already purged or safe to drop without affecting production.
