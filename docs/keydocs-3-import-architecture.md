# KeyDocs 3.0 Import Architecture Specification

This document defines the 10-stage bulk content ingestion architecture for KeyDocs 3.0.

---

## 🏗️ 10-Stage Ingestion Pipeline Architecture

```text
INPUT (Files / JSON / Seed Batches)
  │
  ▼
1. DISCOVERY (Extract Candidates)
  │
  ▼
2. PARSING (Raw Attribute Extraction)
  │
  ▼
3. NORMALIZATION (Season: 'SUMMER' ➔ 'S', Kind: 'Notes' ➔ 'notes')
  │
  ▼
4. ACADEMIC MATCHING (Subject Code / ID / Slug Lookup)
  │
  ▼
5. DUPLICATE DETECTION (SHA256 Content Hash + Metadata Key)
  │
  ▼
6. VALIDATION (Required Attributes & Constraints Guard)
  │
  ▼
7. DRY RUN EVALUATION (Simulation Without DB Mutation)
  │
  ▼
8. BATCH CANONICAL WRITE (Thin `documents` + Type Metadata)
  │
  ▼
9. PHYSICAL ASSET DEDUPLICATION (R2 Hash Lookup & `document_files` Link)
  │
  ▼
10. POST-IMPORT VERIFICATION (`npm run keydocs:audit`)
```

---

## 🔒 Engine Guarantees
- **Idempotency**: Running the import command twice results in zero duplicate documents or physical assets.
- **Resumability**: Jobs track progress so interrupted imports resume from the last successful record index.
