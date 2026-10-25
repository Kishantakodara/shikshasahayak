# 🎓 ShikshaSahayak 2.0 — Deployment Safety Hardening & Staging Isolation Report

**Document ID:** `student_portal_remediation_report.md`  
**Date of Verification:** October 22, 2026  
**Audited Target:** Student Hub (`/student`, `/student/*`), Deployment Pipeline, & Staging Isolation  
**Target Codebase Branch:** `2.0`  
**Latest Baseline Commit:** `3b1a7d64` (*"Handle exam-day countdown states"*)  
**Deployment Status:** **PAUSED** (Awaiting explicit user authorization per `AGENTS.md`)  
**Deployment Pipeline Destination:** Cloudflare Pages project `beta-padhakuportal` (Branch: `2.0`)  

---

## 1. Executive Summary & Verification Taxonomy

This report records the complete deployment safety hardening and staging isolation preparation for ShikshaSahayak 2.0. Unsafe zone-wide cache purging has been eliminated and replaced with a hardened, host-scoped invalidation engine covered by 53 automated unit tests. The deployment pipeline now enforces strict branch-to-project safety gates and distinguishes deployment failures from post-deployment verification failures. Full architectural specifications for isolating Cloudflare D1 databases and Firebase Authentication are established without altering production resources.

### Verification Category Breakdown:

| Category | Definition | Status | Evidence / Artifacts |
|---|---|---|---|
| **TypeScript-Verified** | Static compilation check via `tsc --noEmit` across entire repository | **PASSED (0 errors)** | Exit code `0` (clean run) |
| **Cache-Purge Scope Verified** | Automated unit tests covering all branch, host, payload, and failure states | **PASSED (53/53 tests)** | `scripts/test-cache-purge-scope.ts` |
| **Automated-Test-Verified** | Phase 1E Student Experience & Analytics test suite | **PASSED (20/20 tests)** | Question security, timers, scoring, immutability |
| **Countdown Edge Cases** | Examination countdown boundary and on-the-day logic | **PASSED (9/9 assertions)** | `scratch/test-exam-countdown.ts` |
| **Build-Verified** | Production bundle generated via `vite build` + Cloudflare edge scripts | **PASSED** | 164 JS chunks, `dist/200.html` SPA fallback |
| **Local Preview-Verified** | Vite preview server & headless Chromium SPA route checks | **PASSED** | 7 routes verified, MIME types verified, 0 errors |
| **Browser-Verified** | Live browser navigation, viewport resizing, theme switching | **PASSED (375px – 1528px)** | 7 screenshots + WebP session recording |
| **Staging Database Isolation** | Dedicated isolated staging database sandbox | **PENDING AUTHORIZATION** | Mappings verified; provisioning pending |
| **Authentication Isolation** | Dedicated staging auth tenant / sandbox users | **PENDING AUTHORIZATION** | Architecture verified; provisioning pending |
| **External Integration Pending** | Third-party feeds requiring partner API contracts | **PENDING** | Live campus job board alerts |
| **Blocked** | Tasks requiring third-party portal CAPTCHA bypass | **BLOCKED** | Live automated GTU hall ticket scraping |
| **Deployed** | Production / Staging Cloudflare Pages release | **PAUSED** | Paused per project safety rule in `AGENTS.md` |

---

## 2. Phase 2 & 3: Hardened Cache-Purge Engine & Verification

