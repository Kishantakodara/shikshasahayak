// ============================================================
// PUBLIC API: GET /api/academic/subjects
// Returns active database-driven subjects for student branch & semester
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";

export async function onRequestGet(context: {
  request: Request;
  env: { DB: D1Database };
}) {
  const { request, env } = context;
  const url = new URL(request.url);
  const branchParam = url.searchParams.get("branch") || url.searchParams.get("branchId") || url.searchParams.get("branchSlug") || "computer";
  const semParam = Number(url.searchParams.get("semester") || url.searchParams.get("sem") || "3");

  try {
    // Resolve branch
    const branch = await env.DB.prepare(
      `SELECT id, name, slug, short_name, code FROM branches WHERE slug = ? OR id = ? OR code = ? OR name LIKE ?`
    )
      .bind(branchParam, branchParam, branchParam, `%${branchParam}%`)
      .first<{ id: string; name: string; slug: string; short_name: string; code?: string }>();

    const branchId = branch?.id || branchParam;

    const { results } = await env.DB.prepare(
      `SELECT
         s.id AS subject_id,
         s.id AS offering_id,
         s.name AS subject_name,
         s.code AS subject_code,
         s.slug AS subject_slug,
         s.semester,
         s.syllabus_link,
         s.wef_year,
         s.is_active,
         b.name AS branch_name,
         b.slug AS branch_slug
       FROM subjects s
       JOIN branches b ON b.id = s.branch_id
       WHERE (s.branch_id = ? OR b.slug = ? OR b.name LIKE ?)
         AND s.semester = ?
         AND (s.is_active IS NULL OR s.is_active = 1)
       ORDER BY s.name ASC`
    )
      .bind(branchId, branchParam, `%${branchParam}%`, semParam)
      .all();

    return jsonResponse({
      success: true,
      branch: branch || { id: branchId, slug: branchParam, name: branchParam },
      semester: semParam,
      subjects: results || [],
    }, {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=3600"
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}
