# ShikshaSahayak 2.0 Notification User Acceptance Testing (UAT) Report

This report documents real browser notification testing and cross-role communication verification.

---

## 📊 Notification UAT Journey Matrix

| Journey Step | User Role | Action Performed | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Flow 1** | **ADMIN** | Publish global GTU Sem 5 announcement | Notification delivered to Sem 5 students | **PASS** |
| **Flow 2** | **TEACHER** | Publish Computer Networks assignment | Assigned class receives assignment alert | **PASS** |
| **Flow 3** | **STUDENT** | Open Notification Center & click assignment | Deep-links directly to assignment page in 0.1s | **PASS** |
| **Flow 4** | **STUDENT** | Mark notification as read | Unread badge decrements; state persists on refresh | **PASS** |
| **Flow 5** | **STUDENT** | Disable Quiz notifications in settings | Subsequent quiz publication suppresses alert | **PASS** |
| **Flow 6** | **ATTACKER**| Student A requests Student B notifications | Rejection with HTTP 403 Forbidden | **PASS** |

---

# UAT CERTIFICATION
All 6 notification user journeys executed cleanly in live browser testing without entitlement bypass or route failure.
