# ShikshaSahayak Core Database (`shiksha-core-db`)
## Unified Cloudflare D1 Schema & Migration Blueprint for Antigravity

> **Purpose:** Create one canonical Cloudflare D1 database for the ShikshaSahayak by combining the strongest parts of the existing **Keydocs** database and **Assessment** database while preserving existing relationships and data.
>
> **Target database:** `shiksha-core-db`
>
> **Current source databases:**
> - Keydocs D1: `d0d22669-42aa-4c36-b9e3-c3aace80cad4`
> - Assessment D1: `352efef7-24bb-418c-8158-92144fc7f821`
>
> **Important:** This document is a design and migration blueprint. Do NOT destroy or rewrite either production database until the schema is verified and a tested migration plan exists.

---

# 1. Design Goals

The new database must provide one consistent data model for:

- Firebase/application users
- Students
- Teachers
- Universities
- Courses/degrees
- Colleges
- Branches
- Subjects
- Study material
- PYQs
- Syllabus
- Notes/documents
- Blogs
- Announcements
- Quizzes
- Assignments
- Classes
- Attendance
- Grading
- Messaging
- Notifications
- Student engagement
- Beta access
- Admin/audit functionality
- File metadata

The new database must:

1. Have one canonical master-data hierarchy.
2. Use stable IDs for relationships.
3. Avoid duplicate universities/branches/subjects across systems.
4. Keep existing academic data intact during migration.
5. Keep semester as a normal field for now; **do not create a separate `semesters` table**.
6. Use Firebase UID as the identity bridge between Firebase Authentication and D1.
7. Keep passwords out of D1.
8. Use one document/file architecture for all portal content.
9. Use foreign keys where they are useful and safe.
10. Add indexes for all high-frequency lookup paths.
11. Use unique constraints for business identifiers that must not duplicate.
12. Be compatible with Cloudflare D1 / SQLite.

---

# 2. Canonical Academic Hierarchy

## User-facing hierarchy

The UI should follow:

**University → Course/Degree → College → Branch → Semester**

However, the database should NOT make College the parent of Branch.

Use this normalized model:

```text
University
 ├── Courses / Degrees
 ├── Colleges
 └── Branches
       └── Subjects
             └── Documents / Assessments

Student Profile
 ├── university_id
 ├── course_id
 ├── college_id
 ├── branch_id
 └── semester
```

This allows one branch, such as Information Technology, to be reused across many colleges.

---

# 3. Branch ID Convention

Branch IDs must use:

```text
{university_short_name}_{course_short_name}_{3_digit_branch_code}
```

Example:

```text
gtu_be_016
```

Meaning:

- `gtu` = Gujarat Technological University
- `be` = Bachelor of Engineering
- `016` = stable branch code

The branch ID is the **database identity**.

Keep a separate `code` field too.

Example:

```text
id = gtu_be_016
code = 016
name = Information Technology
short_name = IT
```

## Branch slug

**Do not create or keep a `slug` column in `branches`.**

The full branch ID is already a stable machine-readable identifier.

---

# 4. Global ID Rules

For master and content entities:

- IDs are TEXT.
- IDs should be globally unique.
- Prefer UUID/ULID or another stable generated identifier unless an entity explicitly has a business ID format.
- Do not expose random sequential database IDs for core entities.

Business-key exceptions:

- `branches.id` → `gtu_be_016`
- `courses.id` → e.g. `gtu_be`
- `universities.id` → e.g. `gtu`

Never change a referenced primary key after production data exists without a controlled migration.

---

# 5. Identity & Access Tables

## 5.1 `users`

Canonical application identity.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PK | Internal application user ID |
| `firebase_uid` | TEXT | UNIQUE, NOT NULL | Firebase Auth UID |
| `email` | TEXT | UNIQUE, NOT NULL | Verified login email |
| `display_name` | TEXT | NULL | Display name |
| `user_type` | TEXT | NOT NULL | `student`, `teacher`, `admin`, `staff` |
| `status` | TEXT | NOT NULL DEFAULT `active` | `active`, `suspended`, `disabled` |
| `created_at` | TEXT | NOT NULL | ISO timestamp |
| `updated_at` | TEXT | NOT NULL | ISO timestamp |

### Indexes

```sql
CREATE UNIQUE INDEX idx_users_firebase_uid
ON users(firebase_uid);

CREATE UNIQUE INDEX idx_users_email
ON users(email);
```

### Notes

- Firebase Authentication handles authentication credentials.
- Do NOT store passwords here.
- Firebase UID is the permanent identity bridge.

---

## 5.2 `user_roles`

Optional normalized role table.

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `user_id` | TEXT | FK → `users.id` |
| `role` | TEXT | NOT NULL |
| `granted_by` | TEXT | FK → `users.id`, NULL |
| `granted_at` | TEXT | NOT NULL |
| `revoked_at` | TEXT | NULL |

Unique:

```text
UNIQUE(user_id, role)
```

---

## 5.3 `user_access`

General application access/feature authorization.

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `user_id` | TEXT | FK → `users.id` |
| `access_type` | TEXT | NOT NULL |
| `status` | TEXT | NOT NULL |
| `granted_by` | TEXT | FK → `users.id`, NULL |
| `granted_at` | TEXT | NOT NULL |
| `expires_at` | TEXT | NULL |
| `notes` | TEXT | NULL |

Example:

```text
access_type = beta
status = approved
```

---

# 6. Academic Master Data

## 6.1 `universities`

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `name` | TEXT | NOT NULL |
| `short_name` | TEXT | NOT NULL |
| `created_at` | TEXT | NOT NULL |
| `updated_at` | TEXT | NOT NULL |

Example:

```text
id = gtu
name = Gujarat Technological University
short_name = GTU
```

---

## 6.2 `courses`

Represents a course/degree such as Bachelor of Engineering.

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `university_id` | TEXT | FK → `universities.id`, NOT NULL |
| `code` | TEXT | NOT NULL |
| `name` | TEXT | NOT NULL |
| `short_name` | TEXT | NOT NULL |
| `level` | TEXT | NULL |
| `created_at` | TEXT | NOT NULL |
| `updated_at` | TEXT | NOT NULL |

