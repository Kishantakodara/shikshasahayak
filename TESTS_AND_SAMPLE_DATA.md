# 🧪 Sample Data & Test Cases Directory — ShikshaSahayak

> **Project:** ShikshaSahayak (`https://shikshasahayak.org`)  
> **Evaluation Reference:** Hack for Social Cause (VBYLD 2027)  
> **Documentation Target:** Automated Test Suites, Pre-Seeded Datasets & Manual Test Cases  

---

## 1. 🗃️ Sample Data Catalog

The repository includes pre-seeded, verified academic datasets so evaluators do not need to populate a database manually:

| Dataset / File Path | Data Type | Description & Volume |
| :--- | :--- | :--- |
| [`schema.sql`](file:///d:/Programming/SikshaSahayak/schema.sql) | D1 SQL Schema | Core relational tables: universities, degrees, branches, subjects, study materials, announcements |
| [`shiksha-core-schema.sql`](file:///d:/Programming/SikshaSahayak/shiksha-core-schema.sql) | D1 SQL Schema | Canonical production schema for academic catalog, LMS, and users |
| [`shiksha-core-seed-keydocs.sql`](file:///d:/Programming/SikshaSahayak/shiksha-core-seed-keydocs.sql) | SQL Seed Data | Real-world GTU syllabus tree, verified course notes, and PYQ metadata |
| [`public/data/gtu_subject_master_2026.csv`](file:///d:/Programming/SikshaSahayak/public/data/gtu_subject_master_2026.csv) | CSV Master Data | Master GTU subject mapping used for instant subject code lookups (e.g. `3110002`, `3110014`) |
| [`scripts/pilot-seed-data.ts`](file:///d:/Programming/SikshaSahayak/scripts/pilot-seed-data.ts) | TypeScript Seed | Ingestion script for engineering pilot modules and exam questions |
| [`scripts/seed-questions.sql`](file:///d:/Programming/SikshaSahayak/scripts/seed-questions.sql) | SQL Question Bank | 250+ unit-wise engineering practice questions for interactive quizzes |

---

## 2. 🧪 Automated Test Suites & Verification Commands

Evaluators can run these CLI commands locally to test system integrity:

### Test Suite 1: Full Hackathon System Verification (16/16 Checks)
Validates backend APIs, frontend routes, sitemap integration, and compliance documents:
```bash
npm run hackathon:verify
```
**Expected Output:**
```
TOTAL CHECKS: 16 | PASSED: 16 | FAILED: 0
🎉 ALL HACKATHON SYSTEM CHECKS PASSED WITH 100% COMPLIANCE!
```

### Test Suite 2: Production TypeScript Compilation & Vite Build Audit
Compiles all TypeScript files with strict type-safety, bundles client chunks, and verifies SPA fallback redirects:
```bash
npm run build
```
**Expected Output:**
```
✓ built in ~11s
✅ Static build verification PASSED successfully! All assets and redirects verified.
```

### Test Suite 3: AI Provider Router & Streaming Latency Test
Validates serverless AI execution, model fallbacks (Gemini, Groq, NVIDIA NIM), and curriculum grounding:
```bash
npm run ai:verify
```

### Test Suite 4: Progressive Web App (PWA) Offline Cache Audit
Verifies service worker registration, static asset pre-caching, and offline route fallbacks:
```bash
npm run pwa:verify
```

### Test Suite 5: Platform Integration & Cross-Role Access Matrix
Validates route guards and access boundaries across Student, Teacher, and Admin views:
```bash
npm run platform:verify
```

---

## 3. 👥 Pre-Configured Test Accounts (1-Click Evaluator Mode)

Jury members and evaluators can test user journeys without entering passwords or creating cloud accounts:

| Role / Persona | Pre-Seeded Email | Profile Details | Available Feature Workflows to Test |
| :--- | :--- | :--- | :--- |
| **🎓 Student** | `student@shikshasahayak.org` | Aarav Patel, Computer Engineering Sem 4, GEC | • Instant GTU subject syllabus search<br/>• Verified lecture notes reading & PDF download<br/>• 10+ year PYQ question practice<br/>• Live Gemini AI Tutor doubt clearing |
| **👨‍🏫 Teacher** | `teacher@shikshasahayak.org` | Prof. R. Sharma, Dept. of Computer Science | • Launch geofenced live attendance session<br/>• Create and distribute assignments<br/>• Grade student submissions & track class roster |
| **🛠️ Admin** | `admin@shikshasahayak.org` | Lead Evaluator / Platform Administrator | • 14-section admin console<br/>• Content ingestion pipeline monitor<br/>• Exam intelligence frequency analytics |

---

## 4. 📝 Manual End-to-End Test Scenarios

### Test Case 1: Student Notes Search & Offline Access
1. Visit `http://localhost:3000` (or `https://shikshasahayak.org`).
2. Search for subject code `3110002` (Mathematics-I) or `3110014` (Data Structures).
3. Open a unit study material. Verify that KaTeX renders mathematical notations crisply.
4. Open Chrome DevTools ➔ Network tab ➔ Check **Offline**. Verify the PWA continues to serve pre-cached study pages.

### Test Case 2: Curriculum-Grounded AI Doubts Mentor
1. Navigate to `/student` or the study material view.
2. Open the AI Assistant panel.
3. Ask: *"Explain Dijkstra's Algorithm for GTU 3110014 exam with 7-mark question pattern."*
4. Verify that the response includes: Definition, Step-by-step trace, Time complexity, and Exam tips.

### Test Case 3: Geofenced Teacher Attendance
1. Log in via 1-Click Teacher persona (`teacher@shikshasahayak.org`).
2. Navigate to Teacher Dashboard ➔ Attendance Hub.
3. Start a new digital attendance session. Verify geofence coordinates and active student check-in display.

