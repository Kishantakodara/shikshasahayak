// ============================================================
// ADMIN API: POST /api/admin/academic/subjects/import
// Executes UPSERT transaction to Cloudflare D1 Database
// ============================================================

import { jsonResponse, errorResponse } from "../../../../lib/json";
import { parseSubjectMasterCsv } from "../../../../lib/csvSubjectMasterParser";
import { requireAdmin } from "../../../../lib/auth";

export async function onRequestPost(context: {
  request: Request;
  env: { DB: D1Database };
}) {
  const { request, env } = context;

  const { errorResponse: authError } = await requireAdmin(request, env);
  if (authError) {
    return authError;
  }

  try {
    let csvContent = "";
    let archiveMissing = false;
    let filename = "subject_master_import.csv";
    let adminUser = "Admin";

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") || formData.get("csv");
      if (file instanceof File) {
        csvContent = await file.text();
        filename = file.name;
      } else if (typeof file === "string") {
        csvContent = file;
      }
      archiveMissing = formData.get("archiveMissing") === "true";
      adminUser = (formData.get("uploadedBy") as string) || "Admin";
    } else {
      const body = await request.json().catch(() => null) as any;
      if (body) {
        csvContent = body.csv || "";
        archiveMissing = Boolean(body.archiveMissing);
        filename = body.filename || filename;
        adminUser = body.uploadedBy || adminUser;
      }
    }

    if (!csvContent || !csvContent.trim()) {
      return errorResponse("CSV file content is empty", 400);
    }

    // 1. Parse & Validate CSV
    const parseResult = parseSubjectMasterCsv(csvContent);
    if (parseResult.errorCount > 0 && parseResult.parsedRecords.length === 0) {
      return errorResponse(`CSV import failed with ${parseResult.errorCount} critical errors`, 400);
    }

    // 2. Load existing branch map
    const { results: branches } = await env.DB.prepare(
      `SELECT id, slug, name FROM branches`
    ).all<{ id: string; slug: string; name: string }>();

    const branchSlugToIdMap = new Map<string, string>();
    if (branches) {
      branches.forEach(b => {
        branchSlugToIdMap.set(b.slug, b.id);
      });
    }

    // Default university ID
    const univId = "gtu";

    // 3. Upsert Records to D1
    let inserted = 0;
    let updated = 0;
    let unchanged = 0;
    const activeSubjectKeys = new Set<string>();

    for (const rec of parseResult.parsedRecords) {
      if (rec.status === 'skipped') continue;

      const branchSlug = rec.branchCanonical.slug;
      let branchId = branchSlugToIdMap.get(branchSlug);

      // Create branch in DB if missing
      if (!branchId) {
        branchId = `branch_${branchSlug}`;
        await env.DB.prepare(
          `INSERT OR IGNORE INTO branches (id, university_id, name, slug, short_name)
           VALUES (?, ?, ?, ?, ?)`
        )
          .bind(branchId, univId, rec.branchCanonical.name, branchSlug, rec.branchCanonical.shortName)
          .run();
        branchSlugToIdMap.set(branchSlug, branchId);
      }

      const subjectSlug = rec.subjectCode.toLowerCase();
      const uniqueKey = `${branchId}:${rec.semester}:${cleanCode(rec.subjectCode)}`;
      activeSubjectKeys.add(uniqueKey);

      // Check existing D1 subject
      const existing = await env.DB.prepare(
        `SELECT id, name, syllabus_link FROM subjects
         WHERE branch_id = ? AND semester = ? AND (code = ? OR slug = ?)`
      )
        .bind(branchId, rec.semester, rec.subjectCode, subjectSlug)
        .first<{ id: string; name: string; syllabus_link: string }>();

      if (existing) {
        if (existing.name === rec.subjectName && (existing.syllabus_link || '') === rec.syllabusLink) {
          unchanged++;
          // Ensure is_active is 1
          await env.DB.prepare(
            `UPDATE subjects SET is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
          ).bind(existing.id).run();
        } else {
          updated++;
          await env.DB.prepare(
            `UPDATE subjects SET name = ?, syllabus_link = ?, is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
          ).bind(rec.subjectName, rec.syllabusLink, existing.id).run();
        }
      } else {
        inserted++;
        const newSubjId = `subj_${branchSlug}_sem${rec.semester}_${rec.subjectCode.toLowerCase()}`;
        await env.DB.prepare(
          `INSERT INTO subjects (id, university_id, branch_id, semester, name, code, slug, syllabus_link, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`
        ).bind(newSubjId, univId, branchId, rec.semester, rec.subjectName, rec.subjectCode, subjectSlug, rec.syllabusLink).run();
      }
    }

    // 4. Handle Archive Missing if requested
    let archivedCount = 0;
    if (archiveMissing) {
      const { results: allSubs } = await env.DB.prepare(
        `SELECT id, branch_id, semester, code FROM subjects WHERE is_active = 1`
      ).all<{ id: string; branch_id: string; semester: number; code: string }>();

      if (allSubs) {
        for (const sub of allSubs) {
          const key = `${sub.branch_id}:${sub.semester}:${cleanCode(sub.code || '')}`;
          if (!activeSubjectKeys.has(key)) {
            await env.DB.prepare(`UPDATE subjects SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
              .bind(sub.id)
              .run();
            archivedCount++;
          }
        }
      }
    }

    // 5. Log Import Audit Record
    const importId = `import_${Date.now()}`;
    const errorJson = JSON.stringify({ errors: parseResult.errors, warnings: parseResult.warnings });

    await env.DB.prepare(
      `INSERT INTO subject_csv_imports
       (id, filename, uploaded_by, total_rows, imported_rows, updated_rows, unchanged_rows, skipped_rows, error_count, archived_count, error_log_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        importId,
        filename,
        adminUser,
        parseResult.totalRows,
        inserted,
        updated,
        unchanged,
        parseResult.skippedCount,
        parseResult.errorCount,
        archivedCount,
        errorJson
      )
      .run();

    return jsonResponse({
      success: true,
      importId,
      filename,
      totalRows: parseResult.totalRows,
      importedCount: inserted,
      updatedCount: updated,
      unchangedCount: unchanged,
      skippedCount: parseResult.skippedCount,
      errorCount: parseResult.errorCount,
      archivedCount,
      message: `Successfully imported ${inserted} new, updated ${updated}, unchanged ${unchanged} subjects.`
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}

function cleanCode(code: string): string {
  return code.trim().toUpperCase();
}
