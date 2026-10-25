# TASK 12 — PRODUCTION OPERATIONS RUNBOOK

### 1. Daily Monitoring Check
- Visit `https://padhakuportal.pages.dev/api/health` to verify DB, Storage, AI Gateway, and Worker status.

### 2. Emergency Rollback Protocol
```bash
# List recent production deployments
npx wrangler pages deployment list --project-name=padhakuportal

# Rollback to last known good deployment
npx wrangler pages deployment rollback <DEPLOYMENT_ID> --project-name=padhakuportal
```

### 3. D1 Database Snapshot Export
```bash
# Export remote production D1 database backup
npx wrangler d1 backup create DB
```
