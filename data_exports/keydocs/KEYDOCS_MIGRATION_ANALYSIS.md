# Keydocs Data Forensic Audit & Migration Mapping Blueprint

**Generated:** 2026-09-04  
**Source Database:** `keydocs` (`d0d22669-42aa-4c36-b9e3-c3aace80cad4`)  
**Target Database:** `shiksha-core-db` (`4e63a42b-1271-462f-8271-da47cf659139`)  
**Status:** DATA DOWNLOADED LOCALLY & AUDITED. ZERO MODIFICATIONS APPLIED TO TARGET DATABASE (Per User Strict Constraint).

---

## 1. Executive Summary

All 58 tables from the remote production `keydocs` D1 database have been downloaded and saved locally in two formats:
1. **Raw D1 SQL Dump:** `data_exports/keydocs/keydocs_full_export.sql` (2,005,098 bytes / ~2.0 MB)
2. **Individual Per-Table JSON Files:** `data_exports/keydocs/tables/*.json` (58 discrete table files)

### Key Metrics
- **Total Tables in Keydocs:** 58 tables
- **Tables with Live Data:** 25 tables
- **Empty Tables:** 33 tables
- **Total Exported Data Records:** 3,192 rows

---

## 2. Inventory of Tables with Data

| Table Name | Row Count | Target in `shiksha-core-db` | Mapping Status |
|:---|:---:|:---|:---|
| `question_branch_mappings` | 812 | Secondary relation | Needs remapping to new branch codes |
| `document_files` | 406 | `document_files` | 100% Direct Match |
| `documents` | 406 | `documents` | Remap FKs (`university_id`, `branch_id`, `users`) |
| `document_stats` | 406 | `document_stats` | 100% Direct Match |
| `subjects` | 307 | `subjects` | Remap `university_id`, `branch_id`; drop `slug` |
| `syllabus_details` | 291 | `syllabus_details` + `documents` | 100% Match |
| `file_assets` | 217 | `file_assets` | 100% Direct Match |
| `master_question_bank` | 167 | `questions` | Needs parent `quiz_id` & letter-to-int index |
| `study_material_details` | 110 | `study_material_details` + `documents` | 100% Match |
| `blogs` | 15 | `blogs` | 100% Direct Match |
| `d1_migrations` | 14 | N/A (Internal D1 tracker) | Do not migrate |
| `branches` | 7 | `branches` | Remap ID to `{univ}_{course}_{code}`, drop `slug` |
| `custom_roles` | 6 | `user_roles` | Transform role keys into RBAC |
| `bug_reports` | 5 | `bug_reports` | 100% Direct Match |
| `pyq_details` | 5 | `pyq_details` + `documents` | 100% Match |
| `question_pipeline_jobs` | 4 | Staging/Pipeline logs | Stale test records; skip |
| `question_pipeline_errors` | 3 | Staging/Pipeline logs | Stale test records; skip |
| `admin_audit_logs` | 2 | `admin_audit_logs` | Direct Match (link `admin_id` -> `users.id`) |
| `academic_years` | 2 | LMS metadata | Reference table |
| `universities` | 1 | `universities` | Remap `id: 'univ_default'` -> `'gtu'`, drop `slug` |
| `announcements` | 1 | `announcements` | Rename `text` -> `message`, add `title`, `audience` |
| `website_popups` | 1 | `website_popups` | 100% Direct Match |
| `teacher_profiles` | 1 | `teacher_profiles` | 100% Direct Match |
| `teacher_whitelist` | 1 | `users` + `user_roles` | Absorbed into unified auth |
| `unified_users` | 1 | `users` | 100% Match (`uid` -> `firebase_uid`) |

---

## 3. Deep Forensic Analysis & Transformation Rules

### 3.1 Academic Hierarchy Transformation

#### A. Universities (`universities`)
- **Keydocs Row:**
  ```json
  {
    "id": "univ_default",
    "name": "Gujarat Technological University",
    "short_name": "GTU",
    "slug": "gtu",
    "is_active": 1,
    "country": "India",
    "state": "Gujarat"
  }
  ```
- **ShikshaSahayak Core DB Schema:**
  - `id`: Primary Key (`gtu`)
  - `name`: TEXT NOT NULL UNIQUE (`Gujarat Technological University`)
  - `short_name`: TEXT NOT NULL (`GTU`)
  - No `slug`, `country`, or `state` columns in core schema.
- **Transformation:**
  - Map `id`: `'univ_default'` $\rightarrow$ `'gtu'`.

