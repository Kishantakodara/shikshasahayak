# ShikshaSahayak 2.0 Post-Launch Operations & Maintenance Runbook

This document details daily health checks, weekly telemetry generation, backup drills, and rollback procedures.

---

## 🛠️ Daily & Weekly Operational Workflows

1. **Daily Non-Destructive Health Check**:
   ```bash
   npm run ops:health
   ```
2. **Weekly Production Telemetry Report**:
   ```bash
   npm run ops:report
   ```
3. **Database & Platform Audit**:
   ```bash
   npm run platform:audit && npm run platform:verify
   ```
4. **Cloudflare Cache Purge**:
   ```bash
   node scripts/purge-cache.js
   ```

---

# OPERATIONAL STATEMENT
Operations health checks and telemetry reports execute non-destructively on live Cloudflare Workers without blocking user requests.
