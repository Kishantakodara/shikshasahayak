# ShikshaSahayak 2.0 Admin & Identity Auth Architecture

This document presents the complete architectural pipeline for Authentication, Provisioning, Role Resolution, Route Authorization, and API Entitlements.

---

## 🏛️ End-to-End Auth Pipeline Diagram

```text
FIREBASE AUTHENTICATION (Client Sign-In)
          │
          ▼
FIREBASE ID TOKEN (Bearer Token)
          │
          ▼
   AUTHCONTEXT (Frontend State)
          │
          ▼
FETCH `/api/auth/profile`
          │
          ▼
BACKEND TOKEN VERIFICATION (`jose.jwtVerify`)
          │
          ▼
   `unified_users` LOOKUP / AUTO-SYNC
          │
          ▼
CANONICAL ROLE RESOLUTION (`admin` | `teacher` | `student`)
          │
          ▼
FRONTEND ROUTE GUARD (`AdminRoute` / `TeacherRoute` / `StudentRoute`)
          │
          ▼
PROTECTED API CALL (`fetchWithAuth` + Bearer Header)
          │
          ▼
D1 DATABASE OPERATION (`/api/admin/*`, `/api/teacher/*`)
```

---

## 🔒 Separation of Concepts Matrix

| Concept | Primary Authority | Identifier / Column | Purpose |
| :--- | :--- | :--- | :--- |
| **A. Authentication** | Firebase Authentication | `auth.currentUser.uid` / ID Token | Cryptographically proves identity |
| **B. Account Provisioning** | D1 `unified_users` Table | `unified_users.uid` | Synchronizes user profile row |
| **C. Role Resolution** | D1 `unified_users.user_type` | `'admin'`, `'teacher'`, `'student'` | Controls portal route & API authorization |
| **D. Feature Entitlements** | D1 `teacher_whitelist` & `user_beta_access` | `is_beta_tester`, `whitelisted` | Controls specific feature availability |

---

## 🛡️ Unified Admin Route Guard Rules
A user is granted access to the Admin Portal (`/AyushAn0607/dashboard`) if:
1. `currentUser.role` resolves to `'Admin'`, `'admin'`, or `'super_admin'`, OR
2. `currentUser.email` matches an authorized admin email or domain (`@shikshasahayak.org`).
