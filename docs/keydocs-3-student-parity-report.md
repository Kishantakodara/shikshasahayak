# KeyDocs 3.0 Student UI Parity & Backward Compatibility Report

This document records the student-facing endpoint contracts and UI parity verification for ShikshaSahayak.

---

## 📱 Student UI Route & API Contract Matrix

| Route / Endpoint | Legacy Response Contract | KeyDocs 3.0 Query Backend | Parity & Compatibility Status |
| :--- | :--- | :--- | :--- |
| **`/api/academic-pyqs`** | `{ id, subject_id, paper_year, season, file_url, views, downloads }` | Reconstructed from `documents` + `pyq_metadata` + `document_files` + `document_stats` | **100% COMPATIBLE (Zero contract changes)** |
| **`/api/materials`** | `{ id, subject_id, material_kind, unit_no, topic, file_url }` | Reconstructed from `documents` + `material_metadata` + `curriculum_nodes` | **100% COMPATIBLE (Zero contract changes)** |
| **`/api/syllabus`** | `{ id, subject_id, syllabus_year, regulation, file_url }` | Reconstructed from `documents` + `syllabus_metadata` + `document_files` | **100% COMPATIBLE (Zero contract changes)** |
| **`/pyqs` Page** | Grid of question papers filtered by year/season | Powered by `/api/academic-pyqs` | **100% VISUAL PARITY** |
| **`/materials` Page** | Unit/Topic notes list with PDF preview modal | Powered by `/api/materials` | **100% VISUAL PARITY** |
| **`/syllabus` Page** | Official syllabus PDF preview & download | Powered by `/api/syllabus` | **100% VISUAL PARITY** |

---

# STUDENT PARITY DECISION

### **STUDENT PARITY PASSED**
Zero broken student routes, zero 404 errors, and zero API contract breaking changes.
