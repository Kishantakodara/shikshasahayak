# Phase 12: Admin Question Intelligence Command Center

## Executive Summary
Phase 12 builds the operational administration, observability, and review surface for the ShikshaSahayak 2.0 Question Intelligence system. It exposes the underlying intelligence engines built in Phases 9 through 11 (coverage, quality evaluation, duplicate clustering, curriculum topic mapping, structural difficulty analysis, exam pattern analysis, moderation prioritization, and ingestion operations) through a secure, high-performance, and responsive administrator UI at `/admin/question-intelligence`.

---

## 1. Architectural Baseline & Rules
- **Branch**: `2.0`
- **Target Deployment**: `https://beta.shikshasahayak.org` (Cloudflare Pages `beta-padhakuportal`)
- **Production Target**: `https://shikshasahayak.org` (**STRICTLY UNTOUCHED**)
- **Scope Limit**: Roadmap terminates at Phase 15. Zero Phase 16+ creations.
- **Zero Auto-Approval Invariant**: Question quality and moderation priority engines prioritize queues but never bypass human/admin approval.
- **Provenance Preservation**: Mutually exclusive `is_original_pyq` vs `is_ai_generated` provenance flags remain immutable across all UI actions.

---

## 2. API Endpoints Implemented

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/api/admin/question-intelligence/overview` | `GET` | Admin / Reviewer | Executive health, overall scores, aggregate metrics, and data quality warnings. |
| `/api/admin/question-intelligence/matrix` | `GET` | Admin / Reviewer | 10 First-Year subjects $\times$ 5 GTU Sessions heatmap grid. |
| `/api/admin/question-intelligence/coverage` | `GET` | Admin / Reviewer | Curriculum, branch, session, and moderation coverage breakdown. |
| `/api/admin/question-intelligence/quality` | `GET` | Admin / Reviewer | Score distributions, OCR flags, placeholder detection, and flagged items. |
| `/api/admin/question-intelligence/duplicates` | `GET` | Admin / Reviewer | Duplicate clusters, recurrence counts, and member paper occurrences. |
| `/api/admin/question-intelligence/curriculum` | `GET` | Admin / Reviewer | Mapping statuses (`AUTO_MAPPED`, `REVIEW_REQUIRED`, `UNMAPPED`) and review queue. |
| `/api/admin/question-intelligence/difficulty` | `GET` | Admin / Reviewer | Structural difficulty distributions, complexity factors, and average marks. |
| `/api/admin/question-intelligence/patterns` | `GET` | Admin / Reviewer | GTU topic frequency rankings, recurring concepts, and trend momentum. |
| `/api/admin/question-intelligence/moderation` | `GET` | Admin / Reviewer | Prioritized moderation queue (`CRITICAL`, `HIGH`, `NORMAL`, `LOW`) with reason attribution. |
| `/api/admin/question-intelligence/operations` | `GET` | Admin / Reviewer | Ingestion runs, failed jobs, retry counts, and system safety constants. |
| `/api/admin/question-intelligence/search` | `GET` | Admin / Reviewer | Server-side paginated question search with parameterized filters. |
| `/api/admin/question-intelligence/[id]` | `GET` | Admin / Reviewer | Comprehensive single question inspector with LaTeX math, choices, provenance, and audit trail. |
| `/api/admin/question-intelligence/audit` | `GET` | Admin / Reviewer | Immutable question audit log events with actor, action, and rationale. |

---

## 3. UI Dashboard Modules

Located at `src/pages/admin/AdminQuestionIntelligenceDashboard.tsx`:

1. **Executive Health & Alert Banner**:
   - Health Status (`HEALTHY`, `WARNING`, `CRITICAL`, `INSUFFICIENT_DATA`), Coverage Score, Quality Score, Verified Count, Staged Backlog, Failed Papers.
   - Real-time warning alerts for moderation backlogs, unmapped curriculum items, and failed ingestion runs.
2. **Subject $\times$ Session Heatmap Matrix**:
   - 10 First-Year engineering subjects $\times$ 5 GTU sessions (`W2022`, `S2023`, `W2023`, `S2024`, `W2024`).
   - Interactive drilldown modal per cell displaying verified, staged, total question counts, and ingestion status.
3. **Quality Center**:
   - Distribution across High Quality ($\ge 80$), Acceptable ($60-79$), Needs Review ($40-59$), and Poor ($< 40$).
   - Flagged question inspector for OCR artifacts and placeholder option detection.
4. **Duplicate & Recurrence Intelligence**:
   - Multi-year GTU repeat clusters with repeat frequency bands (`VERY_HIGH_REPEAT`, `HIGH_REPEAT`, `MEDIUM_REPEAT`, `UNIQUE`).
   - Preservation of all original exam paper references.
5. **Curriculum Mapping Center**:
   - NLP mapping review queue with confidence ratings and unit/topic assignment.
6. **Difficulty Intelligence**:
   - Structural difficulty distribution (`EASY`, `MEDIUM`, `HARD`, `VERY_HARD`) and rubric marks allocation.
7. **Exam Pattern Intelligence**:
   - Historical frequency rankings and recurring concepts with non-predictive decision support disclaimer.
8. **Prioritized Moderation Workspace**:
   - Priority scores ($0-100$) and priority tiers (`CRITICAL`, `HIGH`, `NORMAL`, `LOW`) ranking authentic GTU PYQs and high-impact exam topics first.
9. **Ingestion Operations & Safety Limits**:
   - Real-time job monitor and display of hard backend safety constants (`MAX_PAPERS_PER_INGESTION_RUN=20`, `MAX_QUESTIONS_PER_BATCH=100`, `MAX_PDF_SIZE_BYTES=15MB`, `MAX_RETRY_COUNT=3`).
10. **Global Bank Search & Question Inspector**:
    - Server-side paginated search with filters.
    - Full modal drawer rendering LaTeX mathematics, answer choices, structural difficulty, provenance badges (`ORIGINAL GTU PYQ` vs `AI PRACTICE`), and audit trail.

---

## 4. Verification & Regression Results

| Test Suite | Result | Details |
|---|---|---|
| `verify-phase12-question-intelligence.ts` | **62 / 62 PASS** | Admin Auth, Health, Matrix, Quality, Duplicates, Curriculum, Difficulty, Patterns, Moderation, Operations, Search, Inspector, Audit, Alerts, Security |
| `verify-phase11-question-intelligence.ts` | **60 / 60 PASS** | Exam Trends, Recurrence, Priority, Topic Risk, Readiness, Study Plans, Recommendations |
| `verify-phase10-question-intelligence.ts` | **60 / 60 PASS** | Question Bank Intelligence, Quality, Duplicates, Mapping, Health |
| `verify-phase9-question-intelligence.ts` | **47 / 47 PASS** | GTU First-Year Ingestion Operations, Safety Bounds, Resumability |
| `verify-phase8-question-intelligence.ts` | **24 / 24 PASS** | Live Beta Pilot Validation & Real GTU 3110014 Pipeline |
| `verify-phase7d-ingestion-integrity.ts` | **20 / 20 PASS** | Hardened Extraction, Parser Fault Tolerance |
| `verify-phase7c-moderation-integrity.ts` | **24 / 24 PASS** | State Machine, Audit Logging, Student Shielding |
| `verify-phase7-question-intelligence.ts` | **12 / 12 PASS** | Extraction, Segmentation, Invariant Enforcement |
| `verify-content-question-integrity.ts` | **20 / 20 PASS** | Content Engine & Question Integrity Baseline |
| Platform Suites (`admin:auth`, `teacher:audit`, `platform:audit`, `assessment:audit`, `users:integrity`, `ops:health`) | **All PASS** | 100% healthy across platform subsystems |
| TypeScript (`npx tsc --noEmit`) | **0 errors** | Clean compilation |
| Production Build (`npm run build`) | **PASS** | 137 JavaScript chunks, SPA fallbacks, static manifest verification passed |

---

## 5. Security Guarantees
1. **Authoritative Admin Gating**: All `/api/admin/question-intelligence/*` endpoints enforce server-side `getAuthenticatedUser` + `isAdmin` (or `reviewer` role), returning `403 Forbidden` for unauthorized callers.
2. **Answer Key Shielding**: Pre-submission evaluation metadata and answer keys are never leaked to unauthorized client contexts.
3. **No Auto-Approval Invariant**: Quality and priority scores provide queue ordering and review hints but strictly enforce `isAutoApprovalEligible = false`.
4. **SQL Injection Defense**: All search queries, filters, and detail lookups use parameterized D1 statements.
5. **Provenance Preservation**: Mutually exclusive original PYQ vs AI practice flags are locked and cannot be corrupted via UI operations.
