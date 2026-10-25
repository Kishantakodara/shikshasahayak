# SHIKSHA SAHAYAK — AUTOMATED ACADEMIC SUBJECT MASTER CSV FORMAT & SPECIFICATION

This document defines the official CSV specification for managing ShikshaSahayak's Engineering Subject Master. The CSV file acts as the authoritative source of truth across all engineering departments, semesters, subject codes, names, and syllabus URLs.

---

## 1. Supported CSV Formats

ShikshaSahayak's CSV parser supports **two** structural CSV formats:

### Format A: Block Header Format (Recommended for University Bulletins)
Standalone department header lines precede tables:
```csv
INFORMATION TECHNOLOGY

Sem,WEF,Subject Code,Subject Full Name,Source
1,2025-26,BE01R00011,Student Induction Program with Essence of Indian Knowledge System,https://gtu.ac.in/syllabus/syllabus.aspx
3,2025-26,BE03000081,Data Structures,https://gtu.ac.in/syllabus/syllabus.aspx

COMPUTER SCIENCE ENGINEERING

Sem,WEF,Subject Code,Subject Full Name,Source
3,2025-26,BE03000081,Data Structures,https://gtu.ac.in/syllabus/syllabus.aspx
```

### Format B: Flat Row-Level Format
Each row contains an explicit Branch/Department column:
```csv
Branch,Semester,Subject Code,Subject Name,Syllabus URL
Computer Engineering,3,BE03000081,Data Structures,https://gtu.ac.in/syllabus/syllabus.aspx
Information Technology,3,BE03000081,Data Structures,https://gtu.ac.in/syllabus/syllabus.aspx
```

---

## 2. Flexible Column Aliases

The CSV parser uses fuzzy alias matching to map CSV headers:

| Field | Recognized CSV Header Aliases | Required / Optional |
| :--- | :--- | :--- |
| **Branch** | `Branch`, `Department`, `Engineering Branch`, `Branch Name`, `Dept` | Required (Row or Section Header) |
| **Semester** | `Sem`, `Semester`, `Sem No`, `Semester Number`, `Sem Number` | Required |
| **Subject Code** | `Subject Code`, `Course Code`, `Course`, `Code` | Required |
| **Subject Name** | `Subject Full Name`, `Subject Name`, `Subject`, `Course Name` | Required |
| **Syllabus URL** | `Source`, `Syllabus Link`, `Syllabus URL`, `Syllabus` | Optional (Permits empty with warning) |
| **WEF Year** | `WEF`, `WEF Year`, `Academic Year`, `Regulation` | Optional |

---

## 3. Data Normalization Rules

### A. Branch Normalization
Raw department names are mapped to canonical branch identifiers:

| Raw CSV Branch String | Canonical Branch Name | Branch ID | Short Code |
| :--- | :--- | :--- | :--- |
| `Computer Engineering`, `Computer Science Engineering`, `CSE`, `CE` | Computer Engineering | `branch_computer` | `CSE` |
| `Information Technology`, `Info Tech`, `IT` | Information Technology | `branch_it` | `IT` |
| `Electrical Engineering`, `Electrical`, `EE` | Electrical Engineering | `branch_electrical` | `EE` |
| `Electronics and Communication`, `ECE`, `EC` | Electronics and Communication | `branch_ece` | `ECE` |
| `Mechanical Engineering`, `Mechanical`, `ME` | Mechanical Engineering | `branch_mechanical` | `ME` |
| `Civil Engineering`, `Civil`, `CE-CIVIL` | Civil Engineering | `branch_civil` | `CE` |
| `Chemical Engineering`, `Chemical`, `CHE` | Chemical Engineering | `branch_chemical` | `CHE` |
| `1st Year Common`, `First Year Common`, `FYC` | 1st Year Common | `branch_first-year` | `FYC` |

### B. Semester Normalization
- Numeric values `1` through `8` are accepted.
- String variations like `"Semester 3"`, `"Sem 3"`, `"SEM-3"` are parsed into integer `3`.
- Semester `0` denotes 1st Year Common Engineering curriculum.

### C. Subject Code & Name Rules
- Leading/trailing whitespace is automatically trimmed.
- Subject codes are converted to uppercase (e.g., `be03000081` -> `BE03000081`).
- Filler rows (e.g. `Subject Code = "—"` with title `No qualifying WEF 2024+ curriculum published...`) are automatically marked as `skipped`.

### D. Syllabus URL Rules
- Must begin with `http://` or `https://`.
- Scripts or `javascript:` protocols are strictly rejected during validation.

---

## 4. Database UPSERT & Archival Strategy

Importing a CSV into Cloudflare D1 uses transactional **UPSERT** behavior (`(branch_id, semester, subject_code)`):

1. **New Subject Code in Branch + Semester**:
   - Executes `INSERT INTO subjects (id, university_id, branch_id, semester, name, code, slug, syllabus_link, is_active)`.
2. **Existing Subject Code in Branch + Semester**:
   - Executes `UPDATE subjects SET name = ?, syllabus_link = ?, is_active = 1, updated_at = CURRENT_TIMESTAMP`.
3. **Identical Subject Code, Name & URL**:
   - Marked `unchanged`; updates `is_active = 1`.
4. **Subjects Missing from CSV**:
   - When the Admin enables **"Archive subjects missing from CSV"**, subjects in D1 not present in the new CSV are updated to `is_active = 0` (inactive) rather than deleted.

---

## 5. Sample Valid CSV Row Examples

```csv
Sem,WEF,Subject Code,Subject Full Name,Source
3,2025-26,BE03000081,Data Structures,https://gtu.ac.in/syllabus/syllabus.aspx
3,2025-26,BE03000091,Database Management System,https://gtu.ac.in/syllabus/syllabus.aspx
4,2025-26,BE04000221,Operating System,https://gtu.ac.in/syllabus/syllabus.aspx
```
