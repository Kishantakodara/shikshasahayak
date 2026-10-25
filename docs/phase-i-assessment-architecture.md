# ShikshaSahayak 2.0 Assessment Architecture Document

This document presents the canonical assessment model connecting KeyDocs 3.0, Question Banks, Test Attempt Engines, Weakness Analytics, and Revision Materials.

---

## 🏛️ Assessment Architecture Blueprint

```text
CANONICAL QUESTION SOURCE (KeyDocs 3.0 PYQ Bank + Teacher/Content Question Repository)
  │
  ├── Used By: PYQ Practice Papers
  ├── Used By: Subject Quizzes & Unit Practice
  ├── Used By: GTU Mid-Sem & All-India GATE Mocks
  │
  ▼
UNIFIED ATTEMPT ENGINE (`QuizAttempt.tsx` + Server-Authoritative Timer)
  │
  ├── Answer Auto-Save (Local Buffer)
  ├── Mark for Review
  ├── Server Timing Check
  │
  ▼
IDEMPOTENT SUBMISSION PIPELINE (`/api/quizzes/:id/submit`)
  │
  ├── Server-Side Answer Key Evaluation
  ├── Score & Accuracy Calculation
  ├── D1 `quiz_results` Persistence
  │
  ▼
WEAKNESS ENGINE & REVISION LOOP
  │
  ├── Curriculum Sub-topic Accuracy Mapping (`curriculum_nodes`)
  ├── Flag Weak Topics (< 60% Accuracy)
  └── 1-Click Link to KeyDocs 3.0 Study Notes & PYQ Solutions
```

---

## 💡 Architecture Guarantees
* **Server Authority**: Test scores are calculated server-side from answer keys; client-submitted scores are ignored.
* **Single Question Instance**: Imported PYQ questions retain their canonical `document_id` link without duplication.
