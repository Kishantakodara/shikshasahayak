# ShikshaSahayak 2.0 Phase E Observability Inventory

This document details the telemetry, event vocabulary, logging coverage, and privacy standards audited across the platform.

---

## 📊 Telemetry & Audit Inventory Matrix

| Metric Domain | Collector Source | Primary Target Table / Service | Privacy Scope | Coverage Status |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication Events** | `AuthContext.tsx` | `unified_users.last_login_at` | Anonymous UID | **EXISTS** |
| **Student Page Visits** | `adminPlatformClient.ts` | Edge Analytics Counter | Aggregated Count | **EXISTS** |
| **Document Downloads** | `/api/assets/:id` | `documents.downloads` + Asset Log | Anonymous Doc ID | **EXISTS** |
| **Document Views** | `/api/documents/:id` | `documents.views` | Anonymous Doc ID | **EXISTS** |
| **Search Queries** | `ResourcesHub.tsx` | Edge Search Telemetry | Sanitized Query String | **EXISTS** |
| **Admin Audit Trail** | `recordAdminAuditLog()` | D1 `admin_audit_logs` | Admin ID & Action | **EXISTS** |
| **System Health** | `/api/health/keydocs` | Workers Edge Health Endpoint | Service Uptime | **EXISTS** |
| **User Feedback** | `Feedback.tsx` | D1 `bug_reports` / Feedback | User Provided | **EXISTS** |

---

## 🔒 Privacy & Data Retention Mandate
1. **Zero Credential Logging**: Passwords, ID Tokens, Firebase Secrets, and R2 signed URLs are never written to logs or telemetry tables.
2. **Non-Blocking Telemetry**: All client-side telemetry events execute asynchronously in background tasks without blocking UI rendering or navigation.
