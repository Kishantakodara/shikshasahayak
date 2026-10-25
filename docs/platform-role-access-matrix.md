# ShikshaSahayak 2.0 Ecosystem Role-Access Matrix

This document defines explicit capabilities, route guards, and backend authorization requirements across 5 distinct user roles.

---

## 📊 Role Capabilities & Authorization Matrix

| Feature / Subsystem | Anonymous | Student | Beta Student | Teacher | Admin / SuperAdmin |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Public Catalog & Notes** | **READ (200)** | **READ (200)** | **READ (200)** | **READ (200)** | **FULL READ / WRITE** |
| **Student Dashboard & Library** | **BLOCKED (401)** | **PASS (200)** | **PASS (200)** | **BLOCKED (403)** | **READ / PREVIEW** |
| **Protected Beta Features** | **BLOCKED (401)** | **BLOCKED (403)** | **PASS (200)** | **BLOCKED (403)** | **FULL ACCESS** |
| **Teacher Portal & Attendance**| **BLOCKED (401)** | **BLOCKED (403)** | **BLOCKED (403)** | **PASS (200)** | **OVERRIDE PREVIEW** |
| **Admin Portal (`/AyushAn0607`)**| **BLOCKED (401)** | **BLOCKED (403)** | **BLOCKED (403)** | **BLOCKED (403)** | **FULL ACCESS (200)** |
| **Admin APIs (`/api/admin/*`)**| **401 Unauthorized**| **403 Forbidden**| **403 Forbidden**| **403 Forbidden**| **200 OK** |
| **Teacher APIs (`/api/teacher/*`)**| **401 Unauthorized**| **403 Forbidden**| **403 Forbidden**| **200 OK** | **200 OK** |

---

## 🛡️ Route Guard Architecture
* **Anonymous Guard**: Redirects unauthenticated requests to `/login` or returns 401 Unauthorized.
* **`<StudentRoute>`**: Restricts `/student/*` routes to users with `role === 'student'`.
* **`<TeacherRoute>`**: Restricts `/teacher/*` routes to whitelisted educators (`role === 'teacher'`).
* **`<AdminRoute>`**: Restricts `/AyushAn0607/*` routes to authorized site admins (`role === 'admin'`).
* **`<BetaGuard>`**: Restricts experimental features to entitlements registered in `user_beta_access`.
