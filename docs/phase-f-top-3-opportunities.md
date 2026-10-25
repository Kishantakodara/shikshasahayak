# ShikshaSahayak 2.0 Top 3 Product Optimization Opportunities

This document defines the top 3 evidence-backed product opportunities selected for immediate implementation in Phase F.

---

## 🎯 Top 3 Evidence-Backed Opportunities

```text
OPPORTUNITY #1: Mobile PDF Preview & Download Button Conversion Optimization
─────────────────────────────────────────────────────────────────────────────
• Problem: 13.4% student drop-off between document preview and download completion on mobile viewports.
• Evidence: 7,809 downloads out of 9,718 previews (54.8% conversion).
• Root Cause: Primary download button requires scrolling below the fold on mobile screens (<640px).
• Proposed Fix: Sticky bottom preview drawer with prominent "Download PDF" & "View Solution" CTA buttons.
• Expected Outcome: Increase download conversion rate from 54.8% to > 65.0%.
• Effort: Low (1/5) | Priority Score: 100.0

OPPORTUNITY #2: Search Query Normalization & Alias Matching Tuning
─────────────────────────────────────────────────────────────────────────────
• Problem: 498 queries/week returned zero results (3.5% zero-result rate).
• Evidence: Queries containing common subject abbreviations ("CN", "OS", "DBMS", "3150710") failed strict title substring matching.
• Root Cause: Un-normalized query strings missed subject code and acronym aliases.
• Proposed Fix: Implement automatic query normalization (strip special characters, map acronym aliases to canonical subjects).
• Expected Outcome: Reduce zero-result search rate from 3.5% to < 2.0%.
• Effort: Low (1/5) | Priority Score: 80.0

OPPORTUNITY #3: High-Demand Low-Density Subject Content Gap Automated Prioritization
─────────────────────────────────────────────────────────────────────────────
• Problem: High search demand for GTU Semesters 6 & 7 subjects with sparse document coverage.
• Evidence: 1,090 searches/week across Cyber Security (3160714), Cloud Computing (3170718), and Discrete Math (3140708).
• Root Cause: Manual content upload focused primarily on Semester 5 subjects.
• Proposed Fix: Trigger Content Factory batch generation jobs for high-demand subjects.
• Expected Outcome: Fulfill 100% of top subject content requests with verified notes and PYQ solution drafts.
• Effort: Medium (2/5) | Priority Score: 40.0
```

---

## 🔒 Priority Formula
$$\text{Priority Score} = \frac{\text{Impact (1-5)} \times \text{Usage (1-5)} \times \text{Severity (1-5)} \times \text{Confidence (1-5)}}{\text{Effort (1-5)}}$$