Recommended unique constraint:

```text
UNIQUE(university_id, code)
```

Example:

```text
id = gtu_be
code = BE
name = Bachelor of Engineering
short_name = BE
```

---

## 6.3 `colleges`

Canonical college master data.

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `university_id` | TEXT | FK → `universities.id`, NOT NULL |
| `college_code` | TEXT | NULL |
| `name` | TEXT | NOT NULL |
| `short_name` | TEXT | NULL |
| `city` | TEXT | NULL |
| `district` | TEXT | NULL |
| `state` | TEXT | NULL |
| `is_active` | INTEGER | DEFAULT 1 |
| `created_at` | TEXT | NOT NULL |
| `updated_at` | TEXT | NOT NULL |

college id = {university short name_college_code}

Indexes:

```text
UNIQUE(university_id, college_code)
INDEX(university_id, name)
```

---

## 6.4 `branches`

Canonical branch master table.

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `university_id` | TEXT | FK → `universities.id`, NOT NULL |
| `course_id` | TEXT | FK → `courses.id`, NOT NULL |
| `code` | TEXT | NOT NULL |
| `name` | TEXT | NOT NULL |
| `short_name` | TEXT | NULL |
| `display_order` | INTEGER | NULL |
| `is_active` | INTEGER | DEFAULT 1 |
| `created_at` | TEXT | NOT NULL |
| `updated_at` | TEXT | NOT NULL |

Business example:

```text
id = gtu_be_016
university_id = gtu
course_id = gtu_be
code = 016
name = Information Technology
short_name = IT
```

Constraints:

```text
UNIQUE(university_id, course_id, code)
```

**Do not include `slug`.**

---

## 6.5 `subject_groups`

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `name` | TEXT | NOT NULL |
| `created_at` | TEXT | NOT NULL |
| `updated_at` | TEXT | NOT NULL |

---

## 6.6 `subjects`

Semester remains an INTEGER field.

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `university_id` | TEXT | FK → `universities.id` |
| `branch_id` | TEXT | FK → `branches.id` |
| `semester` | INTEGER | NOT NULL |
| `name` | TEXT | NOT NULL |
| `subject_group_id` | TEXT | FK → `subject_groups.id`, NULL |
| `wef_year` | INTEGER | NULL |
| `created_at` | TEXT | NOT NULL |
| `updated_at` | TEXT | NOT NULL |

id = subject code 
ex BE01000531
Recommended indexes:

```text
INDEX(branch_id, semester)
INDEX(university_id, branch_id, semester)
UNIQUE(branch_id, semester, code)
```

**Do not create a `semesters` table at this stage.**

---

# 7. Student Tables

## 7.1 `student_profiles`

This is the canonical student profile table.

| Column | Type | Constraints |
|---|---|---|
| `user_id` | TEXT | PK + FK → `users.id` |
| `full_name` | TEXT | NOT NULL |
| `email` | TEXT | NOT NULL |
| `phone_number` | TEXT | NULL |
| `dob` | TEXT | NULL |
| `university_id` | TEXT | FK → `universities.id` |
| `course_id` | TEXT | FK → `courses.id` |
| `college_id` | TEXT | FK → `colleges.id` |
| `branch_id` | TEXT | FK → `branches.id` |
| `semester` | INTEGER | NULL |
| `enrollment_number` | TEXT | NULL |
| `enrollment_year` | INTEGER | NULL |
| `graduation_year` | INTEGER | NULL |
| `goals` | TEXT | NULL |
| `avatar_url` | TEXT | NULL |
| `marks_10th` | TEXT | NULL |
| `marks_12th` | TEXT | NULL |
| `special_skills` | TEXT | NULL |
| `languages_known` | TEXT | NULL |
| `experience` | TEXT | NULL |
| `certifications` | TEXT | NULL |
| `created_at` | TEXT | NOT NULL |
| `updated_at` | TEXT | NOT NULL |

### Important

If the current application has a separate `firebase_uid` column in `student_profile`, normalize it through `users.firebase_uid` and prefer `student_profiles.user_id → users.id`.

If the current application architecture absolutely requires direct `firebase_uid` lookup, it can temporarily remain as a UNIQUE column during migration, but `users` should become the canonical identity.

---

## 7.2 `teacher_profiles`

| Column | Type | Constraints |
|---|---|---|
| `user_id` | TEXT | PK + FK → `users.id` |
| `full_name` | TEXT | NOT NULL |
| `institution` | TEXT | NULL |
| `department` | TEXT | NULL |
| `designation` | TEXT | NULL |
| `subjects_json` | TEXT | NULL |
| `branches_json` | TEXT | NULL |
| `semesters_json` | TEXT | NULL |
| `is_onboarded` | INTEGER | DEFAULT 0 |
| `created_at` | TEXT | NOT NULL |
| `updated_at` | TEXT | NOT NULL |

---

# 8. Content / Document System

Use the Keydocs document model as the canonical content system.

## 8.1 `documents`

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `document_type` | TEXT | NOT NULL |
| `university_id` | TEXT | FK → `universities.id`, NULL |
| `branch_id` | TEXT | FK → `branches.id`, NULL |
| `semester` | INTEGER | NULL |
| `subject_id` | TEXT | FK → `subjects.id`, NULL |
| `title` | TEXT | NOT NULL |
| `description` | TEXT | NULL |
| `approval_status` | TEXT | DEFAULT `pending` |
| `uploaded_by` | TEXT | FK → `users.id`, NULL |
| `approved_by` | TEXT | FK → `users.id`, NULL |
| `approved_at` | TEXT | NULL |
| `blog_id` | TEXT | FK → `blogs.id`, NULL |
| `parent_document_id` | TEXT | FK → `documents.id`, NULL |
| `paper_year` | INTEGER | NULL |
| `season` | TEXT | NULL |
| `exam_label` | TEXT | NULL |
| `syllabus_year` | INTEGER | NULL |
| `regulation` | TEXT | NULL |
| `version_label` | TEXT | NULL |
| `material_kind` | TEXT | NULL |
| `unit_no` | INTEGER | NULL |
| `chapter` | TEXT | NULL |
| `topic` | TEXT | NULL |
| `author` | TEXT | NULL |
| `created_at` | TEXT | NOT NULL |
| `updated_at` | TEXT | NOT NULL |

