# KeyDocs 3.0 Production Rollout Plan

This document outlines the step-by-step rollout sequence for deploying **KeyDocs 3.0** on **ShikshaSahayak 2.0**.

---

## 🚀 Rollout Sequence

### 1. Pre-Deployment Phase
- **Step 1.1**: Trigger manual D1 production database snapshot via `wrangler d1 backup create DB`.
- **Step 1.2**: Inspect snapshot integrity and verify restore capability.
- **Step 1.3**: Execute `npm run keydocs:audit` locally to ensure 0 pre-existing database integrity warnings.

### 2. Deployment Phase
- **Step 2.1**: Apply D1 migration `066_keydocs_3_architecture.sql` and `067_keydocs_legacy_cleanup.sql`.
- **Step 2.2**: Deploy Cloudflare Pages production bundle (`npm run deploy`).
- **Step 2.3**: Verify deployment pipeline exit code 0.

### 3. Post-Deployment Verification Phase
- **Step 3.1**: Query `/api/health/keydocs` health-check endpoint.
- **Step 3.2**: Execute Smoke Test suite across Student UI (`/pyqs`, `/materials`, `/syllabus`) and Admin CMS (`/admin/academic`).
- **Step 3.3**: Verify R2 document preview and PDF download flows.

### 4. Rollback Phase (If Triggered)
- **Step 4.1**: Redeploy previous Pages git release tag if application regression occurs.
- **Step 4.2**: Execute D1 backup restore if data integrity anomaly occurs.
