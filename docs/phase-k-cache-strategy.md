# ShikshaSahayak 2.0 Service Worker & Cache Strategy Document

This document presents caching strategies, cache names, invalidation rules, and user isolation boundaries.

---

## 📊 Cache Strategy Table

| Cache Name | Resource Type | Cache Strategy | Invalidation & TTL Rule | Multi-User Isolation |
| :--- | :--- | :--- | :--- | :--- |
| `padhaku-static-v1` | JS, CSS, Web Fonts, App Shell | **CACHE FIRST** | Invalidated on new app build deployment | **SHARED (PUBLIC)** |
| `padhaku-materials-v1`| KeyDocs PDFs, PYQ Documents | **CACHE FIRST** | Retained until user deletes offline copy | **PUBLIC CONTENT** |
| `padhaku-images-v1` | Logos, Icons, Static Graphics | **STALE WHILE REVALIDATE**| 30-day rolling expiration | **SHARED (PUBLIC)** |
| `padhaku-api-v1` | Public Academic Search Index | **NETWORK FIRST** | 24-hour cache fallback for offline search | **PUBLIC CONTENT** |
| `BYPASS_CACHE` | Authenticated `/api/user/*` | **NETWORK ONLY** | Never cached in Service Worker | **STRICT ISOLATION** |

---

## 🔒 Authenticated Cache Isolation Policy
All private user endpoints (e.g. `/api/user/*`, `/api/student/*`, `/api/teacher/*`, `/api/admin/*`) bypass Service Worker Cache Storage to prevent multi-user data leakage.
