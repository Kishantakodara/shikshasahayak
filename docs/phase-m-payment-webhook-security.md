# ShikshaSahayak 2.0 Webhook Security & Idempotency Specification

This document details HMAC signature validation, webhook retry handling, and idempotency protection.

---

## 📊 Webhook Security Controls Scorecard

| Security Requirement | Implementation Strategy | Verified Behavior | Status |
| :--- | :--- | :--- | :--- |
| **HMAC Signature Check** | Compute SHA256 HMAC over raw HTTP request body | Mismatched signatures rejected with HTTP 401 | **VERIFIED (PASS)** |
| **Idempotent Webhook Processing** | Query D1 `transactions` for existing `payment_id` | Duplicate webhooks return HTTP 200 without duplicate grants | **VERIFIED (PASS)** |
| **Replay Attack Defense** | Validate timestamp header delta (< 300 seconds) | Expired request headers rejected immediately | **VERIFIED (PASS)** |
| **Payload Integrity Guard** | Verify `event` type matches `payment.captured` | Unhandled events logged and safely acknowledged | **VERIFIED (PASS)** |

---

# IDEMPOTENCY GUARANTEE
Repeated webhook delivery attempts by the payment provider return HTTP 200 without creating duplicate transaction records or extending subscription periods incorrectly.
