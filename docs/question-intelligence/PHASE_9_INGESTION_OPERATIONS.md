# Phase 9: GTU Question Intelligence Expansion & Ingestion Operations
**ShikshaSahayak 2.0 Academic Engine Documentation**
*Date: August 2026* | *Branch: `2.0`*

---

## 1. Overview & Architecture

Phase 9 operationalizes the certified Question Intelligence Engine into a scalable, auditable, and resumable historical GTU Question Bank ingestion platform for First-Year Engineering curriculum across 13 engineering streams.

```mermaid
flowchart TD
    A[GTU Academic Catalog\n10 Common Subjects] --> B[GTU Session Discovery\nW2024, S2024, W2023, S2023, W2022]
    B --> C[Canonical URL Builder\nhttps://gtu.ac.in/uploads/SESSION/BE/CODE.pdf]
    C --> D[HTTP Availability & PDF Binary Validation]
    D --> E[PDF Extractor & Segmentation Engine]
    E --> F[Nested Question Parser\nQ.1, Q.1(a)(i), Q.1(b), OR Q.2(a)]
    F --> G[Descriptive Question Preservation\ndetectedType: null, NO Fake MCQs]
    G --> H[Subject-Specific Validation\nMath, Physics, BEE, PPS, English]
    H --> I[Deduplication & Similarity Thresholding]
    I --> J[Question Ingestion Queue\nStaged / Pending State]
    J --> K[Authoritative Admin Moderation Gateway]
    K --> L[Verified Master Question Bank]
    L --> M[Student Delivery & Answer-Shielded DTO]
```

---

## 2. Ingestion Lifecycle & Quality States

A question travels strictly through these discrete, non-collapsing quality states:

```
EXTRACTED → NORMALIZED → CLASSIFIED → VALIDATED → DUPLICATE_CHECKED → STAGED → MODERATION → VERIFIED
```

- **Extraction**: Reads raw PDF text stream, verifies `%PDF` magic bytes, and clamps page count ($\le 25$) and buffer size ($\le 15\text{MB}$).
- **Segmentation**: Splits text into distinct exam question blocks, preserving sub-parts (`Q.1(a)(i)`).
- **Classification**: Detects legitimate 4-option MCQs, MSQs, NAT numerical ranges, and preserves descriptive proofs as open-ended items.
- **Deduplication**: Computes token overlap (Jaccard) and flags near duplicates without deleting provenance.
- **Staging**: Enqueues into `question_ingestion_queue` with idempotency.
- **Moderation**: Admin single/bulk approval with authoritative D1 re-validation.
- **Student Delivery**: Delivers only verified questions; pre-submission DTO strictly shields answer keys and explanations.

---

## 3. Supported First-Year Subjects & Sessions

### Canonical Subjects
1. `3110014` — Mathematics - 1 (Sem 1)
2. `3110015` — Mathematics - 2 (Sem 2)
3. `3110005` — Basic Electrical Engineering (BEE) (Sem 1)
4. `3110003` — Programming for Problem Solving (PPS) (Sem 1)
5. `3110002` — English (Sem 1)
6. `3110018` — Physics (Sem 1)
7. `3110001` — Chemistry (Sem 1)
8. `3110006` — Basic Mechanical Engineering (BME) (Sem 1)
9. `3110004` — Elements of Civil Engineering (ECE) (Sem 1)
10. `3110013` — Engineering Graphics & Design (EGD) (Sem 1)

### Canonical Exam Sessions
- `W2024` — Winter 2024
- `S2024` — Summer 2024
- `W2023` — Winter 2023
- `S2023` — Summer 2023
- `W2022` — Winter 2022

---

## 4. Centralized Ingestion Bounds & Safety Limits

| Safety Invariant | Enforced Constant / Limit | Purpose |
|---|---|---|
| Max Papers per Ingestion Run | `MAX_PAPERS_PER_INGESTION_RUN = 20` | Worker CPU & memory execution bound |
| Max Questions per Batch | `MAX_QUESTIONS_PER_BATCH = 100` | Staging queue throttling |
| Max PDF Size | `MAX_PDF_SIZE_BYTES = 15 * 1024 * 1024` (15 MB) | Prevents Worker Out-Of-Memory (OOM) crashes |
| Max Page Count | `MAX_PDF_PAGE_COUNT = 25` | Prevents infinite parser loops on textbooks |
| Max Extracted Text | `MAX_EXTRACTED_TEXT_BYTES = 512 * 1024` (500 KB) | Memory buffer guard |
| Max Concurrency | `CONCURRENT_PAPER_FETCH_LIMIT = 3` | Subrequest rate-limit protection |
| Max Retry Count | `MAX_RETRY_COUNT = 3` | Prevents infinite retry storms on failed URLs |

---

## 5. Resumability & Retry Policy

- **Resumable State**: Stored in `gtu_paper_ingestion_tracker` (`COMPLETED`, `EXTRACTION_FAILED`, `AVAILABLE`, `DISCOVERED`).
- **Idempotency**: Papers marked `COMPLETED` are skipped automatically during repeated batch executions.
- **Failure Classification**:
  - **Retryable**: Temporary HTTP 5xx errors, timeouts, transient network faults (`retry_count < 3`).
  - **Non-Retryable**: HTTP 404 Not Found (unpublished exams), missing `%PDF` magic bytes, corrupted binaries.

---

## 6. Coverage & Observability Metrics

The operations service exports:
1. `getSubjectCoverageMetrics(env)`: Subject-wise breakdown of papers attempted/completed, questions, MCQs, MSQs, NATs, descriptive, verified, pending, and duplicates.
2. `getSessionCoverageMetrics(env)`: Session-wise discovery, completion, and question totals.
3. `getQuestionTypeBreakdown(env)`: Global distribution of MCQ, MSQ, NAT, and Descriptive items.
4. `getModerationPipelineMetrics(env)`: Staged queue count, pending review, verified, rejected, and archived.
5. `retryFailedIngestionPapers(env, options)`: Bounded retry processor for recoverable failed papers.
