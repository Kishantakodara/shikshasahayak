// ============================================================
// ADMIN API: GET /api/admin/academic/subjects/export
// Exports current Cloudflare D1 database subject master as downloadable CSV
// ============================================================

import { errorResponse } from "../../../../lib/json";
import { requireAdmin } from "../../../../lib/auth";

export async function onRequestGet(context: {
  request: Request;
  env: { DB: D1Database };
}) {
  const { request, env } = context;

  const { errorResponse: authError } = await requireAdmin(request, env);
  if (authError) {
    return authError;
  }

  try {
    const { results } = await env.DB.prepare(
      `SELECT
         b.name AS branch_name,
         s.semester,
         s.wef_year,
         s.code AS subject_code,
         s.name AS subject_name,
         s.syllabus_link
       FROM subjects s
       JOIN branches b ON b.id = s.branch_id
       WHERE (s.is_active IS NULL OR s.is_active = 1)
       ORDER BY b.name ASC, s.semester ASC, s.code ASC`
    ).all<{ branch_name: string; semester: number; wef_year: number; subject_code: string; subject_name: string; syllabus_link: string }>();

    let csv = "Branch,Sem,WEF,Subject Code,Subject Full Name,Source\n";

    if (results) {
      results.forEach(row => {
        const branch = `"${(row.branch_name || '').replace(/"/g, '""')}"`;
        const sem = row.semester;
        const wef = row.wef_year || '2025-26';
        const code = `"${(row.subject_code || '').replace(/"/g, '""')}"`;
        const name = `"${(row.subject_name || '').replace(/"/g, '""')}"`;
        const source = `"${(row.syllabus_link || 'https://gtu.ac.in/syllabus/syllabus.aspx').replace(/"/g, '""')}"`;

        csv += `${branch},${sem},${wef},${code},${name},${source}\n`;
      });
    }

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="padhaku_subject_master_export_${Date.now()}.csv"`,
        "Cache-Control": "no-cache"
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}