---

## 8.2 `file_assets`

Physical/object storage metadata.

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `content_hash` | TEXT | UNIQUE, NULL |
| `original_filename` | TEXT | NULL |
| `storage_key` | TEXT | UNIQUE, NOT NULL |
| `mime_type` | TEXT | NULL |
| `size_bytes` | INTEGER | NULL |
| `created_at` | TEXT | NOT NULL |

---

## 8.3 `document_files`

Connects documents to file assets.

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `document_id` | TEXT | FK → `documents.id` |
| `file_asset_id` | TEXT | FK → `file_assets.id`, NULL |
| `file_type` | TEXT | NULL |
| `original_filename` | TEXT | NULL |
| `storage_key` | TEXT | NULL |
| `file_url` | TEXT | NULL |
| `mime_type` | TEXT | NULL |
| `size_bytes` | INTEGER | NULL |
| `is_primary` | INTEGER | DEFAULT 0 |
| `created_at` | TEXT | NOT NULL |

Index:

```text
INDEX(document_id)
```

---

## 8.4 `pyq_details`

| Column | Type | Constraints |
|---|---|---|
| `document_id` | TEXT | PK + FK → `documents.id` |
| `paper_year` | INTEGER | NULL |
| `season` | TEXT | NULL |
| `exam_label` | TEXT | NULL |

---

## 8.5 `syllabus_details`

| Column | Type | Constraints |
|---|---|---|
| `document_id` | TEXT | PK + FK → `documents.id` |
| `syllabus_year` | INTEGER | NULL |
| `regulation` | TEXT | NULL |
| `version_label` | TEXT | NULL |

---

## 8.6 `study_material_details`

| Column | Type | Constraints |
|---|---|---|
| `document_id` | TEXT | PK + FK → `documents.id` |
| `material_kind` | TEXT | NULL |
| `unit_no` | INTEGER | NULL |
| `chapter` | TEXT | NULL |
| `topic` | TEXT | NULL |
| `author` | TEXT | NULL |

---

## 8.7 `document_stats`

| Column | Type | Constraints |
|---|---|---|
| `document_id` | TEXT | PK + FK → `documents.id` |
| `views` | INTEGER | DEFAULT 0 |
| `likes` | INTEGER | DEFAULT 0 |
| `downloads` | INTEGER | DEFAULT 0 |
| `updated_at` | TEXT | NOT NULL |

---

# 9. Blogs & Announcements

## 9.1 `blogs`

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `related_document_id` | TEXT | FK → `documents.id`, NULL |
| `title` | TEXT | NOT NULL |
| `content` | TEXT | NOT NULL |
| `author` | TEXT | NULL |
| `category` | TEXT | NULL |
| `tags` | TEXT | NULL |
| `thumbnail` | TEXT | NULL |
| `status` | TEXT | DEFAULT `draft` |
| `views` | INTEGER | DEFAULT 0 |
| `created_at` | TEXT | NOT NULL |
| `updated_at` | TEXT | NOT NULL |

---

## 9.2 `announcements`

Use one canonical platform/class announcement table with optional scope.

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `created_by` | TEXT | FK → `users.id` |
| `class_id` | TEXT | FK → `classes.id`, NULL |
| `title` | TEXT | NOT NULL |
| `content` | TEXT | NOT NULL |
| `priority` | TEXT | NULL |
| `target_audience` | TEXT | NULL |
| `channels` | TEXT | NULL |
| `attachments` | TEXT | NULL |
| `is_published` | INTEGER | DEFAULT 0 |
| `published_at` | TEXT | NULL |
| `expires_at` | TEXT | NULL |
| `pin_to_top` | INTEGER | DEFAULT 0 |
| `allow_comments` | INTEGER | DEFAULT 0 |
| `created_at` | TEXT | NOT NULL |
| `updated_at` | TEXT | NOT NULL |

---

## 9.3 `announcement_reads`

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `announcement_id` | TEXT | FK → `announcements.id` |
| `user_id` | TEXT | FK → `users.id` |
| `read_at` | TEXT | NOT NULL |

Unique:

```text
UNIQUE(announcement_id, user_id)
```

---

# 10. Quiz System

## 10.1 `quizzes`

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `subject_id` | TEXT | FK → `subjects.id`, NULL |
| `title` | TEXT | NOT NULL |
| `code` | TEXT | NULL |
| `category` | TEXT | NULL |
| `duration` | INTEGER | NULL |
| `questions_count` | INTEGER | DEFAULT 0 |
| `difficulty` | TEXT | NULL |
| `xp_reward` | INTEGER | DEFAULT 0 |
| `published` | INTEGER | DEFAULT 0 |
| `created_at` | TEXT | NOT NULL |
| `updated_at` | TEXT | NOT NULL |

Do not use a free-text `subject` field when a canonical `subject_id` is available.

---

## 10.2 `questions`

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `quiz_id` | TEXT | FK → `quizzes.id` |
| `question` | TEXT | NOT NULL |
| `options` | TEXT | NULL |
| `correct_answer` | INTEGER | NULL |
| `explanation` | TEXT | NULL |
| `created_at` | TEXT | NOT NULL |

---

## 10.3 `quiz_attempts`

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `quiz_id` | TEXT | FK → `quizzes.id` |
| `user_id` | TEXT | FK → `users.id` |
| `score` | INTEGER | NULL |
| `xp_earned` | INTEGER | DEFAULT 0 |
| `coins_earned` | INTEGER | DEFAULT 0 |
| `attempted_at` | TEXT | NOT NULL |

---

## 10.4 `quiz_class_assignments`

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `quiz_id` | TEXT | FK → `quizzes.id` |
| `class_id` | TEXT | FK → `classes.id` |
| `assigned_at` | TEXT | NOT NULL |
| `is_visible` | INTEGER | DEFAULT 1 |

Unique:

