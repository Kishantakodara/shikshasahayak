# User Management Schema Mismatch Audit & Root Cause Resolution

## Overview
This document records the root cause investigation, schema reconciliation, and resolution for the User Management `academic_profiles` D1 schema error encountered during beta testing.

---

## 1. Three-Source Comparison

| Aspect | Source A: Deployed D1 (`academic_profiles`) | Source B: Repository `schema.sql` / Migrations | Source C: Backend/Frontend Implementation |
|---|---|---|---|
| **Original Primary Key** | `user_id` (TEXT) | `user_id` (TEXT) | `user_id` (TEXT) |
| **University Field** | `university_id` (TEXT) | `university_id` (TEXT) | `university_id` |
| **Branch Field** | `branch_id` (TEXT) | `branch_id` (TEXT) | `branch_id` |
| **Semester Field** | `semester_id` (TEXT) | `semester_id` (TEXT) | `semester_id` |
| **Enrollment Number** | **MISSING** *(prior to Migration 069)* | `enrollment_number` (TEXT) | `enrollment_number` / `enrollmentNo` |
| **Migration Source** | Initialized via `030_identity_auth_architecture.sql` | SSOT in `schema.sql` (Line 303) | `functions/api/admin/users/index.ts` |

---

## 2. Root Cause Analysis

1. **Initial Migration Omission**: In `migrations/030_identity_auth_architecture.sql`, `academic_profiles` was created with `user_id`, `university_id`, `college_name`, `degree_id`, `branch_id`, `semester_id`, `enrollment_year`, `graduation_year`, `created_at`, `updated_at`. The column `enrollment_number` was omitted from that specific migration SQL file.
2. **Repository SSOT Drift**: The master `schema.sql` (Line 303) and backend handlers (`functions/api/admin/users/index.ts`) were designed expecting `enrollment_number`.
3. **Runtime Crash**: When calling `POST /api/admin/users` to create/provision a user with an enrollment number, D1 returned `D1_ERROR: table academic_profiles has no column named enrollment_number SQLITE_ERROR`.

---

## 3. Canonical Field Identification

* **Canonical Column Name**: `enrollment_number` (TEXT)
* **Rationale**:
  - `schema.sql` (Line 303) defines `enrollment_number TEXT`.
  - `functions/api/admin/users/index.ts` queries `enrollment_number`.
  - `src/types/academic-profile.ts` defines `enrollmentNumber?: string`.
  - Student registration and verification components use `enrollmentNumber` / `enrollment_number`.

---

## 4. Resolution Executed

1. **Additive D1 Migration 069**:
   Created `migrations/069_add_enrollment_number_to_academic_profiles.sql` adding `enrollment_number TEXT` and `idx_academic_profiles_enrollment` index without dropping or mutating any existing data.
2. **Applied & Verified on Remote D1**:
   Executed migration 069 against remote D1 database `d0d22669-42aa-4c36-b9e3-c3aace80cad4`.
3. **Backend Robustness**:
   Updated `functions/api/admin/users/index.ts` to accept `enrollmentNo`, `enrollment_number`, or `enrollmentNumber` in incoming request payloads and alias both `enrollmentNo` and `enrollment_number` in GET responses.
