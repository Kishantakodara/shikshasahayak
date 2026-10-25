# ShikshaSahayak 2.0 Database Row Count Baseline

This document records the exact row counts across all 20 database tables in ShikshaSahayak 2.0.

---

## 📊 Row Count Baseline Matrix

| Table Name | Category / Domain | Measured Row Count | Relationship Integrity Status |
| :--- | :--- | :--- | :--- |
| **`universities`** | Academic Base | 1 | 100% Valid |
| **`branches`** | Academic Base | 1 | 100% Valid (linked to `universities`) |
| **`subjects`** | Academic Offerings | 1 | 100% Valid (linked to `branches`) |
| **`curriculum_nodes`** | Curriculum Hierarchy | 17 | 100% Valid (5 Units, 12 Topics) |
| **`documents`** | Thin Core Documents | 124 | 100% Valid (linked to `subjects`) |
| **`pyq_metadata`** | Type Metadata | 68 | 100% Mapped (68 PYQs) |
| **`material_metadata`** | Type Metadata | 52 | 100% Mapped (52 Notes) |
| **`syllabus_metadata`** | Type Metadata | 4 | 100% Mapped (4 Syllabi) |
| **`document_relations`** | Document Links | 18 | 100% Mapped (Solution links) |
| **`document_stats`** | Analytics Counters | 124 | 100% Mapped (124 Documents) |
| **`assets`** | Physical R2 Storage | 118 | 100% Mapped (SHA256 Deduplicated) |
| **`document_files`** | Logical Attachments | 124 | 100% Mapped (Primary PDF links) |
| **`content_factory_jobs`** | Content Engine | 8 | 100% Valid |
| **`content_factory_items`** | Content Engine | 420 | 100% Valid (Published links intact) |
| **`blogs`** | Editorial System | 12 | 100% Valid |
| **`announcements`** | System Notices | 5 | 100% Valid |
| **`unified_users`** | Identity System | 45 | 100% Valid |
| **`academic_profiles`** | Identity Profiles | 42 | 100% Valid |
| **`teacher_whitelist`** | Governance | 10 | 100% Valid |
| **`admin_audit_logs`** | Governance Logs | 148 | 100% Valid |

---

## 🔒 Reconciliation Guarantee
All table relationships balance perfectly with 0 missing foreign key target rows.
