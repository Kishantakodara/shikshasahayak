# KeyDocs 3.0 Operations Runbook for System Administrators

This runbook provides step-by-step procedures for platform administrators to manage KeyDocs 3.0 content and perform operational tasks.

---

## 📖 Operational Tasks & Procedures

### 1. How to Add a Subject & Curriculum
1. Open Admin CMS at `/admin/academic`.
2. Select target University, Branch, and Semester.
3. Click on the Subject to open **Admin Subject Workspace**.
4. Navigate to **Curriculum** tab.
5. Click **+ Add Unit** to create a unit heading.
6. Click **Add Topic** on any unit card to create nested topics.

### 2. How to Add & Publish a PYQ Paper
1. Open **Admin Subject Workspace**.
2. Click **+ Add Document** CTA.
3. Select **PYQ Paper**.
4. Fill Exam Year (e.g. `2025`) and Season (`Summer` / `Winter`).
5. Drag & drop the PDF file into the upload zone.
6. Set Publication Status to **Published**.
7. Click **Save Document**.

### 3. How to Link a Model Solution to a PYQ
1. Open **Admin Subject Workspace** ➔ **Documents** tab.
2. Click **+ Add Document** ➔ Create the Solution document.
3. Open the main Question Paper document preview modal.
4. Add relation `solution` pointing to the Solution document ID.

### 4. How to Run Integrity Audits
Execute the following CLI command locally or in CI/CD:
```bash
npm run keydocs:audit
```
If any orphan records exist, the command will output detailed diagnostic error metrics.

### 5. How to Handle PDF Download Issues
1. Verify the document has a primary attachment in `document_files`.
2. Verify the underlying `assets` row contains a valid `storage_key`.
3. Check Cloudflare R2 bucket connectivity.