#### B. Courses (`courses`)
- **Keydocs:** No courses table exists.
- **ShikshaSahayak Core DB Schema:** Requires `courses` as a mandatory foreign key for branches (`branches.course_id REFERENCES courses(id)`).
- **Transformation:**
  - Synthesize canonical GTU BE course row:
    ```sql
    INSERT INTO courses (id, university_id, code, name, short_name, level)
    VALUES ('gtu_be', 'gtu', 'BE', 'Bachelor of Engineering', 'BE', 'undergraduate');
    ```

#### C. Branches (`branches`)
- **Keydocs Rows (7 records):**
  - `branch_computer` (Code: 7, slug: 'computer', short_name: 'CSE')
  - `branch_it` (Code: 16, slug: 'it', short_name: 'IT')
  - `branch_electrical` (Code: 9, slug: 'electrical', short_name: 'EE')
  - `branch_ece` (Code: 11, slug: 'ece', short_name: 'ECE')
  - `branch_mechanical` (Code: 19, slug: 'mechanical', short_name: 'ME')
  - `branch_civil` (Code: 6, slug: 'civil', short_name: 'CE')
  - `branch_chemical` (Code: 5, slug: 'chemical', short_name: 'CH')
- **ShikshaSahayak Core DB Schema:**
  - `id`: PK strictly formatted as `{univ}_{course}_{code}`:
    - `branch_computer` $\rightarrow$ `gtu_be_007`
    - `branch_it` $\rightarrow$ `gtu_be_016`
    - `branch_electrical` $\rightarrow$ `gtu_be_009`
    - `branch_ece` $\rightarrow$ `gtu_be_011`
    - `branch_mechanical` $\rightarrow$ `gtu_be_019`
    - `branch_civil` $\rightarrow$ `gtu_be_006`
    - `branch_chemical` $\rightarrow$ `gtu_be_005`
  - `code`: 3-digit zero-padded string (`'007'`, `'016'`, etc.).
  - `course_id`: `'gtu_be'`.
  - `slug`: Removed completely.

#### D. Subjects (`subjects` - 307 records)
- **Keydocs Rows:**
  - `university_id`: `'univ_default'`
  - `branch_id`: `'branch_computer'`, `'branch_it'`, etc.
  - `slug`: present
  - `credits`, `syllabus_url`: present
- **Transformation:**
  - Remap `university_id` from `'univ_default'` $\rightarrow$ `'gtu'`.
  - Remap `branch_id` from old ID $\rightarrow$ new canonical ID (`gtu_be_007`, etc.).
  - Exclude `slug`, `credits`, `syllabus_url` (not in core table definition).
  - Preserve `id`, `name`, `code`, `semester`, `subject_group_id`, `wef_year`.

---

### 3.2 Content & 3-Tier Storage Transformation

#### A. File Assets (`file_assets` - 217 records)
- Stores SHA-256 deduplicated file records (`content_hash`, `storage_key`, `original_filename`, `mime_type`, `size_bytes`).
- **Transformation:** Direct 1:1 migration. Column names and types are 100% identical.

#### B. Document Files (`document_files` - 406 records)
- Links stored files to logical documents (`id`, `document_id`, `file_type`, `storage_key`, `file_url`, `mime_type`, `size_bytes`, `is_primary`, `file_asset_id`, `original_filename`).
- **Transformation:** Direct 1:1 migration. Column names and types are 100% identical.

#### C. Documents (`documents` - 406 records)
- **Keydocs Rows:**
  - `university_id`: `'univ_default'`
  - `branch_id`: `'branch_*'`
  - `uploaded_by` / `approved_by`: `'admin'` (not a UUID)
  - `views`, `likes`, `downloads`: Present in table
- **ShikshaSahayak Core DB Schema:**
  - `uploaded_by` / `approved_by` must reference `users(id)`.
  - Sub-type detail columns (`paper_year`, `season`, `exam_label`, `syllabus_year`, `regulation`, `version_label`, `material_kind`, `unit_no`, `chapter`, `topic`, `author`) exist directly in `documents` in core schema.
- **Transformation:**
  - Remap `university_id` $\rightarrow$ `'gtu'`.
  - Remap `branch_id` $\rightarrow$ `gtu_be_*`.
  - If `'admin'` does not exist in `users`, set `uploaded_by = NULL` and `approved_by = NULL` (or point to the admin user `0tpV07mBfhMdbaqoPSIVKVEZNNt2`).
  - Collapse detail data from `syllabus_details` (291 rows), `study_material_details` (110 rows), and `pyq_details` (5 rows) into the respective document row.

#### D. Document Stats (`document_stats` - 406 records)
- **Transformation:** Direct 1:1 migration (`document_id`, `views`, `likes`, `downloads`, `updated_at`).

#### E. Blogs (`blogs` - 15 records)
- **Transformation:** Direct 1:1 migration. All 15 rich SEO guides (HTML articles) match core schema columns exactly.

---

