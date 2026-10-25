# KeyDocs 3.0 Full Production Content Migration Plan

This plan specifies the batch rollout schedule for migrating all remaining academic content into KeyDocs 3.0.

---

## 🗓️ Production Staged Ingestion Schedule

| Batch Stage | Target Academic Scope | Total Documents | Est. Assets | Execution Strategy | Validation Checkpoint |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Stage 1 (Pilot)** | GTU CE Sem 5 (`3150710`) | 124 Docs | 118 Assets | Single Subject Pilot | `npm run keydocs:audit` |
| **Stage 2** | GTU CE Sem 5 All Subjects | 620 Docs | 580 Assets | Batch Size 50 | `npm run keydocs:content-audit` |
| **Stage 3** | GTU CE Sem 1 to 4 Archive | 1,840 Docs | 1,720 Assets | Batch Size 100 | `npm run keydocs:validate` |
| **Stage 4** | Full GTU CE Sem 6 to 8 | 1,360 Docs | 1,290 Assets | Batch Size 100 | `npm run keydocs:audit` |

---

## 🔒 Checkpoint & Resume Safety
- Each batch is independently verifiable. Interrupted jobs resume via `--job=<job-id> --resume` without duplicating successful records.