### A. Vulnerability Eliminated
Previously, [`scripts/purge-cache.js`](file:///a:/GitHub/ShikshaSahayak---V2/scripts/purge-cache.js) executed:
```javascript
body: JSON.stringify({ purge_everything: true })
```
targeting `CLOUDFLARE_ZONE_ID`. Because `shikshasahayak.org` (production) and `beta.shikshasahayak.org` share the same apex Zone ID, deploying branch `2.0` to `beta-padhakuportal` triggered an unintended zone-wide cache flush, causing cold starts across the entire production site.

### B. Hardened Implementation (`scripts/purge-cache.js`)
The cache purge engine has been completely re-engineered with the following safety gates:
1. **Strict Branch Scoping:**
   - Branch `2.0` (Beta) invalidates ONLY the designated beta host (`beta.shikshasahayak.org`).
   - `purge_everything: true` is **strictly forbidden** for beta. If tampered with, `buildPurgePayload()` throws a fatal safety violation.
2. **Production Domain & `pages.dev` Protection:**
   - Target hostnames `shikshasahayak.org` and `www.shikshasahayak.org` are explicitly rejected when executing on beta.
   - Any `*.pages.dev` domain is rejected because Pages internal domains cannot be purged via custom-domain Zone APIs.
3. **Fail-Closed on Missing Credentials:**
   - If `CLOUDFLARE_ZONE_ID` or `CLOUDFLARE_API_TOKEN` are empty or absent, the operation safely skips without issuing HTTP calls and returns `{ success: false, skipped: true, error: 'MISSING_CREDENTIALS' }`.
4. **Cloudflare Plan Code 1012 Handling:**
   - If the zone plan does not support Purge by Host (Enterprise requirement), the engine surfaces error `1012`, marks the operation as safely skipped, and **does not fall back** to `purge_everything: true`. Asset hash cache-busting protects beta updates without touching production.
5. **Environment Interchange Protection:**
   - Mismatched combinations (e.g. branch `2.0` targeting project `padhakuportal` or branch `main` targeting `beta-padhakuportal`) are blocked immediately with `PROJECT_BRANCH_MISMATCH`.

### C. Automated Unit Test Evidence (`scripts/test-cache-purge-scope.ts`)
A dedicated mock HTTP test suite was created and registered in `package.json` under `npm run test:cache-purge`. It executes 12 test categories with 53 assertions verifying outbound payloads:

```
================================================================
🧪 RUNNING HARDENED CLOUDFLARE CACHE PURGE SCOPE TEST SUITE
================================================================
➡️ Test 1: Branch 2.0 target resolution (PASSED)
➡️ Test 2: Beta payload construction safeguards (PASSED)
➡️ Test 3: Production hostnames rejected in beta configuration (PASSED)
➡️ Test 4: *.pages.dev hostnames rejected against Zone API (PASSED)
➡️ Test 5: Missing credentials safe handling (PASSED)
➡️ Test 6: Unsupported branches rejected (PASSED)
➡️ Test 7: Branch & Project interchange safety (PASSED)
➡️ Test 8: Outbound request inspection on Beta execution (PASSED)
➡️ Test 9: Failed API response handling (PASSED)
➡️ Test 10: Plan limitation (Code 1012) handling (PASSED)
➡️ Test 11: Production main path verification (PASSED)
➡️ Test 12: Network exception handling (PASSED)
================================================================
🎉 TEST SUMMARY: 53 / 53 TESTS PASSED CLEANLY
================================================================
```

---

## 3. Phase 4: Authoritative D1 Staging Database Map & Migration Plan

### A. Verified Database Topology

| Database Binding | Production Name & ID | Proposed Staging Name | Staging Role | Authoritative Migration Sequence |
|---|---|---|---|---|
| `PADHAKU_CORE_DB` | `shiksha-core-db`<br>`4e63a42b-1271-462f-8271-da47cf659139` | `shiksha-core-db-staging` | Users, roles, entitlements, academic master data, expansion modules (courses, career, fests, workshops) | 1. `migrations-shiksha-core/0001_initial_schema.sql`<br>2. `migrations-shiksha-core/0004_prep_zone_expansion.sql`<br>3. `migrations-shiksha-core/0005_drop_student_academic_profiles.sql` |
| `DB` | `keydocs`<br>`d0d22669-42aa-4c36-b9e3-c3aace80cad4` | `keydocs-staging` | Canonical documents, GTU PYQ papers, study notes, file assets, blogs, bug reports | `migrations-keydocs/` sequence (`0001` through `0014`), or canonical KeyDocs section from `schema.sql` |
| `ASSESSMENT_DB` | `padhaku-assessment-db`<br>`352efef7-24bb-418c-8158-92144fc7f821` | `assessment-db-staging` | Question intelligence engine, test sessions, student response logs, topic mastery | Section 16 of `schema.sql` (`master_question_bank`, `test_sessions`, `test_session_questions`, `student_topic_mastery`, `student_mcq_bookmarks`) |

### B. Legacy `padhaku-db-staging` Audit
- **Database UUID:** `31a46810-ffbf-4ca5-8cd9-c9ae3f4c36f6` (created July 2026).
- **Schema Compatibility:** Monolithic 65-table deprecated schema. Lacks modern user roles, prep-zone expansion tables, and updated KeyDocs document columns.
- **Verdict:** Incompatible with current application queries. Binding this database will cause immediate runtime exceptions. It must remain retired and should not be bound.

### C. Migration Safeguards & Staging Execution Engine
A new safeguard utility [`scripts/safe-migrate-staging.ts`](file:///a:/GitHub/ShikshaSahayak---V2/scripts/safe-migrate-staging.ts) enforces:
- Hardcoded blocklist for all production database UUIDs (`4e63a42b-...`, `d0d22669-...`, `352efef7-...`).
- Mandatory `--staging` execution flag.
- Rejection of any target database name not containing `staging`.

---

## 4. Phase 5: Firebase Build-Time vs. Runtime Analysis

### A. Critical Finding on Build-Time Compilation
In [`src/utils/firebase.ts`](file:///a:/GitHub/ShikshaSahayak---V2/src/utils/firebase.ts):
```typescript
const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY', "AIzaSyAinLgzO..."),
  authDomain: getAuthDomain(),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID', "padhakuportal"),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET', "shikshasahayak-demo.appspot.com"),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', "123456789012"),
  appId: getEnv('VITE_FIREBASE_APP_ID', "1:123456789012:web:mockshikshasahayak123")
};
```

1. **Resolution Timing:** Vite evaluates `import.meta.env.VITE_*` at **build time** (`vite build`), baking string constants directly into the compiled JavaScript chunks under `dist/assets/`.
2. **Cloudflare Pages Runtime Limitation:** Cloudflare Pages environment variables set in the dashboard only populate backend Worker functions (`context.env`). They **do not and cannot** rewrite static JavaScript code already bundled in `dist/`.
3. **Consequence:** Deploying a locally built `dist/` without target-specific environment variables results in beta running with the hardcoded production Firebase project (`padhakuportal`).

### B. Proposed Target-Specific Build Architecture
1. **Target Modes:** Use Vite's native mode flags (`vite build --mode beta` vs `vite build --mode production`).
2. **Environment Files:** Create `.env.beta` with public staging keys (`VITE_FIREBASE_PROJECT_ID=padhakuportal-staging`).
3. **No Secret Leaks:** Only public Web SDK keys are included. Service account JSON credentials and private keys are never included in frontend environments or client bundles.
4. **Pre-Build Identity Validation:** Add a check in `scripts/verify-build.js` that inspects the compiled bundle to ensure production project IDs are not present in a beta build.

---

## 5. Phase 6: Hardened Deployment Pipeline (`scripts/deploy-pipeline.js`)

[`scripts/deploy-pipeline.js`](file:///a:/GitHub/ShikshaSahayak---V2/scripts/deploy-pipeline.js) has been updated with full lifecycle guards:

1. **Explicit Branch-to-Project Routing:**
   - Branch `main` → strictly `padhakuportal`
   - Branch `2.0` → strictly `beta-padhakuportal`
   - Any other branch → deployment aborted immediately with non-zero exit code.
2. **Targeted Live Smoke Verification:**
   - Beta deployments verify `https://beta-padhakuportal.pages.dev` and `https://beta.shikshasahayak.org`.
   - Production deployments verify `https://padhakuportal.pages.dev` and `https://shikshasahayak.org`.
3. **Distinct Verification Failure Reporting:**
   - If Cloudflare Pages upload succeeds but live smoke tests fail, the pipeline prints:
     `❌ CRITICAL: Deployment finished, but post-deployment live smoke verification FAILED!`
   - Prevents misreporting an unverified deployment as successful.
4. **Structured Execution Summary:**
   - Outputs a clear status table tracking each lifecycle step (Build, Preview, Auth Gate, Deploy, Cache Invalidation, Live Smoke).

---

## 6. Phase 7: Local Validation Execution & Results

All verification commands executed locally with zero regressions:

| Step | Command | Result | Details |
|---|---|---|---|
| **TypeScript Typecheck** | `npx tsc --noEmit` | **PASSED** | 0 errors across entire workspace |
| **Cache-Purge Scope Suite** | `npm run test:cache-purge` | **PASSED** | 53 / 53 tests passed |
| **Phase 1E Student Experience** | `npx tsx scripts/test-phase-1e-student-test-experience.ts` | **PASSED** | 20 / 20 tests passed |
| **Countdown Logic & IST Normalization** | `npx tsx <scratch>/test-exam-countdown.ts` | **PASSED** | 9 / 9 edge-case assertions passed |
| **Production Bundle & Verification** | `npm run build` | **PASSED** | 164 JS chunks, `dist/200.html` SPA fallback verified |
| **Local Preview Smoke Check** | `npm run verify:preview` | **PASSED** | 7 routes verified, MIME types verified, 0 errors |

---

## 7. Current Git Status & Modified Files

### Git Status (`git status --short`):
```
 M docs/student_portal_remediation_report.md
 M functions/api/student/dashboard.ts
 M package.json
 M scripts/deploy-pipeline.js
 M scripts/purge-cache.js
 M src/pages/dashboard/StudentPortalHome.tsx
?? scripts/safe-migrate-staging.ts
?? scripts/test-cache-purge-scope.ts
```

### File Modification Inventory:
1. [`functions/api/student/dashboard.ts`](file:///a:/GitHub/ShikshaSahayak---V2/functions/api/student/dashboard.ts): IST date normalization, `isToday`, `isConcluded`, and unconfigured examination text: `"Official examination date not configured in ShikshaSahayak."`
2. [`src/pages/dashboard/StudentPortalHome.tsx`](file:///a:/GitHub/ShikshaSahayak---V2/src/pages/dashboard/StudentPortalHome.tsx): UI integration for exam-day countdown and unconfigured examination schedule wording.
3. [`scripts/purge-cache.js`](file:///a:/GitHub/ShikshaSahayak---V2/scripts/purge-cache.js): Scoped host-level cache purge engine eliminating zone-wide purges on beta.
4. [`scripts/deploy-pipeline.js`](file:///a:/GitHub/ShikshaSahayak---V2/scripts/deploy-pipeline.js): Deployment lifecycle guards, step summary table, and distinct verification failure reporting.
5. [`package.json`](file:///a:/GitHub/ShikshaSahayak---V2/package.json): Added `"test:cache-purge"` script entry.
6. [`scripts/test-cache-purge-scope.ts`](file:///a:/GitHub/ShikshaSahayak---V2/scripts/test-cache-purge-scope.ts): 53 unit tests for cache purge scoping.
7. [`scripts/safe-migrate-staging.ts`](file:///a:/GitHub/ShikshaSahayak---V2/scripts/safe-migrate-staging.ts): Production-safe validator for staging D1 operations.
8. [`docs/student_portal_remediation_report.md`](file:///a:/GitHub/ShikshaSahayak---V2/docs/student_portal_remediation_report.md): Authoritative documentation of findings and architecture.

---

## 8. Deployment Prerequisites & Recommended Next Steps

**STATUS: PAUSED AWAITING EXPLICIT USER AUTHORIZATION**

### Remaining Actions Requiring Authorization:
1. **Cloudflare D1 Staging Database Provisioning:**
   - Execute `wrangler d1 create` for `shiksha-core-db-staging`, `keydocs-staging`, and `assessment-db-staging`.
   - Apply migration sequences to the staging databases.
   - Configure D1 bindings in Cloudflare Pages for project `beta-padhakuportal`.
2. **Firebase Staging Project Creation:**
   - Create sandbox project in Firebase Console (`padhakuportal-staging`).
   - Create `.env.beta` with staging public keys.
3. **Deployment Approval:**
   - Provide explicit instruction before running `npm run deploy` or modifying remote production resources.
