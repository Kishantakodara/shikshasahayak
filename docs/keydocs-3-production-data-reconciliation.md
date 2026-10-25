# KeyDocs 3.0 Production Data Reconciliation Report

This report documents the D1 database entity counts, reconciliation metrics, and orphan audit findings for **ShikshaSahayak 2.0**.

---

## 📊 Database Entity Reconciliation Summary

| Entity Category | Master Entity Count | Reconciliation Status | Notes & Coverage |
| :--- | :--- | :--- | :--- |
| **Universities** | 1 (`gtu`) | **RECONCILED** | GTU (Gujarat Technological University) primary base |
| **Branches** | 1 (`branch_07`) | **RECONCILED** | Computer Engineering (07) active branch |
| **Subjects** | 1 (`sub_3150710`) | **RECONCILED** | Computer Networks (3150710) GTU Semester 5 |
| **Curriculum Nodes** | 5 Units / 12 Topics | **RECONCILED** | 100% infinite hierarchy tree coverage |
| **Total Documents** | 124 | **RECONCILED** | All thin core `documents` rows active |
| **PYQs** | 68 | **RECONCILED** | 100% mapped to `pyq_metadata` rows |
| **Study Materials** | 52 | **RECONCILED** | 100% mapped to `material_metadata` rows |
| **Syllabi** | 4 | **RECONCILED** | 100% mapped to `syllabus_metadata` rows |
| **Physical Assets** | 118 | **RECONCILED** | Registered in `assets` with content SHA256 hashes |
| **Document Files** | 124 | **RECONCILED** | Mapped in `document_files` (`is_primary = 1`) |
| **Document Relations** | 18 | **RECONCILED** | PYQ Paper-to-Solution links (`relation_type = 'solution'`) |
| **Document Stats** | 124 | **RECONCILED** | Isolated counters in `document_stats` |

---

## 🧹 Orphan & Integrity Reconciliation Audit Results

| Integrity Metric | Found Count | Threshold | Severity | Audit Status |
| :--- | :--- | :--- | :--- | :--- |
| **Orphan Documents** | 0 | 0 | **CRITICAL** | **PASS** |
| **Orphan Curriculum Nodes** | 0 | 0 | **CRITICAL** | **PASS** |
| **Orphan Type Metadata** | 0 | 0 | **HIGH** | **PASS** |
| **Orphan Document Files** | 0 | 0 | **HIGH** | **PASS** |
| **Unreferenced Physical Assets** | 0 | 0 | **HIGH** | **PASS** |
| **Broken Document Relations** | 0 | 0 | **HIGH** | **PASS** |
| **Duplicate Asset Content Hashes** | 0 | 0 | **MEDIUM** | **PASS** |
| **Possible Duplicate PYQ Papers** | 0 | 0 | **MEDIUM** | **PASS** |
| **Missing Document Stats Rows** | 0 | 0 | **LOW** | **PASS** |
| **Orphan Content Factory Publications** | 0 | 0 | **HIGH** | **PASS** |

---

# RECONCILIATION SUMMARY DECISION

### **DATABASE RECONCILIATION PASSED**
All D1 production data entities are fully reconciled, aligned with KeyDocs 3.0 canonical tables, and verified with zero orphan records.
