import { jsonResponse, errorResponse } from "../../lib/json";
import { slugify } from "../../lib/coreDb";

export async function onRequestGet(context: { env: any }) {
  const { env } = context;

  try {
    let branches: any[] = [];

    // 1. Try PADHAKU_CORE_DB first if present
    if (env.PADHAKU_CORE_DB) {
      try {
        const { results } = await env.PADHAKU_CORE_DB.prepare(
          `SELECT
             b.id,
             b.name,
             b.short_name,
             b.code,
             b.university_id,
             b.display_order,
             LOWER(REPLACE(REPLACE(REPLACE(b.name, ' ', '-'), '/', '-'), '&', 'and')) AS slug,
             COALESCE(c.name, 'Bachelor of Engineering') AS program_name,
             'engineering' AS program_slug,
             COALESCE(u.name, 'Gujarat Technological University') AS university
           FROM branches b
           LEFT JOIN courses c ON c.id = b.course_id
           LEFT JOIN universities u ON u.id = b.university_id
           WHERE b.is_active = 1
           ORDER BY b.display_order ASC, b.name ASC`
        ).all();
        if (results && results.length > 0) {
          branches = results;
        }
      } catch {}
    }

    // 2. If PADHAKU_CORE_DB is empty or failed, fallback to DB
    if (branches.length === 0 && env.DB) {
      try {
        const { results } = await env.DB.prepare(
          `SELECT
             b.id,
             b.name,
             b.slug,
             b.short_name,
             b.code,
             b.university_id,
             u.name AS program_name,
             u.slug AS program_slug,
             u.name AS university
           FROM branches b
           JOIN universities u ON u.id = b.university_id
           ORDER BY b.name`
        ).all();
        branches = results || [];
      } catch {}
    }

    // Ensure every branch has a clean URL slug
    branches = branches.map((b: any) => ({
      ...b,
      slug: b.slug || slugify(b.name),
    }));

    return jsonResponse(branches, {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=3600"
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}
