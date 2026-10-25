# KeyDocs 3.0 Rollback Plan & Incident Protocols

This document details recovery procedures for handling production deployment failures or unexpected regressions.

---

## 🚨 Rollback Scenarios & Recovery Matrix

| Scenario | Trigger Condition | Primary Recovery Action | Secondary Recovery Action | Target Recovery Time |
| :--- | :--- | :--- | :--- | :--- |
| **A. Application Build / Pages Error** | 500 errors or white page on web client | Roll back Cloudflare Pages release to previous deployment tag | Clear Cloudflare edge cache (`Purge Everything`) | < 5 Minutes |
| **B. API Regression** | Health check `/api/health/keydocs` reports `degraded` | Revert Worker function code to pre-release commit | Verify Worker bindings in `wrangler.toml` | < 10 Minutes |
| **C. Database Migration Anomaly** | D1 migration error during rollout | Revert application code to pre-migration release | Execute D1 backup restore if data corrupt | < 15 Minutes |
| **D. R2 Storage Link Issue** | PDF preview / download failures | Verify R2 bucket binding & cors headers | Run `npm run keydocs:audit` to repair asset links | < 10 Minutes |

---

## 🔒 Rollback Principle
Always prefer **Application Code Rollback** before attempting **Database Rollback** to prevent potential user data loss.
