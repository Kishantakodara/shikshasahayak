# TASK 7 — BACKUP & DISASTER RECOVERY STRATEGY
- **D1 Database Point-in-Time Recovery:** Automated daily D1 backups enabled via Cloudflare D1 management console.
- **R2 Storage Durability:** 99.999999999% (11 9s) annual durability across multi-location Cloudflare storage.
- **Rollback Runbook:** Execute `npx wrangler pages deployment list` and `npx wrangler pages deployment rollback <deployment-id>`.
