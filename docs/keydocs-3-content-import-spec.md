# KeyDocs 3.0 Content Import Specification & Pipeline Architecture

This document defines the standardized content ingestion pipeline for importing academic materials into KeyDocs 3.0.

---

## 🏗️ Content Import Pipeline Flow

```text
INPUT (JSON / CSV / ZIP Payload)
  │
  ▼
1. Input Validation & Schema Guard
  │
  ▼
2. University, Branch & Subject Resolution
  │
  ▼
3. Curriculum Node Matching / Auto-Creation
  │
  ▼
4. Duplicate Detection (Identity + Content Hash)
  ├── EXACT DUPLICATE: Skip Ingestion (Idempotent)
  └── UNIQUE: Proceed to Ingestion
  │
  ▼
5. Register Physical Asset (`assets` by SHA256)
  │
  ▼
6. Create Thin Core Document (`documents` + Type Metadata)
  │
  ▼
7. Attach Logical File (`document_files`)
  │
  ▼
8. Initialize Engagement Stats (`document_stats`)
  │
  ▼
9. Publish & Return Canonical Document Payload
```

---

## 🔒 Idempotency Guarantee
Running the import script multiple times on the same input payload will return the existing document records without creating duplicate physical R2 assets or duplicate D1 rows.
