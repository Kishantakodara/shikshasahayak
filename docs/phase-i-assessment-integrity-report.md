# ShikshaSahayak 2.0 Assessment Integrity Report

This report documents the automated read-only database integrity checks executed by `scripts/assessment-integrity-audit.ts`.

---

## 📊 Assessment Database Integrity Scorecard

| Check Name | Target Entities | Verified Constraints | Orphans Found | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Subject Authority Sync** | `assessment_quizzes`, `subjects` | Verified valid GTU branch and subject codes | 0 Orphans | **PASS** |
| **KeyDocs PYQ Linking** | `quiz_questions`, KeyDocs `documents` | Verified canonical document_id & year provenance | 0 Orphans | **PASS** |
| **Curriculum Node Alignment** | `quiz_questions`, `curriculum_nodes` | Verified valid sub-topic mapping for weakness engine | 0 Orphans | **PASS** |
| **Quiz Attempt Integrity** | `quiz_attempts`, `student_profiles` | Verified valid student ID references | 0 Orphans | **PASS** |
| **Idempotent Submission Sync** | `quiz_results` | Verified 0 duplicate result entries | 0 Orphans | **PASS** |
| **Server-Side Score Integrity** | `quiz_results`, Answer Keys | Verified persisted scores match server evaluation | 0 Orphans | **PASS** |

---

# INTEGRITY AUDIT DECISION

### **ASSESSMENT DATABASE 100% HEALTHY**
Zero orphan records or score mismatches were detected across assessment tables.
