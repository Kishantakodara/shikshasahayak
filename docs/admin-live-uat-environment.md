# ShikshaSahayak 2.0 Admin Live UAT Environment Specification

This document records the exact live deployment environment parameters verified during Phase B Live User Acceptance Testing.

---

## 🌐 Production Environment Parameters

| Parameter | Deployed Production Configuration | Verification Evidence |
| :--- | :--- | :--- |
| **Production Domain** | `https://shikshasahayak.org` | Live Cloudflare Edge Routing |
| **Admin Portal Route** | `https://shikshasahayak.org/AyushAn0607/dashboard` | `<AdminRoute>` Guard Verified |
| **Teacher Portal Route** | `https://shikshasahayak.org/teacher/dashboard` | `<TeacherRoute>` Guard Verified |
| **Firebase Auth Project** | `padhakuportal-v2` | `src/utils/firebase.ts` Config |
| **Cloudflare Pages Project** | `padhakuportal-v2` | Build Manifest & SPA 200 Rewrite |
| **Cloudflare D1 Binding** | `DB` (`ASSESSMENT_DB` fallback) | `schema.sql` SSOT Execution |
| **Cloudflare R2 Bucket** | `BUCKET` | Physical Asset SHA256 Storage |
| **Current Deployment Version**| `v3.0.0-uat-verified` | Edge Manifest ID Synchronized |

---

## 🔒 Environment Isolation Rule
All tests were executed directly against the canonical Cloudflare Workers + D1 database production pipeline.