```text
UNIQUE(quiz_id, class_id)
```

---

# 11. Classroom / LMS

## 11.1 `classes`

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `teacher_id` | TEXT | FK → `users.id` |
| `subject_id` | TEXT | FK → `subjects.id`, NULL |
| `name` | TEXT | NOT NULL |
| `description` | TEXT | NULL |
| `section` | TEXT | NULL |
| `semester` | INTEGER | NULL |
| `academic_year` | TEXT | NULL |
| `join_code` | TEXT | UNIQUE |
| `grading_system` | TEXT | NULL |
| `max_students` | INTEGER | NULL |
| `is_active` | INTEGER | DEFAULT 1 |
| `cover_image` | TEXT | NULL |
| `created_at` | TEXT | NOT NULL |
| `updated_at` | TEXT | NOT NULL |

---

## 11.2 `class_enrollments`

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `class_id` | TEXT | FK → `classes.id` |
| `student_id` | TEXT | FK → `users.id` |
| `enrollment_number` | TEXT | NULL |
| `enrollment_status` | TEXT | DEFAULT `active` |
| `enrolled_at` | TEXT | NOT NULL |
| `withdrawn_at` | TEXT | NULL |
| `final_grade` | TEXT | NULL |
| `is_placeholder` | INTEGER | DEFAULT 0 |
| `invitation_sent_at` | TEXT | NULL |
| `invitation_accepted_at` | TEXT | NULL |

Unique:

```text
UNIQUE(class_id, student_id)
```

---

## 11.3 `class_materials`

Reference the unified document system.

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `class_id` | TEXT | FK → `classes.id` |
| `document_id` | TEXT | FK → `documents.id` |
| `title` | TEXT | NULL |
| `description` | TEXT | NULL |
| `is_visible` | INTEGER | DEFAULT 1 |
| `uploaded_by` | TEXT | FK → `users.id` |
| `created_at` | TEXT | NOT NULL |
| `updated_at` | TEXT | NOT NULL |

Avoid storing separate `file_url`, `file_name`, `file_type`, etc. here when the same content can use `documents → document_files → file_assets`.

---

# 12. Assignments

## 12.1 `assignments`

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `class_id` | TEXT | FK → `classes.id` |
| `title` | TEXT | NOT NULL |
| `description` | TEXT | NULL |
| `instructions` | TEXT | NULL |
| `status` | TEXT | DEFAULT `draft` |
| `total_marks` | REAL | NULL |
| `due_date` | TEXT | NULL |
| `published_at` | TEXT | NULL |
| `allow_late_submission` | INTEGER | DEFAULT 0 |
| `late_penalty_percent` | REAL | NULL |
| `max_file_size_mb` | REAL | NULL |
| `allowed_file_types` | TEXT | NULL |
| `rubric` | TEXT | NULL |
| `attachments` | TEXT | NULL |
| `created_by` | TEXT | FK → `users.id` |
| `created_at` | TEXT | NOT NULL |
| `updated_at` | TEXT | NOT NULL |

---

## 12.2 `assignment_questions`

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `assignment_id` | TEXT | FK → `assignments.id` |
| `question_number` | INTEGER | NOT NULL |
| `question_text` | TEXT | NOT NULL |
| `question_type` | TEXT | NULL |
| `max_marks` | REAL | NULL |
| `options` | TEXT | NULL |
| `correct_answer` | TEXT | NULL |
| `required` | INTEGER | DEFAULT 1 |
| `created_at` | TEXT | NOT NULL |

Unique:

```text
UNIQUE(assignment_id, question_number)
```

---

## 12.3 `assignment_submissions`

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `assignment_id` | TEXT | FK → `assignments.id` |
| `student_id` | TEXT | FK → `users.id` |
| `status` | TEXT | NULL |
| `text_content` | TEXT | NULL |
| `attachments` | TEXT | NULL |
| `external_links` | TEXT | NULL |
| `submitted_at` | TEXT | NULL |
| `graded_at` | TEXT | NULL |
| `graded_by` | TEXT | FK → `users.id`, NULL |
| `marks` | REAL | NULL |
| `feedback` | TEXT | NULL |
| `annotations` | TEXT | NULL |
| `is_late` | INTEGER | DEFAULT 0 |
| `resubmit_count` | INTEGER | DEFAULT 0 |
| `created_at` | TEXT | NOT NULL |
| `updated_at` | TEXT | NOT NULL |

---

## 12.4 `submission_answers`

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `submission_id` | TEXT | FK → `assignment_submissions.id` |
| `question_id` | TEXT | FK → `assignment_questions.id` |
| `answer_text` | TEXT | NULL |
| `answer_file` | TEXT | NULL |
| `marks_awarded` | REAL | NULL |
| `feedback` | TEXT | NULL |
| `created_at` | TEXT | NOT NULL |
| `updated_at` | TEXT | NOT NULL |

Unique:

```text
UNIQUE(submission_id, question_id)
```

---

# 13. Assignment Templates

## `assignment_templates`

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `created_by` | TEXT | FK → `users.id` |
| `title` | TEXT | NOT NULL |
| `description` | TEXT | NULL |
| `instructions` | TEXT | NULL |
| `total_marks` | INTEGER | NULL |
| `default_due_days` | INTEGER | NULL |
| `allow_late_submission` | INTEGER | DEFAULT 0 |
| `late_penalty_percent` | INTEGER | NULL |
| `max_file_size_mb` | INTEGER | NULL |
| `allowed_file_types` | TEXT | NULL |
| `rubric` | TEXT | NULL |
| `questions` | TEXT | NULL |
| `attachments` | TEXT | NULL |
| `tags` | TEXT | NULL |
| `is_public` | INTEGER | DEFAULT 0 |
| `usage_count` | INTEGER | DEFAULT 0 |
| `created_at` | TEXT | NOT NULL |
| `updated_at` | TEXT | NOT NULL |

---

# 14. Grading / Peer Review

