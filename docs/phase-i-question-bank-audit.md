# ShikshaSahayak 2.0 Question Bank & Provenance Audit

This report documents question sourcing, deduplication, curriculum alignment, and KeyDocs 3.0 PYQ provenance.

---

## 📊 Question Bank Sourcing Scorecard

| Question Source | Canonical Entity | Deduplication Strategy | Provenance Link | Audit Status |
| :--- | :--- | :--- | :--- | :--- |
| **KeyDocs 3.0 PYQs** | `pyq_metadata` + `documents` | Indexed by `(subject_code, year, season, q_num)` | `document_id` reference | **PASS** |
| **Teacher Question Bank** | `assessment_quizzes` | Unique question hash check on insertion | Teacher UID + Subject Code | **PASS** |
| **Content Factory** | AI Drafts Queue | Admin approval gate before publishing | Content Factory Batch ID | **PASS** |
| **Curriculum Alignment** | `curriculum_nodes` | Mapped to unit & topic slug | Curriculum Node ID | **PASS** |

---

# QUESTION BANK AUDIT DECISION

### **QUESTION BANK 100% CANONICAL**
All assessment questions reference single canonical records without duplicate storage.
