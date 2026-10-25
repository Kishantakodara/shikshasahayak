# ShikshaSahayak 2.0 Beta Deployment Data & Storage Environment Report

This document specifies the database bindings, R2 asset storage namespaces, and environment isolation rules for the beta deployment.

---

## 📊 Beta Data Environment Matrix

| Infrastructure Binding | Host Provider | Environment Binding / Namespace | Read/Write Access | Isolation Level |
| :--- | :--- | :--- | :--- | :--- |
| **D1 Database Binding** | Cloudflare D1 | `env.DB` (`padhaku_d1_beta`) | Read / Write | **BETA ISOLATED** |
| **R2 Storage Binding** | Cloudflare R2 | `env.R2` (`padhaku-materials-beta`) | Read / Write | **BETA ISOLATED** |
| **PWA Cache Storage** | Service Worker Cache | `padhaku-beta-v2` | Cache Read / Write | **BETA ISOLATED** |
| **Payment Gateway Mode** | Razorpay SDK | Sandbox / Test Mode | Sandbox Orders Only | **TEST MODE (No real charges)** |
| **SEO Robots Header** | HTTP Header | `X-Robots-Tag: noindex, nofollow` | Headers Only | **NOINDEX PROTECTED** |

---

# DATA ISOLATION GUARANTEE
Beta users cannot mutate production D1 records or overwrite production R2 PDF assets.
