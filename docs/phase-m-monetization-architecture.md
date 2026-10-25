# ShikshaSahayak 2.0 Monetization Architecture Document

This document presents the server-authoritative checkout, payment verification, and entitlement lifecycle blueprint.

---

## 🏛️ Monetization Lifecycle Blueprint

```text
STUDENT SELECTS PRODUCT (e.g. GTU Test Series ₹299)
  │
  ▼
SERVER-SIDE ORDER CREATOR (`/api/v1/orders/create` ➔ Razorpay API Order ID)
  │
  ▼
RAZORPAY CHECKOUT MODAL (Student completes UPI / NetBanking / Card payment)
  │
  ▼
PAYMENT CALLBACK / WEBHOOK (`/api/v1/payments/verify`)
  │
  ├── Verify HMAC-SHA256 Signature using Server Secret Key
  ├── Idempotency Check: Verify Payment ID not previously processed
  └── Persist Transaction Record to D1 `transactions` table
  │
  ▼
AUTOMATIC ENTITLEMENT GRANTOR (Updates D1 `user_entitlements` table)
  │
  ▼
INSTANT FEATURE UNLOCKING & FRONTEND REFRESH (Unlocked Premium Test Series / AI Pro)
```

---

## 💡 Key Security Rules
1. **Zero Client Price Controls**: Order amount and currency are determined exclusively by Cloudflare Workers.
2. **Server-Verified Entitlement**: Protected API routes query D1 `user_entitlements` using verified Firebase Auth tokens.