## `rubric_scores`

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `submission_id` | TEXT | FK → `assignment_submissions.id` |
| `criterion_id` | TEXT | NULL |
| `points` | REAL | NULL |
| `max_points` | REAL | NULL |
| `feedback` | TEXT | NULL |
| `graded_by` | TEXT | FK → `users.id` |
| `graded_at` | TEXT | NOT NULL |
| `created_at` | TEXT | NOT NULL |
| `updated_at` | TEXT | NOT NULL |

---

## `question_grades`

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `submission_id` | TEXT | FK → `assignment_submissions.id` |
| `question_id` | TEXT | FK → `assignment_questions.id` |
| `marks` | REAL | NULL |
| `max_marks` | REAL | NULL |
| `feedback` | TEXT | NULL |
| `graded_by` | TEXT | FK → `users.id` |
| `graded_at` | TEXT | NOT NULL |
| `created_at` | TEXT | NOT NULL |
| `updated_at` | TEXT | NOT NULL |

---

## `grade_audit_log`

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `submission_id` | TEXT | FK → `assignment_submissions.id` |
| `old_marks` | REAL | NULL |
| `new_marks` | REAL | NULL |
| `old_status` | TEXT | NULL |
| `new_status` | TEXT | NULL |
| `reason` | TEXT | NULL |
| `changed_by` | TEXT | FK → `users.id` |
| `changed_at` | TEXT | NOT NULL |
| `created_at` | TEXT | NOT NULL |

---

## `peer_review_assignments`

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `assignment_id` | TEXT | FK → `assignments.id` |
| `reviewer_id` | TEXT | FK → `users.id` |
| `reviewee_submission_id` | TEXT | FK → `assignment_submissions.id` |
| `status` | TEXT | NULL |
| `review_rubric` | TEXT | NULL |
| `review_feedback` | TEXT | NULL |
| `review_scores` | TEXT | NULL |
| `total_score` | REAL | NULL |
| `max_score` | REAL | NULL |
| `submitted_at` | TEXT | NULL |
| `due_date` | TEXT | NULL |
| `created_at` | TEXT | NOT NULL |
| `updated_at` | TEXT | NOT NULL |

---

## `grade_distributions`

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `assignment_id` | TEXT | FK → `assignments.id` |
| `class_id` | TEXT | FK → `classes.id` |
| `period_type` | TEXT | NULL |
| `distribution_data` | TEXT | NULL |
| `calculated_at` | TEXT | NOT NULL |
| `expires_at` | TEXT | NULL |

---

# 15. Attendance

Use ONE attendance system. Do not keep both the old Keydocs `teacher_attendance_*` tables and the Assessment attendance tables.

## `attendance_sessions`

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `teacher_id` | TEXT | FK → `users.id` |
| `class_id` | TEXT | FK → `classes.id` |
| `subject_id` | TEXT | FK → `subjects.id`, NULL |
| `session_date` | TEXT | NULL |
| `class_name` | TEXT | NULL |
| `session_code` | TEXT | NULL |
| `challenge_word` | TEXT | NULL |
| `qr_code_token` | TEXT | UNIQUE, NULL |
| `duration_minutes` | INTEGER | NULL |
| `geofence_enabled` | INTEGER | DEFAULT 0 |
| `geofence_latitude` | REAL | NULL |
| `geofence_longitude` | REAL | NULL |
| `geofence_radius_meters` | REAL | NULL |
| `starts_at` | TEXT | NULL |
| `expires_at` | TEXT | NULL |
| `is_active` | INTEGER | DEFAULT 1 |
| `created_by` | TEXT | FK → `users.id` |
| `created_at` | TEXT | NOT NULL |

---

## `attendance_records`

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `session_id` | TEXT | FK → `attendance_sessions.id` |
| `student_id` | TEXT | FK → `users.id` |
| `status` | TEXT | NOT NULL |
| `notes` | TEXT | NULL |
| `recorded_by` | TEXT | FK → `users.id` |
| `recorded_at` | TEXT | NOT NULL |

Unique:

```text
UNIQUE(session_id, student_id)
```

---

## `attendance_submissions`

For QR/geofence/self check-in.

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `session_id` | TEXT | FK → `attendance_sessions.id` |
| `student_id` | TEXT | FK → `users.id` |
| `student_name` | TEXT | NULL |
| `enrollment_number` | TEXT | NULL |
| `latitude` | REAL | NULL |
| `longitude` | REAL | NULL |
| `distance_meters` | REAL | NULL |
| `status` | TEXT | NULL |
| `submitted_at` | TEXT | NOT NULL |

---

# 16. Teacher Departments

## `teacher_departments`

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `teacher_id` | TEXT | FK → `users.id` |
| `department_id` | TEXT | NULL |
| `hierarchy` | TEXT | NULL |
| `assigned_at` | TEXT | NOT NULL |
| `is_primary` | INTEGER | DEFAULT 0 |

---

# 17. Student Engagement

## `student_stats`

| Column | Type | Constraints |
|---|---|---|
| `user_id` | TEXT | PK + FK → `users.id` |
| `xp` | INTEGER | DEFAULT 0 |
| `coins` | INTEGER | DEFAULT 0 |
| `level` | INTEGER | DEFAULT 1 |
| `streak` | INTEGER | DEFAULT 0 |
| `longest_streak` | INTEGER | DEFAULT 0 |
| `last_active` | TEXT | NULL |
| `claimed_daily_reward` | INTEGER | DEFAULT 0 |

---

## `student_projects`

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `title` | TEXT | NOT NULL |
| `author` | TEXT | NULL |
| `dept` | TEXT | NULL |
| `github` | TEXT | NULL |
| `desc` | TEXT | NULL |
| `status` | TEXT | NULL |
| `upvotes` | INTEGER | DEFAULT 0 |
| `tech` | TEXT | NULL |
| `created_at` | TEXT | NOT NULL |

Prefer adding `created_by/user_id` later if project ownership needs stronger identity.

---

## `material_stats`

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `material_id` | TEXT | FK → `documents.id` |
| `student_id` | TEXT | FK → `users.id` |
| `viewed_at` | TEXT | NULL |
| `download_count` | INTEGER | DEFAULT 0 |
| `last_accessed` | TEXT | NULL |

---

# 18. Messaging

