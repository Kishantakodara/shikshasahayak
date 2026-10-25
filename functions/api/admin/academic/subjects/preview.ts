// ============================================================
// ADMIN API: POST /api/admin/academic/subjects/preview
// Validates uploaded CSV against Cloudflare D1 without database mutations
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
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") || formData.get("csv");
      if (file instanceof File) {
        csvContent = await file.text();
      } else if (typeof file === "string") {
        csvContent = file;
      }
    } else {
      const json = await request.json().catch(() => null) as { csv?: string } | null;
      if (json && json.csv) {
        csvContent = json.csv;
      } else {
        csvContent = await request.text();
      }
    }

    if (!csvContent || !csvContent.trim()) {
      return errorResponse("CSV file content is empty or invalid", 400);
    }

    // 1. Parse CSV
    const parseResult = parseSubjectMasterCsv(csvContent);

    // 2. Fetch existing subjects from D1 to categorize upserts vs updates vs unchanged
    const { results: dbSubjects } = await env.DB.prepare(
      `SELECT s.code, s.name, s.syllabus_link, s.semester, b.slug AS branch_slug
       FROM subjects s
       JOIN branches b ON b.id = s.branch_id`
    ).all<{ code: string; name: string; syllabus_link: string; semester: number; branch_slug: string }>();

    const dbMap = new Map<string, { name: string; syllabus_link: string }>();
    if (dbSubjects) {
      dbSubjects.forEach(s => {
        if (s.code) {
          const key = `${s.branch_slug}:${s.semester}:${s.code.trim().toUpperCase()}`;
          dbMap.set(key, { name: s.name, syllabus_link: s.syllabus_link || "" });
        }
      });
    }

    let newCount = 0;
    let updateCount = 0;
    let unchangedCount = 0;

    const classifiedRecords = parseResult.parsedRecords.map(rec => {
      if (rec.status === 'skipped') return rec;

      const key = `${rec.branchCanonical.slug}:${rec.semester}:${rec.subjectCode}`;
      if (dbMap.has(key)) {
        const existing = dbMap.get(key)!;
        if (existing.name === rec.subjectName && (existing.syllabus_link || '') === rec.syllabusLink) {
          unchangedCount++;
          return { ...rec, status: 'unchanged' as const };
        } else {
          updateCount++;
          return { ...rec, status: 'update' as const };
        }
      } else {
        newCount++;
        return { ...rec, status: 'new' as const };
      }
    });

    // 3. Count existing D1 active subjects missing from this CSV (for archive warning)
    const csvKeys = new Set(
      classifiedRecords
        .filter(r => r.status !== 'skipped')
        .map(r => `${r.branchCanonical.slug}:${r.semester}:${r.subjectCode}`)
    );

    const missingCount = dbSubjects ? dbSubjects.filter(s => s.code && !csvKeys.has(`${s.branch_slug}:${s.semester}:${s.code.trim().toUpperCase()}`)).length : 0;

    return jsonResponse({
      success: true,
      totalRows: parseResult.totalRows,
      newCount,
      updatedCount: updateCount,
      unchangedCount,
      skippedCount: parseResult.skippedCount,
      warningCount: parseResult.warningCount,
      errorCount: parseResult.errorCount,
      missingFromCsvCount: missingCount,
      branchesDetected: parseResult.branchesDetected,
      semestersDetected: parseResult.semestersDetected,
      parsedRecords: classifiedRecords,
      errors: parseResult.errors,
      warnings: parseResult.warnings,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}
