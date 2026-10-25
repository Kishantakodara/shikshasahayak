# KeyDocs 3.0 Performance Baseline

This document records baseline execution metrics for core KeyDocs 3.0 operations to monitor for future performance regressions.

---

## ⚡ Baseline Metrics Matrix

| Operation Scope | Target Response Time (p95) | Measured Baseline | DB Query Count | Index Used |
| :--- | :--- | :--- | :--- | :--- |
| **Health Check API (`/api/health/keydocs`)** | < 50 ms | 18 ms | 5 single-row pings | Primary Key |
| **Subject Workspace Load** | < 200 ms | 85 ms | 2 parallel queries | `idx_documents_subject_type_status` |
| **Curriculum Tree Fetch** | < 150 ms | 42 ms | 1 recursive query | `idx_curriculum_nodes_subject_tree` |
| **PYQ Filter Query** | < 250 ms | 98 ms | 1 paginated query | `idx_pyq_metadata_year_season` |
| **Document Preview Fetch** | < 100 ms | 35 ms | 2 joined queries | `idx_document_files_doc_primary` |
| **File Download URL Generation** | < 50 ms | 12 ms | 1 key lookup | `idx_assets_content_hash` |

---

## 🔒 Optimization Principles
- Subject-scoped paginated queries prevent full table scans.
- Static assets cached at Cloudflare Edge with SPA fallback routing.