## `message_threads`

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `title` | TEXT | NULL |
| `thread_type` | TEXT | NULL |
| `created_by` | TEXT | FK → `users.id` |
| `class_id` | TEXT | FK → `classes.id`, NULL |
| `assignment_id` | TEXT | FK → `assignments.id`, NULL |
| `is_archived` | INTEGER | DEFAULT 0 |
| `last_message_at` | TEXT | NULL |
| `created_at` | TEXT | NOT NULL |
| `updated_at` | TEXT | NOT NULL |

---

## `thread_participants`

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `thread_id` | TEXT | FK → `message_threads.id` |
| `user_id` | TEXT | FK → `users.id` |
| `role` | TEXT | NULL |
| `joined_at` | TEXT | NOT NULL |
| `last_read_at` | TEXT | NULL |
| `is_muted` | INTEGER | DEFAULT 0 |
| `notification_preferences` | TEXT | NULL |

Unique:

```text
UNIQUE(thread_id, user_id)
```

---

## `messages`

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `thread_id` | TEXT | FK → `message_threads.id` |
| `sender_id` | TEXT | FK → `users.id` |
| `message_type` | TEXT | NULL |
| `content` | TEXT | NULL |
| `attachments` | TEXT | NULL |
| `reply_to_message_id` | TEXT | FK → `messages.id`, NULL |
| `is_edited` | INTEGER | DEFAULT 0 |
| `edited_at` | TEXT | NULL |
| `sent_at` | TEXT | NOT NULL |

---

## `message_read_receipts`

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `message_id` | TEXT | FK → `messages.id` |
| `user_id` | TEXT | FK → `users.id` |
| `read_at` | TEXT | NOT NULL |

Unique:

```text
UNIQUE(message_id, user_id)
```

---

## `typing_indicators`

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `thread_id` | TEXT | FK → `message_threads.id` |
| `user_id` | TEXT | FK → `users.id` |
| `is_typing` | INTEGER | DEFAULT 0 |
| `updated_at` | TEXT | NOT NULL |

---

# 19. Notifications

## `notifications`

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `user_id` | TEXT | FK → `users.id` |
| `type` | TEXT | NULL |
| `channel` | TEXT | NULL |
| `title` | TEXT | NOT NULL |
| `message` | TEXT | NOT NULL |
| `link` | TEXT | NULL |
| `metadata` | TEXT | NULL |
| `is_read` | INTEGER | DEFAULT 0 |
| `read_at` | TEXT | NULL |
| `created_at` | TEXT | NOT NULL |

Index:

```text
INDEX(user_id, is_read, created_at)
```

---

# 20. Parent Communications

Keep this as an optional module.

## `parent_communications`

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `student_id` | TEXT | FK → `users.id` |
| `parent_email` | TEXT | NULL |
| `parent_name` | TEXT | NULL |
| `parent_phone` | TEXT | NULL |
| `communication_type` | TEXT | NULL |
| `subject` | TEXT | NULL |
| `message` | TEXT | NULL |
| `attachments` | TEXT | NULL |
| `sent_by` | TEXT | FK → `users.id` |
| `sent_at` | TEXT | NULL |
| `delivery_status` | TEXT | NULL |
| `delivery_attempts` | INTEGER | DEFAULT 0 |
| `last_attempt_at` | TEXT | NULL |
| `error_message` | TEXT | NULL |

---

# 21. Platform / Admin

## `website_popups`

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `title` | TEXT | NOT NULL |
| `type` | TEXT | NULL |
| `html_content` | TEXT | NULL |
| `is_active` | INTEGER | DEFAULT 0 |
| `start_date` | TEXT | NULL |
| `end_date` | TEXT | NULL |
| `frequency` | TEXT | NULL |
| `expiry_days` | INTEGER | NULL |
| `created_at` | TEXT | NOT NULL |
| `updated_at` | TEXT | NOT NULL |

---

## `bug_reports`

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `user_id` | TEXT | FK → `users.id`, NULL |
| `user_email` | TEXT | NULL |
| `description` | TEXT | NOT NULL |
| `screenshot_url` | TEXT | NULL |
| `error_stack` | TEXT | NULL |
| `browser_info` | TEXT | NULL |
| `status` | TEXT | DEFAULT `pending` |
| `created_at` | TEXT | NOT NULL |
| `updated_at` | TEXT | NOT NULL |

---

## `admin_audit_logs`

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PK |
| `admin_id` | TEXT | FK → `users.id` |
| `action` | TEXT | NOT NULL |
| `resource_type` | TEXT | NULL |
| `resource_id` | TEXT | NULL |
| `details` | TEXT | NULL |
| `details_json` | TEXT | NULL |
| `ip_address` | TEXT | NULL |
| `created_at` | TEXT | NOT NULL |

---

## `feature_flags`

| Column | Type | Constraints |
|---|---|---|
| `flag_key` | TEXT | PK |
| `is_enabled` | INTEGER | DEFAULT 0 |
| `description` | TEXT | NULL |
| `updated_by` | TEXT | FK → `users.id`, NULL |
| `updated_at` | TEXT | NOT NULL |

---

# 22. Migrations & SQLite Internal Tables

Keep Cloudflare/SQLite migration support.

## `d1_migrations`

| Column | Type | Constraints |
|---|---|---|
| `id` | INTEGER | PK |
| `name` | TEXT | NOT NULL |
| `applied_at` | TIMESTAMP | NOT NULL |

Do not manually manage SQLite internal tables such as `sqlite_sequence`.

---

# 23. Important Indexes

Create indexes for the following high-frequency relationships.

