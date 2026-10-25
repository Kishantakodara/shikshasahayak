# ShikshaSahayak 2.0 Teacher Workflow & Lifecycle Map

This document presents the operational workflow map connecting Admin, Content, Teacher, Assessment, and Student Outcomes.

---

## 🗺️ End-to-End Teacher Workflow Map

```text
ADMIN PORTAL (Teacher Whitelist & Class Allocation)
  │
  ▼
TEACHER AUTHENTICATION (Firebase Token ➔ role="teacher" Resolution)
  │
  ▼
TEACHER DASHBOARD (My Subjects, My Classes, Active Roster & Quick Actions)
  │
  ├── 1. ATTENDANCE WORKFLOW (Session Launch ➔ Mark Attendance ➔ Persist in D1)
  ├── 2. MATERIAL UPLOAD WORKFLOW (Attach Notes ➔ KeyDocs 3.0 Link ➔ Publish)
  ├── 3. ASSIGNMENT WORKFLOW (Create Assignment ➔ Set Due Date ➔ Student Submits ➔ Grade)
  ├── 4. QUIZ WORKFLOW (KeyDocs PYQ Import ➔ Set Timer ➔ Auto-Grade Attempt)
  │
  ▼
TEACHER INSIGHTS ENGINE (Topic Accuracy Analytics ➔ At-Risk Identification)
  │
  ▼
TEACHER INTERVENTION (Assign Targeted Revision Notes ➔ Post Class Announcement)
  │
  ▼
STUDENT OUTCOME IMPROVEMENT (Increased Topic Mastery & Class Grade Average)
```

---

## 💡 Workflow Integrity Rules
* All teacher actions map to canonical D1 tables (`teacher_attendance_sessions`, `assignments`, `assessment_quizzes`).
* Material uploads connect to canonical KeyDocs 3.0 `document_id` references.
