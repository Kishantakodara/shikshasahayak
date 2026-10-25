# 🎓 ShikshaSahayak

> **AI-Powered Academic Companion & Open Educational Ecosystem for Higher Education**  
> *Submitted for Hack for Social Cause (HSC) / Viksit Bharat Young Leaders Dialogue (VBYLD)*

---

## 🌟 Mission & Social Impact

Higher education in developing regions faces an acute inequality barrier: while students in elite institutions have access to comprehensive libraries and expensive coaching, over 10 million students in **Tier-2, Tier-3, and rural engineering and diploma colleges** struggle with fragmented resources, high paywalls, English-language comprehension hurdles, and alarming semester failure rates.

**ShikshaSahayak** is a zero-cost, open-access, AI-amplified academic platform designed to democratize college education:
- 📚 **Zero-Cost Academic Vault:** Verified lecture notes, university syllabi, and Previous Year Questions (PYQs).
- 🤖 **Curriculum-Grounded AI Mentor:** Context-aware academic doubt-clearing, concept simplifier, and exam pattern prediction.
- 👨‍🏫 **Educator Classroom Hub:** Live geofenced class attendance, assignment management, and student performance tracking.
- ⚡ **Offline & Low-Bandwidth Optimized:** Edge-cached Single Page Architecture built to run fluidly on budget smartphones and low-connectivity networks.
- 🎯 **UN SDG Alignment:** Directly targets **SDG 4 (Quality Education)**, **SDG 8 (Decent Work & Economic Growth)**, and **SDG 10 (Reduced Inequalities)**.

---

## 🚀 Quick Start (Zero-Deployment Local Evaluation)

This repository is **100% self-contained and pre-seeded with local data**. Judges and evaluators do **NOT** need to configure cloud accounts, Firebase, or Cloudflare backends.

### 1. Clone & Install
```bash
git clone https://github.com/your-team/shikshasahayak.git
cd shikshasahayak
npm install
```

### 2. Launch Local Development Server
```bash
npm run dev
```

### 3. Open in Browser
Visit `http://localhost:3000` (or the port shown in terminal).

---

## 🏆 1-Click Hackathon Evaluator Access

When navigating to `/login`, you will see the **Hackathon Evaluation Access** banner with 1-click instant login options:

1. **🎓 Student Demo:**
   - Pre-loaded with student identity (*Aarav Patel, CSE Sem 4, GEC*).
   - Instant access to enrolled semester subjects, study materials, PYQ hub, and practice tests.
2. **👨‍🏫 Teacher Demo:**
   - Pre-loaded faculty account (*Prof. R. Sharma, Dept. of Computer Science*).
   - Live geofenced attendance sessions, student roster, and assignment management.
3. **🛠️ Admin Demo:**
   - Academic content moderation and system analytics.

---

## 🛠️ Architecture & Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS, Lucide React Icons
- **Routing:** React Router v7
- **AI Intelligence:** Contextual AI mentor with local standalone academic fallback
- **Data Architecture:** Local Storage / IndexedDB mock engine for zero-dependency offline review; fully compatible with Cloudflare D1 & R2 edge storage.

---

## 📄 License & Team

- **License:** MIT Open-Source License
- **Team Contact:** `team@shikshasahayak.org`