```sql
CREATE INDEX idx_courses_university
ON courses(university_id);

CREATE INDEX idx_colleges_university
ON colleges(university_id);

CREATE INDEX idx_branches_university_course
ON branches(university_id, course_id);

CREATE INDEX idx_subjects_branch_semester
ON subjects(branch_id, semester);

CREATE INDEX idx_documents_branch_semester
ON documents(branch_id, semester);

CREATE INDEX idx_documents_subject
ON documents(subject_id);

CREATE INDEX idx_document_files_document
ON document_files(document_id);

CREATE INDEX idx_class_enrollments_student
ON class_enrollments(student_id);

CREATE INDEX idx_class_enrollments_class
ON class_enrollments(class_id);

CREATE INDEX idx_assignments_class
ON assignments(class_id);

CREATE INDEX idx_submissions_student
ON assignment_submissions(student_id);

CREATE INDEX idx_quiz_attempts_user
ON quiz_attempts(user_id);

CREATE INDEX idx_attendance_records_student
ON attendance_records(student_id);

CREATE INDEX idx_attendance_records_session
ON attendance_records(session_id);

CREATE INDEX idx_notifications_user_read
ON notifications(user_id, is_read);

CREATE INDEX idx_messages_thread
ON messages(thread_id);
```

---

# 24. Foreign Key Policy

Enable SQLite foreign keys:

```sql
PRAGMA foreign_keys = ON;
```

Use `ON DELETE` carefully.

Recommended default:

```text
ON DELETE RESTRICT
```

for academic master data such as:

- universities
- courses
- colleges
- branches
- subjects

Do NOT allow accidental cascading deletion of large academic trees.

For child/transaction data where ownership is explicit, use appropriate cascading only when safe.

Example:

```text
documents → document_files
assignments → assignment_questions
assignment_submissions → submission_answers
message_threads → thread_participants
```

may safely use controlled `ON DELETE CASCADE` after verification.

---

# 25. Data Integrity Rules

## Users

```text
users.firebase_uid UNIQUE
users.email UNIQUE
```

## Branches

```text
branches.id = {university}_{course}_{3-digit-code}
UNIQUE(university_id, course_id, code)
```

## Subjects

Prevent duplicate subject codes in the same branch/semester:

```text
UNIQUE(branch_id, semester, code)
```

## Class enrollments

```text
UNIQUE(class_id, student_id)
```

## Quiz class assignment

```text
UNIQUE(quiz_id, class_id)
```

## Announcement reads

```text
UNIQUE(announcement_id, user_id)
```

## Thread participants

```text
UNIQUE(thread_id, user_id)
```

## Message receipts

```text
UNIQUE(message_id, user_id)
```

---

# 26. What is intentionally NOT included

Do NOT create these tables in the first version:

## `semesters`

Not needed yet.

Use:

```text
semester INTEGER
```

directly in:

- student_profiles
- subjects
- documents
- classes

A dedicated semester table can be introduced later only if semester becomes an entity with its own metadata, curriculum versions, dates, regulation, etc.

## `branches.slug`

Do not create it.

The branch ID is the canonical machine identifier.

## Duplicate user systems

Do not keep both:

```text
users
unified_users
```

Use one canonical `users`.

## Duplicate student profile systems

Do not keep both:

```text
student_profiles
academic_profiles
```

unless a future requirement proves they need to be separate.

## Duplicate attendance systems

Do not keep both:

```text
teacher_attendance_sessions
teacher_attendance_records
```

and:

```text
attendance_sessions
attendance_records
```

Use one unified attendance model.

---

# 27. Existing Database → New Database Mapping

## Keydocs

| Existing | New |
|---|---|
| `universities` | `universities` |
| `branches` | `branches` |
| `subjects` | `subjects` |
| `subject_groups` | `subject_groups` |
| `documents` | `documents` |
| `document_files` | `document_files` |
| `file_assets` | `file_assets` |
| `pyq_details` | `pyq_details` |
| `syllabus_details` | `syllabus_details` |
| `study_material_details` | `study_material_details` |
| `document_stats` | `document_stats` |
| `blogs` | `blogs` |
| `announcements` | `announcements` |
| `website_popups` | `website_popups` |
| `bug_reports` | `bug_reports` |
| `teacher_profiles` | `teacher_profiles` |
| `class_enrollments` | `class_enrollments` |
| `teacher_attendance_sessions` | merge into `attendance_sessions` |
| `teacher_attendance_records` | merge into `attendance_records` |
| `admin_audit_logs` | `admin_audit_logs` |

## Assessment

| Existing | New |
|---|---|
| `users` | `users` |
| `unified_users` | merge into `users` |
| `student_profiles` | `student_profiles` |
| `academic_profiles` | merge useful fields into `student_profiles` |
| `branches` | `branches` |
| `subjects` | `subjects` |
| `classes` | `classes` |
| `class_enrollments` | `class_enrollments` |
| `class_materials` | `class_materials` |
| `assignments` | `assignments` |
| `assignment_questions` | `assignment_questions` |
| `assignment_submissions` | `assignment_submissions` |
| `submission_answers` | `submission_answers` |
| `assignment_templates` | `assignment_templates` |
| `rubric_scores` | `rubric_scores` |
| `question_grades` | `question_grades` |
| `grade_audit_log` | `grade_audit_log` |
| `grade_distributions` | `grade_distributions` |
| `peer_review_assignments` | `peer_review_assignments` |
| `attendance_sessions` | `attendance_sessions` |
| `attendance_records` | `attendance_records` |
| `attendance_submissions` | `attendance_submissions` |
| `quizzes` | `quizzes` |
| `questions` | `questions` |
| `quiz_attempts` | `quiz_attempts` |
| `quiz_class_assignments` | `quiz_class_assignments` |
| `student_stats` | `student_stats` |
| `student_projects` | `student_projects` |
| `material_stats` | `material_stats` |
| `message_threads` | `message_threads` |
| `thread_participants` | `thread_participants` |
| `messages` | `messages` |
| `message_read_receipts` | `message_read_receipts` |
| `typing_indicators` | `typing_indicators` |
| `notifications` | `notifications` |
| `announcements` | `announcements` |
| `announcement_reads` | `announcement_reads` |
| `teacher_departments` | `teacher_departments` |
| `parent_communications` | `parent_communications` |
| `feature_flags` | `feature_flags` |
| `user_beta_access` | merge into `user_access` |

---

# 28. Migration Strategy

## IMPORTANT: Do not do an in-place destructive merge.

The current databases already contain data and relationships.

Create the new database:

```text
shiksha-core-db
```

and migrate into it.

Do NOT delete the old databases until the new system has been verified.

