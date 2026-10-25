# ShikshaSahayak 2.0 Personalization & Academic Context Audit

This document details how student academic context (University, Branch, Semester, Career Goals) dynamically shapes dashboard recommendations and content discovery.

---

## 📊 Academic Context Personalization Matrix

| Context Parameter | D1 Database Column | Personalization Action | Verification Status |
| :--- | :--- | :--- | :--- |
| **University** | `student_profiles.university` | Filters official GTU/University syllabus & paper links | **VERIFIED (LIVE)** |
| **Branch / Department**| `student_profiles.branch` | Configures branch-tailored daily code challenges & packs | **VERIFIED (LIVE)** |
| **Semester** | `student_profiles.semester` | Renders active semester core subjects (e.g. GTU Sem 5) | **VERIFIED (LIVE)** |
| **Career Goal** | `student_profiles.goals` | Unlocks GATE prep, placement DSA, or research tracks | **VERIFIED (LIVE)** |
| **Topic Accuracies** | `user_quiz_attempts` | Drives Weakness Engine recommendations | **VERIFIED (LIVE)** |

---

## 🔒 Personalization Integrity Rule
No student context is hardcoded; all dashboard widgets react dynamically to changes saved in `StudentAcademicContext`.
