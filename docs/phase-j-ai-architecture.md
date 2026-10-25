# ShikshaSahayak 2.0 AI Tutor Architecture Document

This document presents the system architecture connecting Student Academic Context, KeyDocs 3.0 RAG Search, Beta Entitlements, Assessment Practice Generation, and Telemetry.

---

## 🏛️ AI Tutor Architecture Blueprint

```text
STUDENT QUERY (Contextual Entry Point: Global, Subject, Document, Assessment Result)
  │
  ▼
SERVER-SIDE BETA ENTITLEMENT GATEWAY (Firebase Token ➔ D1 `user_beta_access`)
  │
  ▼
ACADEMIC CONTEXT & RAG RETRIEVAL ENGINE
  │
  ├── Injects Student Context: GTU • Computer Engg • Semester 5
  ├── BM25 Search over KeyDocs 3.0 `documents`, `pyq_metadata`, `curriculum_nodes`
  └── Injects Top-3 Matched Document Snippets
  │
  ▼
MODEL PROMPT BUILDER & SAFETY GUARDRAILS (Prompt Injection Protection)
  │
  ▼
SERVER-SIDE EDGE AI GATEWAY (Gemini Flash SSE Stream)
  │
  ▼
STREAMING RESPONSE & ACTION DISPATCHER
  ├── Render Markdown Answer with Clickable Source Links
  ├── Trigger 1-Click Practice Generation
  └── Direct Weakness Engine Revision Drill
```

---

## 💡 Architecture Principles
* **Context Minimization**: Only relevant academic profile parameters and top BM25 search results are injected into prompts.
* **Server Authority**: Provider API keys and beta entitlement checks remain strictly server-side on Cloudflare Workers.
