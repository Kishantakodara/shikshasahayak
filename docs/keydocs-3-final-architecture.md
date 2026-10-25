# KeyDocs 3.0 Final Canonical Architecture

This document defines the official, frozen **KeyDocs 3.0** canonical architecture for **ShikshaSahayak 2.0**.

---

## 🏛️ 1. Canonical ERD Diagram

```text
                    UNIVERSITY
                        │
                     BRANCH
                        │
                     SUBJECT
                        │
                CURRICULUM_NODES
                   /     |      \
                UNIT   TOPIC   SUBTOPIC
                        │
                   DOCUMENTS
                  /    |     \
               PYQ  MATERIAL  SYLLABUS
                │      │         │
          PYQ_METADATA MATERIAL_METADATA SYLLABUS_METADATA
                \      |         /
                 DOCUMENT_FILES
                       │
                    ASSETS
                       │
                       R2

DOCUMENTS
    │
    ├── DOCUMENT_RELATIONS
    │
    └── DOCUMENT_STATS

CONTENT_FACTORY
       │
       ▼
   DOCUMENTS
```

---

## 📋 2. Core Tables Specification

### Academic Base
- **`universities`**: Institution scope (`id`, `name`, `short_name`, `slug`).
- **`branches`**: Degree stream (`id`, `university_id`, `name`, `slug`, `code`).
- **`subjects`**: Course unit (`id`, `university_id`, `branch_id`, `semester`, `name`, `code`, `slug`, `credits`).
- **`curriculum_nodes`**: Single Source of Truth for infinite curriculum hierarchy (`id`, `subject_id`, `parent_id`, `node_type`: `'unit'`|`'topic'`|`'subtopic'`, `node_number`, `title`, `description`, `sort_order`).

### Thin Core Documents & Metadata
- **`documents`**: Thin core document catalog (`id`, `document_type`: `'pyq'`|`'syllabus'`|`'study-material'`, `university_id`, `branch_id`, `semester`, `subject_id`, `curriculum_node_id`, `title`, `description`, `status`: `'published'`, `approval_status`, `created_by`, `updated_by`).
- **`pyq_metadata`**: PYQ-specific attributes (`document_id`, `exam_year`, `season`: `'S'`|`'W'`, `exam_label`).
- **`syllabus_metadata`**: Syllabus-specific attributes (`document_id`, `effective_year`, `regulation`, `version_label`).
- **`material_metadata`**: Material-specific attributes (`document_id`, `material_kind`, `author`, `publisher`).

### Document Relations & Analytics
- **`document_relations`**: Explicit document-to-document links (`id`, `source_document_id`, `target_document_id`, `relation_type`: `'solution'`|`'revision'`|`'translation'`|`'duplicate'`|`'related'`).
- **`document_stats`**: Isolated engagement metrics (`document_id`, `views`, `likes`, `downloads`, `updated_at`).

### File Attachments & Physical Assets
- **`assets`**: Deduplicated physical R2 storage registry (`id`, `content_hash`, `storage_key`, `original_filename`, `mime_type`, `size_bytes`).
- **`document_files`**: Logical attachments (`id`, `document_id`, `file_asset_id`, `file_type`, `is_primary`).

---

## 🔌 3. API & CMS Layer Integration
- **Server-Side Service**: All document queries, curriculum operations, file links, and stats updates route through `functions/lib/keydocs/`.
- **Admin Workspace**: Managed via single-page [`AdminSubjectWorkspace.tsx`](file:///a:/GitHub/ShikshaSahayak---V2/src/components/admin/content/AdminSubjectWorkspace.tsx) with Overview, Curriculum Tree, Documents Repository, and Content Factory tabs.
- **Student APIs**: Legacy student endpoints (`/api/academic-pyqs`, etc.) consume `queryDocuments` with automatic fallback reconstruction for zero downtime.
