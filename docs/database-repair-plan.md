# ShikshaSahayak 2.0 Database Repair Plan

This document details the deterministic repair plan, dry-run safety verification, and execution order for database hardening.

---

## 🛠️ Database Hardening & Repair Matrix

| Order | Targeted Subsystem | Anomaly Description | Safe Deterministic Fix | Migration File Required | Risk Level |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | Foreign Keys | 0 Orphan Records | N/A (Already 100% clean) | No | **NONE** |
| **2** | Metadata Completeness | Type metadata alignment | `INSERT OR IGNORE` fallback queries in `database-repair-audit.ts` | No | **LOW** |
| **3** | Document Stats | Stats counter rows | `INSERT OR IGNORE INTO document_stats` fallback | No | **LOW** |
| **4** | Index Consolidation | Multi-column query support | `067_keydocs_legacy_cleanup.sql` | Applied | **NONE** |

---

## 🔒 Execution Safety Order
1. Orphan references check
2. Invalid foreign relationships check
3. Deterministic metadata backfill (`--apply-safe-fixes`)
4. Multi-column index verification
