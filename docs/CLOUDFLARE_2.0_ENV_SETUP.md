# ShikshaSahayak 2.0 — Cloudflare Environment Variables & Bindings Setup Guide

This document lists all required **D1 Databases**, **R2 Buckets**, **Server-Side Secrets**, and **Client-Side Build Variables** required to run and deploy the `2.0` branch on Cloudflare Pages.

---

## 1. Cloudflare Pages Bindings

> **Configure in Cloudflare Pages:**  
> **Cloudflare Pages Dashboard** → **Project (`padhakuportal`)** → **Settings** → **Functions** → **D1 database bindings / R2 bucket bindings**

### A. D1 Databases
| Binding Name | Database Name | Database ID | Purpose |
| :--- | :--- | :--- | :--- |
| `DB` | `DB` | `d0d22669-42aa-4c36-b9e3-c3aace80cad4` | Main DB (Universities, Subjects, Materials, Unified Users, Beta Access, Feature Flags) |
| `ASSESSMENT_DB` | `ASSESSMENT_DB` | `352efef7-24bb-418c-8158-92144fc7f821` | LMS DB (Teacher Portal, Classes, Enrollments, Submissions, Quizzes) |

### B. R2 Object Storage
| Binding Name | Bucket Name | Purpose |
| :--- | :--- | :--- |
| `MATERIALS_BUCKET` | `store` | Storage bucket for PDFs, study notes, PYQ files, and uploaded assets |

---

## 2. Server-Side Environment Variables & Secrets

> **Configure in Cloudflare Pages:**  
> **Cloudflare Pages Dashboard** → **Project (`padhakuportal`)** → **Settings** → **Environment Variables**  
> *(Set type to **Secret / Encrypted** for API keys)*

> [!IMPORTANT]
> Do **NOT** add the `VITE_` prefix to AI provider keys. Private provider keys are strictly server-side and read by Cloudflare Worker isolates.

### A. Multi-Provider AI Keys (Server-Side Secrets)
| Variable Name | Type | Purpose / Capabilities |
| :--- | :--- | :--- |
| `OPENROUTER_API_KEY` | Secret | **Primary LLM**: AI Tutor, Copilot, Assistant, Planner, Orchestrator (`meta-llama/llama-3.3-70b-instruct`, `google/gemini-2.0-flash-001`) |
| `GEMINI_API_KEY` | Secret | **Fallback LLM**: Backup provider for Tutor and direct Gemini completions |
| `NVIDIA_NIM_API_KEY` | Secret | **High-Performance LLM**: Dedicated fallback for Llama 3.1 405B completions |
| `GROQ_API_KEY` | Secret | **Fast Inference LLM**: Primary provider for Quiz Generation and Exam Predictions (`llama-3.3-70b-versatile`) |
| `HUGGINGFACE_API_KEY` | Secret (Optional) | Specialized models, vision, or embeddings |

### B. Server Auth Configuration
| Variable Name | Example Value | Purpose |
| :--- | :--- | :--- |
| `FIREBASE_PROJECT_ID` | `padhakuportal` | Firebase JWT Token verification in `functions/lib/auth.ts` |

---

## 3. Client-Side (Vite Frontend) Environment Variables

> **Configure in Cloudflare Pages:**  
> Added to **Cloudflare Pages Environment Variables** or local `.env` file for Vite build step.

| Variable Name | Example Value | Purpose |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://shikshasahayak.org` | Frontend API endpoint URL |
| `VITE_FIREBASE_API_KEY` | `AIzaSy...` | Firebase Client SDK Key |
| `VITE_FIREBASE_APP_ID` | `1:123456789012:web:...` | Firebase Web App ID |
| `VITE_FIREBASE_PROJECT_ID` | `padhakuportal` | Firebase Project ID |
| `VITE_FIREBASE_AUTH_DOMAIN` | `shikshasahayak-demo.firebaseapp.com` | Firebase Auth Domain |

---

## 4. Local Development Secrets (`.dev.vars`)

For local testing with `wrangler pages dev` or `npm run start`, add server secrets to `.dev.vars` in your workspace root:

```ini
OPENROUTER_API_KEY=sk-or-v1-...
GEMINI_API_KEY=AIzaSy...
NVIDIA_NIM_API_KEY=nvapi-...
GROQ_API_KEY=gsk_...
HUGGINGFACE_API_KEY=hf_...
FIREBASE_PROJECT_ID=padhakuportal
```
