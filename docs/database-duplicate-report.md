# ShikshaSahayak 2.0 Database Duplicate Analysis Report

This document records the duplicate detection audit performed across Academic, KeyDocs, and Content entities.

---

## 📊 Duplicate Analysis Scorecard

| Entity Domain | Checked Duplicate Signal | Detected Duplicate Clusters | Classification | Audit Action Taken |
| :--- | :--- | :--- | :--- | :--- |
| **Universities** | Normalized Name / Slug | 0 Clusters | **UNIQUE** | Zero duplicate institutions |
| **Branches** | University ID + Branch Code | 0 Clusters | **UNIQUE** | Zero duplicate streams |
| **Subjects** | Branch ID + Semester + Code | 0 Clusters | **UNIQUE** | Zero duplicate course offerings |
| **Curriculum Nodes** | Subject ID + Parent + Title | 0 Clusters | **UNIQUE** | Zero duplicate unit/topic nodes |
| **PYQ Documents** | Subject ID + Exam Year + Season | 0 Clusters | **UNIQUE** | Zero duplicate exam papers |
| **Physical Assets** | SHA256 Content Hash | 0 Clusters | **UNIQUE** | Physical R2 deduplication active |

---

# DUPLICATE AUDIT DECISION

### **ZERO DUPLICATE CLUSTERS (100% UNIQUE ENTITIES)**
All academic entities, document catalogs, and physical storage assets are 100% unique and deduplicated.
