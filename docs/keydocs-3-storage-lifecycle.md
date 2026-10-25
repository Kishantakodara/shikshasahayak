# KeyDocs 3.0 Storage & Asset Lifecycle

This document defines the lifecycle, reference counting, and physical R2 safety rules for file assets in KeyDocs 3.0.

---

## 🔄 File Lifecycle Flow

```text
1. File Upload (Admin / Contributor)
       │
       ▼
2. SHA256 Content Hash Calculation
       │
       ▼
3. Check Physical Assets Registry (`assets`)
       ├── If Hash Exists: Reuse Existing Asset ID (Deduplication)
       └── If Hash Missing: Register New Physical Asset & Upload to R2
       │
       ▼
4. Map Logical Attachment in `document_files`
       │
       ▼
5. Document Replacement / Deletion Event
       │
       ▼
6. Safe Orphan Protection (`releaseFileAssetIfOrphaned`)
       ├── Count Active `document_files` References
       ├── If Reference Count > 0: Retain R2 Storage Object & Asset Row
       └── If Reference Count == 0: Safe Deletion of R2 Storage Object
```

---

## 🔒 Safety Guarantees
- Deleting a document removes its logical attachment in `document_files`, but physical R2 deletion ONLY occurs when `getFileAssetRefCount(hash) === 0`.
- Replacing a file on one document will not delete the underlying asset if another document points to the same SHA256 content hash.
