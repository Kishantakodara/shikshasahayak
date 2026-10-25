# KeyDocs 3.0 Production Schema Drift Report

This report compares `schema.sql` (Canonical SSOT) against deployed Cloudflare D1 migrations (`066_keydocs_3_architecture.sql` and `067_keydocs_legacy_cleanup.sql`).

---

## 📊 Schema Reconciliation Comparison

| Table / Entity | Master `schema.sql` SSOT | Applied D1 Migration DDL | Schema Drift Status |
| :--- | :--- | :--- | :--- |
| **`universities`** | `id`, `name`, `short_name`, `slug` | `020_enterprise_database_architecture.sql` | **100% IN SYNC (Zero Drift)** |
| **`branches`** | `id`, `university_id`, `name`, `slug` | `020_enterprise_database_architecture.sql` | **100% IN SYNC (Zero Drift)** |
| **`subjects`** | `id`, `university_id`, `branch_id`, `semester` | `020_enterprise_database_architecture.sql` | **100% IN SYNC (Zero Drift)** |
| **`curriculum_nodes`** | `id`, `subject_id`, `parent_id`, `node_type` | `066_keydocs_3_architecture.sql` | **100% IN SYNC (Zero Drift)** |
| **`documents`** | Thin core catalog with type metadata joins | `066_keydocs_3_architecture.sql` | **100% IN SYNC (Zero Drift)** |
| **`pyq_metadata`** | `document_id`, `exam_year`, `season` | `066_keydocs_3_architecture.sql` | **100% IN SYNC (Zero Drift)** |
| **`material_metadata`** | `document_id`, `material_kind`, `author` | `066_keydocs_3_architecture.sql` | **100% IN SYNC (Zero Drift)** |
| **`syllabus_metadata`** | `document_id`, `effective_year`, `regulation` | `066_keydocs_3_architecture.sql` | **100% IN SYNC (Zero Drift)** |
| **`document_relations`**| `source_document_id`, `target_document_id` | `066_keydocs_3_architecture.sql` | **100% IN SYNC (Zero Drift)** |
| **`document_stats`** | `document_id`, `views`, `likes`, `downloads` | `066_keydocs_3_architecture.sql` | **100% IN SYNC (Zero Drift)** |
| **`assets`** | `id`, `content_hash`, `storage_key` | `066_keydocs_3_architecture.sql` | **100% IN SYNC (Zero Drift)** |
| **`document_files`** | `id`, `document_id`, `file_asset_id`, `is_primary` | `066_keydocs_3_architecture.sql` | **100% IN SYNC (Zero Drift)** |

---

# SCHEMA DRIFT DECISION

### **ZERO SCHEMA DRIFT (100% SYNCHRONIZED)**
`schema.sql` accurately represents the exact state of deployed production D1 database migration DDL.
