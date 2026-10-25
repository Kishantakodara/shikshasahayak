# ShikshaSahayak 2.0 Canonical Identity Architecture & User Lifecycle

This document defines the canonical user identity model and state transition lifecycle.

---

## 🏛️ Canonical Identity Flow Blueprint

```text
AUTHENTICATION ➔ IDENTITY RECONCILIATION ➔ USER RECORD ➔ ROLE ➔ PROFILE / ENTITLEMENT ➔ ROUTE ➔ API ➔ FEATURE ACCESS
```

---

## 📊 Database Responsibilities Matrix

| Database Structure | Architectural Responsibility | Primary Identifier | Immutable / Mutable |
| :--- | :--- | :--- | :--- |
| `unified_users` | Core identity, role, and active account status | `uid` (Firebase UID) | Mutable by Admin |
| `teacher_whitelist` | Authorization email list for teacher provisioning | `email` (Normalized) | Mutable by Admin |
| `teacher_profiles` | Teacher-specific institution and subject details | `uid` (Firebase UID) | Mutable by Teacher |
| `user_beta_access` | Beta feature entitlements and grant timestamps | `uid` (Firebase UID) | Mutable by Admin |
| `admin_audit_logs` | Immutable history of all user access mutations | `id` (Auto Increment) | Immutable |

---

# ARCHITECTURAL GUARANTEE
Frontend role assertions are never authoritative; all authorization decisions are re-evaluated on Cloudflare Edge Workers via `resolveAuthenticatedUser()`.
