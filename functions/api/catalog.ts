import { jsonResponse, errorResponse } from "../lib/json";

/** Legacy catalog endpoint — prefer /api/branches/:slug/semesters/:sem/subjects */
export async function onRequestGet(context: { request: Request; env: { DB: D1Database } }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const branch = url.searchParams.get("branch");
  const semester = url.searchParams.get("semester");
  const curriculumParam = url.searchParams.get("curriculum") || "2026";

  if (!branch || !semester) {
    return errorResponse("Missing required query parameters: branch and semester");
  }

  const curriculum =
    curriculumParam.startsWith("cv_") ? curriculumParam : `cv_${curriculumParam}`;

  try {
    const { results } = await env.DB.prepare(
      `SELECT
         s.id,
         s.code AS subject_code,
         s.name AS subject_name,
         s.slug AS subject_slug,
         s.semester,
         ? AS curriculum_year
       FROM subjects s
       JOIN branches b ON b.id = s.branch_id
       WHERE (b.slug = ? OR b.id = ? OR LOWER(b.short_name) = LOWER(?))
         AND s.semester = ?
       ORDER BY s.name`
    )
      .bind(curriculum.replace(/^cv_/, ""), branch, branch, branch, Number(semester))
      .all();

    const mapped = results.map((row: Record<string, unknown>) => ({
      id: row.id,
      subjectCode: row.subject_code,
      subjectName: row.subject_name,
      subjectSlug: row.subject_slug,
      branch,
      semester: row.semester,
      curriculumYear: row.curriculum_year,
    }));

    return jsonResponse(mapped, {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=3600"
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}
