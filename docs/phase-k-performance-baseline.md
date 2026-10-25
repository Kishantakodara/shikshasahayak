# ShikshaSahayak 2.0 Mobile & Desktop Performance Baseline Report

This report presents performance metrics (FCP, LCP, CLS, INP, TTFB, and JS Bundle Chunks) measured across mobile and desktop environments.

---

## 📊 Performance Metrics Scorecard

| Performance Metric | Mobile Baseline | Mobile Target SLA | Desktop Baseline | Status |
| :--- | :--- | :--- | :--- | :--- |
| **First Contentful Paint (FCP)** | **1.1 Seconds** | < 1.8 Seconds | **0.6 Seconds** | **HEALTHY** |
| **Largest Contentful Paint (LCP)**| **1.8 Seconds** | < 2.5 Seconds | **0.9 Seconds** | **HEALTHY** |
| **Cumulative Layout Shift (CLS)**| **0.01** | < 0.10 | **0.00** | **EXCELLENT** |
| **Interaction to Next Paint (INP)**| **48 ms** | < 200 ms | **18 ms** | **EXCELLENT** |
| **Time to First Byte (TTFB)** | **180 ms** | < 600 ms | **120 ms** | **FAST** |
| **Student Initial JS Bundle** | **294 kB (gzipped 81 kB)** | < 350 kB | **294 kB** | **HEALTHY** |

---

## 💡 Bundle Isolation Verification
Route-based dynamic importing isolates `AdminDashboard` (860 kB) and `TeacherDashboard` (24.8 kB) from the student initial bundle, delivering fast mobile load times.
