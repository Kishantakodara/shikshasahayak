# ShikshaSahayak 2.0 Ecosystem Global Route Audit

This document records the global route audit conducted across `src/App.tsx`, route guards, layout shells, and API dependencies.

---

## 📊 Global Route Audit Matrix

| Route Path | Target Role | Route Guard Component | Layout Shell | Primary API Dependency | Operational Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/` | Public / All | None | `<Layout>` | `/api/academic/universities` | **OPERATIONAL** |
| `/resources` | Public / All | None | `<Layout>` | `/api/search` | **OPERATIONAL** |
| `/resources/:type/:branch/semester/:sem/:subject` | Public / All | None | `<Layout>` | `/api/academic/subjects/:id` | **OPERATIONAL** |
| `/materials/:id` | Public / All | None | `<Layout>` | `/api/documents/:id` | **OPERATIONAL** |
| `/login` | Public | None | `<Layout>` | Firebase Auth | **OPERATIONAL** |
| `/register` | Public | None | `<Layout>` | Firebase Auth | **OPERATIONAL** |
| `/student` | Student | `<StudentRoute>` | `<DashboardShell>` | `/api/auth/profile` | **OPERATIONAL** |
| `/student/library` | Student | `<StudentRoute>` | `<DashboardShell>` | `/api/user/bookmarks` | **OPERATIONAL** |
| `/student/downloads` | Student | `<StudentRoute>` | `<DashboardShell>` | `/api/assets/:id` | **OPERATIONAL** |
| `/student/career` | Beta Student | `<StudentRoute>` + `<BetaGuard>` | `<DashboardShell>` | `/api/v1/user/beta-status` | **OPERATIONAL** |
| `/teacher/login` | Public | None | `<Layout>` | Firebase Auth | **OPERATIONAL** |
| `/teacher` | Teacher | `<TeacherRoute>` | `<DashboardShell>` | `/api/teacher/profile` | **OPERATIONAL** |
| `/teacher/classes` | Teacher | `<TeacherRoute>` | `<DashboardShell>` | `/api/teacher/classes` | **OPERATIONAL** |
| `/teacher/materials` | Teacher | `<TeacherRoute>` | `<DashboardShell>` | `/api/teacher/materials` | **OPERATIONAL** |
| `/AyushAn0607` | Admin | None | `<Layout>` | Firebase Auth | **OPERATIONAL** |
| `/AyushAn0607/dashboard` | Admin | `<AdminRoute>` | `<AdminLayout>` | `/api/admin/metrics` | **OPERATIONAL** |

---

# ROUTE AUDIT DECISION

### **0 DEAD ROUTES / 0 REDIRECT LOOPS**
All routes are backed by lazy-loaded page components with fallback loaders and proper guard wrapping.
