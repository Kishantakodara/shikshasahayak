# TASK 11 — TECHNICAL DEBT & CLEANUP RECOMMENDATIONS
- **Bundle Optimization:** Chunks larger than 300kB (`pdf.js`, `editor.js`) use dynamic `import()` code-splitting.
- **Unused Dependencies:** Clean npm package lockfile with exact version pinning.
- **Database Query Performance:** All foreign key queries utilize indexed columns (`idx_documents_university`, `idx_attempts_user_id`). Zero N+1 query patterns found.
