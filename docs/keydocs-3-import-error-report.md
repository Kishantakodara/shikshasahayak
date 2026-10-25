# KeyDocs 3.0 Import Error Classification & Handling Specification

This document details error codes, recovery strategies, and retry policies during bulk content ingestion.

---

## 🚨 Error Classification & Recovery Protocols

| Error Code | Error Category | Root Cause Explanation | Retryable | Recovery Action |
| :--- | :--- | :--- | :--- | :--- |
| **`ACADEMIC_MATCH_ERROR`** | Subject Resolution | Subject code or ID not found in `subjects` table | **No** | Flag record for Admin Manual Review queue |
| **`DUPLICATE_ERROR`** | Ingestion Guard | Exact content hash + metadata key match detected | **No** | Skip physical upload; mark as `EXACT_DUPLICATE` |
| **`FILE_READ_ERROR`** | File Pipeline | Missing file or invalid byte stream | **Yes** | Retry file fetch from source repository |
| **`VALIDATION_ERROR`** | Schema Guard | Missing required fields (e.g. missing title) | **No** | Reject candidate and record validation error message |
| **`STORAGE_ERROR`** | Physical Storage | R2 upload timeout or credential failure | **Yes** | Exponential backoff retry |

---

## 🔒 Safety Policy
Partial batch failures do not corrupt successful records. Failed candidates are logged with human-readable error messages for review.
