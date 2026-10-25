# ShikshaSahayak 2.0 Offline Capability Matrix

This document defines explicit network requirements across all ShikshaSahayak features.

---

## 📊 Offline Capability Scorecard

| Feature Area | Offline Status | Cache / Storage Strategy | Data Recovery / Sync Action |
| :--- | :--- | :--- | :--- |
| **Saved KeyDocs Notes & PDFs** | **FULL OFFLINE** | Cache Storage API (`padhaku-materials-v1`) | Read offline anytime in My Library |
| **Recent PYQ Papers** | **FULL OFFLINE** | Cache Storage + IndexedDB Metadata | View solutions without internet connection |
| **Curriculum Navigation Tree** | **FULL OFFLINE** | Local Storage / Shell Pre-fetch | Browse subjects, units, & sub-topics |
| **Student Profile Context** | **FULL OFFLINE** | Encrypted `StudentAcademicContext` | Render dashboard shell offline |
| **Offline Practice Drills** | **PARTIAL OFFLINE** | Local Question Buffer | Answers buffered; synced on reconnection |
| **Live Search & Discovery** | **ONLINE REQUIRED** | Server-Side Index Query | Requires active connection for new queries |
| **AI Tutor & Document Q&A** | **ONLINE REQUIRED** | Cloudflare Edge SSE Stream | Requires active network connection |
| **Admin & Teacher Mutations** | **ONLINE REQUIRED** | Server-Authoritative D1 Mutations | Requires verified Firebase Bearer token |

---

# OFFLINE CAPABILITY GUARANTEE
Students can open, read, and revise all previously downloaded KeyDocs 3.0 study materials and PYQs with 0 network connectivity.
