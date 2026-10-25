# KeyDocs 3.0 Post-Deployment Monitoring Strategy

This document outlines the monitoring rules, alert thresholds, and operational actions for post-deployment observation.

---

## 📈 Metric Thresholds & Alert Protocols

| Metric | Expected Behavior | Warning Condition | Critical Condition | Operational Action |
| :--- | :--- | :--- | :--- | :--- |
| **API 5xx Error Rate** | < 0.1% | > 1% over 5 minutes | > 5% over 5 minutes | Inspect Cloudflare Worker logs; trigger rollback if widespread |
| **Health Check `/api/health/keydocs`** | HTTP 200 (`status: "ok"`) | `status: "degraded"` | HTTP 503 (`status: "error"`) | Check D1 database binding & connection pool status |
| **File Upload Failure Rate** | 0% | > 2 failures in 1 hour | > 5 failures in 1 hour | Check R2 storage permissions, credentials, and CORS settings |
| **PDF Download Failures** | 0% | > 3 failures in 1 hour | > 10 failures in 1 hour | Run `npm run keydocs:audit` to verify `assets` table links |

---

## 🔒 Post-Deployment Checklist
- Monitor Cloudflare Pages & Workers dashboard logs for 24 hours post-deployment.
- Execute daily automated `npm run keydocs:audit` cron job.
