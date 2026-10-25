# ShikshaSahayak 2.0 Production Environment Specification

This document details the production deployment environment, host configurations, Cloudflare bindings, and database isolation.

---

## 📊 Environment Configuration Scorecard

| Infrastructure Element | Production Provider | Deployment Origin / Binding | Secrets & Isolation Status |
| :--- | :--- | :--- | :--- |
| **Production Domain** | Cloudflare Pages | `shikshasahayak.org` | **LIVE PRODUCTION** |
| **API Edge Workers** | Cloudflare Workers | `functions/api/` | **LIVE PRODUCTION BINDINGS** |
| **Database Binding** | Cloudflare D1 | `env.DB` (`padhaku_d1_prod`) | **ISOLATED PRODUCTION D1** |
| **Storage Binding** | Cloudflare R2 | `env.R2` (`padhaku-materials`) | **ISOLATED PRODUCTION R2** |
| **Authentication Engine**| Firebase Auth | `shiksha-sahayak-v2` | **VERIFIED API KEYS ONLY** |
| **AI Gateway Service** | Cloudflare Worker / Gemini | `env.GEMINI_API_KEY` | **SERVER-SIDE SECRET** |
| **Payment Gateway** | Razorpay Standard Checkout | `env.RAZORPAY_SECRET` | **PROVIDER ACTIVATION PENDING** |

---

# PRODUCTION ENVIRONMENT STATEMENT
The application is deployed to Cloudflare Pages (`shikshasahayak.org`) with D1 and R2 production bindings active.
