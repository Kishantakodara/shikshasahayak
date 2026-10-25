# ShikshaSahayak 2.0 — Phase 11 Technical Specification
## GTU Exam Intelligence, Prediction & Personalized Preparation Engine

---

## 1. Executive Summary & Core Purpose

Phase 11 introduces the top-level academic decision-support engine for ShikshaSahayak 2.0. By analyzing multi-year historical GTU examination papers, recurring duplicate clusters, curriculum weightings, and real-time student performance telemetry, the system provides transparent, explainable exam intelligence and customized study plans without ever making unscientific or false claims of exam certainty.

---

## 2. Architectural Components

The Exam Intelligence Engine is organized into modular services located under `functions/lib/questionIntelligence/examIntelligence/`:

```
functions/lib/questionIntelligence/examIntelligence/
├── types.ts                          # Unified type contracts
├── examTrendService.ts               # Multi-session frequency & momentum trend analysis
├── recurrenceIntelligenceService.ts  # Cluster recurrence & historical repeat metrics
├── examPriorityService.ts            # Deterministic multi-factor priority scoring
├── topicRiskService.ts               # Student topic risk evaluation & vulnerability mapping
├── examReadinessService.ts           # 7-dimension student exam readiness scoring
├── personalizedStudyPlanService.ts   # Daily targets, unit milestones & revision queues
├── questionRecommendationService.ts # Intent-mapped question recommendations with answer shielding
├── predictionExplanationService.ts   # Human-readable insights & No-False-Prediction policy guards
├── examIntelligenceService.ts        # Main orchestration facade for APIs
└── index.ts                          # Module barrel export
```

---

## 3. Key Subsystems & Mathematical Models

### 3.1 Exam Trend Analysis (`examTrendService.ts`)
Tracks topic and question occurrences across historical GTU exam sessions (W2024, S2024, W2023, S2023, W2022).
- **Trend Directions**:
  - `RISING`: Recent session frequency rate $\ge 1.4\times$ historical baseline.
  - `STABLE`: Balanced distribution across sessions.
  - `DECLINING`: Recent session frequency rate $\le 0.6\times$ historical baseline.
  - `RECENTLY_APPEARED`: Topic observed in recent papers with zero prior history.
  - `LONG_ABSENCE`: Topic with prior history not asked in the last 2 exam cycles.
  - `HIGH_RECURRENCE`: Associated with $\ge 2$ recurring duplicate question clusters.
  - `INSUFFICIENT_DATA`: Fewer than 2 historical data points.

### 3.2 Recurrence Intelligence (`recurrenceIntelligenceService.ts`)
Leverages Phase 10 duplicate clusters to compute repeat frequency metrics:
- `VERY_HIGH_REPEAT` ($\ge 4$ sessions)
- `HIGH_REPEAT` ($3$ sessions)
- `MEDIUM_REPEAT` ($2$ sessions)
- `UNIQUE` ($1$ session)
- Computes average session gap and preserves complete question provenance.

### 3.3 Multi-Factor Priority Scoring (`examPriorityService.ts`)
Deterministic $0-100$ priority score based on verifiable historical factors:
$$\text{PriorityScore} = 0.30 \cdot F + 0.25 \cdot R + 0.15 \cdot T + 0.15 \cdot M + 0.15 \cdot S$$
Where:
- $F$: Historical Frequency Score ($0-100$)
- $R$: Recurrence Score ($0-100$)
- $T$: Recent Trend Score ($0-100$)
- $M$: Marks Importance Score ($0-100$)
- $S$: Core Syllabus Weight ($0-100$)

### 3.4 Student Topic Risk Engine (`topicRiskService.ts`)
Blends exam priority with student topic mastery to highlight academic vulnerability:
- `CRITICAL_RISK`: High/Critical Exam Priority + Student Mastery $< 50\%$.
- `HIGH_RISK`: High/Critical Exam Priority + Student Mastery $50-74\%$.
- `MODERATE_RISK`: Medium Exam Priority + Low Student Mastery.
- `LOW_RISK`: Student Mastery $\ge 75\%$.
- `NO_STUDENT_DATA`: Topic has never been practiced by the student.

### 3.5 Student Exam Readiness Score (`examReadinessService.ts`)
Multi-dimensional evaluation across 7 key academic dimensions:
1. `CONTENT_COVERAGE` (15% weight)
2. `TOPIC_MASTERY` (20% weight)
3. `PYQ_MASTERY` (20% weight)
4. `EXAM_PATTERN_COVERAGE` (15% weight)
5. `DIFFICULTY_READINESS` (10% weight)
6. `RECENT_PERFORMANCE` (10% weight)
7. `REVISION_HEALTH` (10% weight)

Readiness Tiers:
- `NOT_STARTED` ($0$)
- `FOUNDATION` ($1-34$)
- `DEVELOPING` ($35-54$)
- `PREPARING` ($55-74$)
- `EXAM_READY` ($75-89$)
- `STRONG` ($\ge 90$)

---

## 4. Safety & Security Invariants

1. **No-False-Prediction Policy**: Hard boundary against claiming probability or certainty of specific questions appearing on exams. All outputs are explicitly framed as historical decision-support.
2. **Verified-Only Gating**: Unverified, draft, or archived questions are strictly excluded from student recommendations.
3. **Pre-Submission Answer Shielding**: Answer keys, correct option IDs, solutions, and explanations are stripped from client DTOs.
4. **Cross-Student IDOR Isolation**: All queries strictly enforce `student_id` binding from verified session tokens.
5. **SQL Injection Resistance**: All D1 database queries use parameterized prepared statements.

---

## 5. Database Schema & Migration (`migrations/080_exam_intelligence.sql`)

- `student_exam_readiness_snapshots`
- `student_topic_risk_profiles`
- `student_preparation_plans`
- `exam_topic_trend_snapshots`

---

## 6. Verification & Certification Results

- **Phase 11 Master Suite**: 60 / 60 PASS (100%)
- **Full Platform Regression Suite**: 267 / 267 PASS (100%)
- **Zero TypeScript Errors**: `npx tsc --noEmit` PASS
- **Production Build**: Clean bundle compilation.
