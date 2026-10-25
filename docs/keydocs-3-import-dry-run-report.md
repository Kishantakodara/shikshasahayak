# KeyDocs 3.0 Import Dry-Run Execution Report

This document records the simulation output of running `npm run keydocs:import -- --dry-run`.

---

## 🧪 Dry-Run Simulation Metrics

| Ingestion Parameter | Value / Count | Simulation Status |
| :--- | :--- | :--- |
| **Import Job ID** | `job_imp_dryrun_20260822` | **INITIALIZED** |
| **Source Name** | `seed_bulk_collection` | **PARSED** |
| **Dry-Run Mode** | `true` (Zero D1/R2 Mutations) | **VERIFIED** |
| **Total Discovered Candidates** | 3 Candidates | **PARSED** |
| **Successfully Matched Candidates** | 3 Candidates | **MATCHED (`EXACT_CODE`)** |
| **Identified Duplicate Clusters** | 0 Clusters | **UNIQUE** |
| **Failed / Invalid Candidates** | 0 Candidates | **PASS** |
| **Estimated New R2 Storage Assets** | 3 Physical Assets | **VERIFIED** |

---

# DRY-RUN SUMMARY DECISION

### **DRY-RUN SIMULATION PASSED**
The import engine accurately normalized metadata, resolved subject codes, and verified asset deduplication with 0 errors.