### 3.3 Identity & User System Transformation

#### A. Unified Users (`unified_users` $\rightarrow$ `users`)
- **Keydocs Row (1 record):**
  - `id`: `0tpV07mBfhMdbaqoPSIVKVEZNNt2`
  - `uid`: `0tpV07mBfhMdbaqoPSIVKVEZNNt2`
  - `email`: `tech@shikshasahayak.org`
  - `display_name`: `Ayush Pandey`
  - `user_type`: `teacher`
  - `status`: `active`
- **Transformation:**
  - Insert into `users`:
    - `id`: `0tpV07mBfhMdbaqoPSIVKVEZNNt2`
    - `firebase_uid`: `0tpV07mBfhMdbaqoPSIVKVEZNNt2`
    - `email`: `tech@shikshasahayak.org`
    - `display_name`: `Ayush Pandey`
    - `user_type`: `teacher`
    - `status`: `active`
  - Seed `user_roles`:
    - `user_id`: `0tpV07mBfhMdbaqoPSIVKVEZNNt2`, `role`: `teacher`
    - `user_id`: `0tpV07mBfhMdbaqoPSIVKVEZNNt2`, `role`: `admin`

#### B. Teacher Profiles (`teacher_profiles` - 1 record)
- **Transformation:** Direct 1:1 migration.

#### C. Admin Audit Logs (`admin_audit_logs` - 2 records)
- **Transformation:** Direct 1:1 migration since `admin_id = 0tpV07mBfhMdbaqoPSIVKVEZNNt2` exists in `users`.

---

### 3.4 Assessment & Question Bank Transformation

#### A. Master Question Bank (`master_question_bank` - 167 records)
- In `keydocs`:
  - Contains 167 verified GTU Engineering MCQs (`Q_GTU_3110014_...`).
  - Structured with `subject_code`, `options_json`, `correct_answer_json` (`"A"`), `explanation`, `marks`.
- In `shiksha-core-db`:
  - Table `questions` requires a mandatory `quiz_id` foreign key (`quiz_id TEXT NOT NULL REFERENCES quizzes(id)`).
  - `correct_answer` is an `INTEGER` (0 for A, 1 for B, 2 for C, 3 for D).
- **Transformation Options for User Review:**
  1. **Option 1 (Automated Quizzes):** Group the 167 questions by `subject_code` + `unit_no` and create corresponding parent records in `quizzes` (e.g. `quiz_gtu_3110014_u1`), then insert each question with `correct_answer` converted to integer (A=0, B=1, C=2, D=3).
  2. **Option 2 (Standalone Question Bank Table):** Create a separate `question_bank` or `master_questions` table in `shiksha-core-db` to store question bank items that do not belong to an active student quiz session.

---

## 4. Migration Execution Plan (Awaiting User Permission)

When the user gives explicit permission to populate `shiksha-core-db`, the migration must execute in the following strict foreign key dependency order:

1. **Step 1: Identity Masters**
   - Insert `users` (`tech@shikshasahayak.org`).
   - Insert `user_roles` (`teacher`, `admin`).
   - Insert `teacher_profiles`.

2. **Step 2: Academic Masters**
   - Insert `universities` (`gtu`).
   - Insert `courses` (`gtu_be`).
   - Insert `branches` (7 remapped branches: `gtu_be_007`, `gtu_be_016`, etc.).
   - Insert `subjects` (307 subjects with remapped `branch_id`).

3. **Step 3: Content Storage**
   - Insert `file_assets` (217 deduplicated storage assets).
   - Insert `blogs` (15 blogs).
   - Insert `documents` (406 documents with remapped academic IDs).
   - Insert `document_files` (406 files linking documents to file assets).
   - Insert `document_stats` (406 view/download stat rows).
   - Insert `pyq_details` (5 rows), `syllabus_details` (291 rows), `study_material_details` (110 rows).

4. **Step 4: Platform & Support**
   - Insert `website_popups` (1 popup).
   - Insert `announcements` (1 announcement with adapted columns).
   - Insert `bug_reports` (5 bug reports).
   - Insert `admin_audit_logs` (2 audit logs).

5. **Step 5: Question Bank**
   - Convert 167 GTU MCQs into `quizzes` + `questions` according to the chosen option.

---

## 5. Verification Checklist

- [x] Full remote export downloaded from `keydocs` D1 (`keydocs_full_export.sql` - 2.0 MB).
- [x] 58 per-table JSON datasets generated under `data_exports/keydocs/tables/`.
- [x] 3,192 records parsed, counted, and verified.
- [x] All 25 populated tables cross-referenced with target `shiksha-core-db` schema.
- [x] Strict safety maintained: **Zero tables, rows, or schemas modified in `shiksha-core-db`**.
