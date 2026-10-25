# KeyDocs 3.0 Full Application Integration Inventory

This document classifies every reference to content documents, metadata, files, and APIs across the ShikshaSahayak repository.

---

## 📊 Application Reference Classification Matrix

| Reference Pattern | File Path / Subsystem | Category | Description & Usage | KeyDocs 3.0 Status |
| :--- | :--- | :--- | :--- | :--- |
| **`documents`** | `functions/lib/keydocs/documents.ts` | **A. Canonical KeyDocs 3.0** | Thin master document catalog handler | **ACTIVE CANONICAL** |
| **`curriculum_nodes`** | `functions/lib/keydocs/curriculum.ts` | **A. Canonical KeyDocs 3.0** | Master infinite curriculum hierarchy handler | **ACTIVE CANONICAL** |
| **`pyq_metadata`** | `functions/lib/keydocs/queries.ts` | **A. Canonical KeyDocs 3.0** | PYQ exam year & season metadata | **ACTIVE CANONICAL** |
| **`material_metadata`** | `functions/lib/keydocs/queries.ts` | **A. Canonical KeyDocs 3.0** | Notes/Book material kind & author metadata | **ACTIVE CANONICAL** |
| **`syllabus_metadata`** | `functions/lib/keydocs/queries.ts` | **A. Canonical KeyDocs 3.0** | Scheme regulation & effective year metadata | **ACTIVE CANONICAL** |
| **`document_relations`** | `functions/lib/keydocs/relations.ts` | **A. Canonical KeyDocs 3.0** | Explicit solution & related document pointers | **ACTIVE CANONICAL** |
| **`assets` / `document_files`** | `functions/lib/keydocs/files.ts` | **A. Canonical KeyDocs 3.0** | Physical R2 hash registry & logical attachments | **ACTIVE CANONICAL** |
| **`document_stats`** | `functions/lib/keydocs/stats.ts` | **A. Canonical KeyDocs 3.0** | Isolated views, likes, downloads counters | **ACTIVE CANONICAL** |
| **`/api/academic-pyqs`** | `functions/api/academic-pyqs/index.ts` | **D. Student Contract** | Legacy PYQ query endpoint wrapped over KeyDocs 3.0 | **COMPATIBLE READ-ONLY** |
| **`/api/materials`** | `functions/api/materials/index.ts` | **D. Student Contract** | Legacy notes query endpoint wrapped over KeyDocs 3.0 | **COMPATIBLE READ-ONLY** |
| **`/api/syllabus`** | `functions/api/syllabus/index.ts` | **D. Student Contract** | Legacy syllabus query endpoint wrapped over KeyDocs 3.0 | **COMPATIBLE READ-ONLY** |
| **`AdminSubjectWorkspace`** | `src/components/admin/content/` | **E. Admin Implementation** | Single-page Subject Workspace CMS entry point | **ACTIVE CANONICAL** |
| **`content_factory_items`** | `functions/api/admin/content-factory/` | **A. Canonical KeyDocs 3.0** | AI item publication synced directly into KeyDocs 3.0 | **ACTIVE CANONICAL** |

---

## 🔒 Parity Guarantee
All write operations across the Admin CMS, Contributor Portal, and AI Content Factory flow exclusively into KeyDocs 3.0 canonical tables (`documents`, `pyq_metadata`, `material_metadata`, `syllabus_metadata`, `document_files`, `assets`).