---

## Phase 1 — Schema

Create the complete new schema and migration files.

No data movement yet.

Run:

- foreign-key checks
- schema validation
- uniqueness checks

---

## Phase 2 — Master Data

Migrate first:

```text
universities
courses
colleges
branches
subject_groups
subjects
```

### Branch migration

Create an explicit mapping table during migration:

```text
branch_id_mapping
--------------------------------
old_branch_id
new_branch_id
```

Example:

```text
branch_it
→ gtu_be_016
```

DO NOT simply rename the production row before dependent rows are migrated.

---

## Phase 3 — Users

Migrate:

```text
users
student_profiles
teacher_profiles
user_roles
user_access
```

Map:

```text
old UID → canonical users.id
Firebase UID → users.firebase_uid
```

---

## Phase 4 — Content

Migrate:

```text
documents
file_assets
document_files
pyq_details
syllabus_details
study_material_details
document_stats
blogs
announcements
```

Update old branch/subject IDs through the mapping tables.

---

## Phase 5 — LMS/Assessment

Migrate:

```text
classes
class_enrollments
class_materials
quizzes
questions
quiz_attempts
assignments
assignment_questions
assignment_submissions
submission_answers
grading tables
attendance tables
messaging tables
notifications
student stats
```

---

# 29. Migration Safety Requirements

Before migration:

1. Export/backup both source databases.
2. Record row counts for every table.
3. Record foreign-key relationships.
4. Record distinct branch IDs.
5. Record distinct subject IDs.
6. Record distinct user IDs.
7. Create old→new ID mapping tables.
8. Run migration on a development/preview D1 database first.

After migration:

For every important source table:

```text
source_count == destination_count
```

unless a documented merge intentionally changes the count.

Also verify:

- no orphaned `branch_id`
- no orphaned `subject_id`
- no orphaned `document_id`
- no orphaned `user_id`
- no orphaned `class_id`
- no orphaned `assignment_id`

---

# 30. Verification Queries

## Foreign-key integrity

```sql
PRAGMA foreign_key_check;
```

Expected:

```text
zero rows
```

## Table list

```sql
SELECT name
FROM sqlite_master
WHERE type = 'table'
ORDER BY name;
```

## Branch check

```sql
SELECT id, university_id, course_id, code, name, short_name
FROM branches
ORDER BY university_id, course_id, code;
```

## Subject check

```sql
SELECT id, branch_id, semester, code, name
FROM subjects
ORDER BY branch_id, semester, code;
```

## Student profile check

```sql
SELECT
  user_id,
  email,
  university_id,
  course_id,
  college_id,
  branch_id,
  semester
FROM student_profiles;
```

---

# 31. Application Changes Required After Migration

Antigravity must update application code to use the unified schema.

## Academic selectors

Use:

```text
University
→ Course
→ College
→ Branch
→ Semester
```

Branch IDs must come from:

```text
branches.id
```

Example:

```text
gtu_be_016
```

No branch slug lookup.

---

## Student profile

Use:

```text
users.id
```

as the application user relation.

Use:

```text
users.firebase_uid
```

for Firebase identity.

---

## Content

Always resolve content through:

```text
documents
→ document_files
→ file_assets
```

where appropriate.

---

## Assessment

Connect assessments to canonical:

```text
subjects
classes
users
```

Do not duplicate academic text values where an ID exists.

---

# 32. Final Target Architecture

```text
                    FIREBASE AUTH
                         │
                    firebase_uid
                         │
                         ▼
                       users
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
 student_profiles   teacher_profiles   user_roles
        │                │
        │                ▼
        │              classes
        │                │
        │       ┌────────┼────────┐
        │       ▼        ▼        ▼
        │ assignments  quizzes attendance
        │
        ├── university_id ───────┐
        ├── course_id             │
        ├── college_id            │
        ├── branch_id             │
        └── semester              │
                                  ▼
                            Academic Master
                                  │
                ┌─────────────────┼──────────────────┐
                ▼                 ▼                  ▼
          universities        courses            colleges
                                  │
                                  ▼
                               branches
                                  │
                                  ▼
                               subjects
                                  │
                         ┌────────┴────────┐
                         ▼                 ▼
                    documents           quizzes
                         │
                  ┌──────┼───────┐
                  ▼      ▼       ▼
                 PYQ   syllabus  study material
                         │
                         ▼
                   document_files
                         │
                         ▼
                     file_assets
```

---

# 33. Non-Negotiable Rules for Antigravity

1. **Do not delete source databases.**
2. **Do not perform destructive migration directly on production.**
3. **Do not rename existing branch IDs before mapping every reference.**
4. **Do not create a `semesters` table in this version.**
5. **Do not add `branches.slug`.**
6. **Branch IDs must follow `university_course_code`, e.g. `gtu_be_016`.**
7. Keep `branches.code` separately as the 3-digit business code.
8. Do not create duplicate `users`/`unified_users` systems.
9. Do not create duplicate `student_profiles`/`academic_profiles` unless specifically justified.
10. Do not maintain two attendance systems.
11. Use canonical IDs instead of repeated free-text academic names where an entity exists.
12. Use foreign keys and indexes intentionally.
13. Run `PRAGMA foreign_key_check;` after migration.
14. Compare row counts before and after migration.
15. Keep rollback/backup capability until production verification is complete.

---

# 34. Implementation Instruction for Antigravity

Before writing migrations:

1. Inspect both existing D1 databases.
2. Inspect every table's actual columns, primary keys, foreign keys, indexes, and row counts.
3. Identify duplicate entities.
4. Produce an old→new mapping plan.
5. Confirm all assumptions against the real schemas.
6. Do not silently drop columns that contain existing data.
7. Create `shiksha-core-db`.
8. Apply schema migrations.
9. Populate master data.
10. Populate identity data.
11. Populate content data.
12. Populate assessment/LMS data.
13. Run integrity checks.
14. Run application tests.
15. Verify production-readiness.
16. Only after verification should the application be switched from the old databases to `shiksha-core-db`.

If the real schema differs from this blueprint, STOP and report the difference before making destructive changes.

