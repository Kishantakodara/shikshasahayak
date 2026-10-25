# ShikshaSahayak 2.0 Notification Architecture Document

This document presents the canonical notification flow connecting Event Triggers, Audience Resolution, Preference Guardrails, Delivery Channels, and Deep-Link Routing.

---

## 🏛️ Notification Pipeline Architecture

```text
ACADEMIC / ASSESSMENT / TEACHER EVENT (e.g. PYQ Published, Assignment Due, Quiz Result)
  │
  ▼
AUDIENCE RESOLUTION ENGINE (Maps Branch, Semester, University ➔ Recipient User IDs)
  │
  ▼
USER NOTIFICATION PREFERENCE GUARD (Checks `user_preferences` category toggles & quiet hours)
  │
  ▼
NOTIFICATION PAYLOAD CREATOR (Assigns ID, Type, Title, Message, actionUrl, Priority, Expiry)
  │
  ▼
IN-APP NOTIFICATION STORE (Persists record to D1 `notifications` table)
  │
  ▼
DELIVERY & DEEP-LINK DISPATCHER
  ├── Real-time In-App Notification Center Badge
  ├── Optional Web Push Notification (PWA Service Worker)
  └── Deep-Link Action Navigation (Direct to Material / PYQ / Quiz / Result)
  │
  ▼
USER ACTION & READ STATE SYNCHRONIZATION (Mark as Read ➔ Persistent D1 Update)
```

---

## 💡 Key Architectural Principles
* **Separation of Generation and Delivery**: Notification payload generation is decoupled from channel delivery.
* **Deterministic Event Keys**: Event key hashing prevents duplicate notification generation on retries.
