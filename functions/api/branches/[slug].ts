import { jsonResponse, errorResponse } from "../../lib/json";
import { findBranch } from "../../lib/coreDb";

export async function onRequestGet(context: {
  env: WorkerBindings;
  params: { slug?: string };
}) {
  const { env, params } = context;
  const slug = params.slug;

  if (!slug) {
    return errorResponse("Missing branch slug");
  }

  try {
    const branch = await findBranch(env, slug);

    if (!branch) {
      return errorResponse("Branch not found", 404);
    }

    const db = env.PADHAKU_CORE_DB || env.DB;
    let semesters: { semester: number }[] = [];

    // 1. Try primary database
    try {
      const { results } = await db.prepare(
        `SELECT DISTINCT semester
         FROM subjects
         WHERE branch_id = ? OR branch_id = ?
         ORDER BY semester`
      )
        .bind(branch.id, slug)
        .all<{ semester: number }>();

      semesters = (results || []).filter((r: any) => r.semester !== undefined && r.semester !== null);
    } catch {}

    // 2. If empty and secondary exists, try secondary
    if (semesters.length === 0 && env.DB && db !== env.DB) {
      try {
        const { results } = await env.DB.prepare(
          `SELECT DISTINCT semester
           FROM subjects
           WHERE branch_id = ? OR branch_id = ?
           ORDER BY semester`
        )
          .bind(branch.id, slug)
          .all<{ semester: number }>();

        semesters = (results || []).filter((r: any) => r.semester !== undefined && r.semester !== null);
      } catch {}
    }

    // Fallback to standard engineering semesters if none populated
    if (semesters.length === 0) {
      semesters = [1, 2, 3, 4, 5, 6, 7, 8].map((s) => ({ semester: s }));
    }

    return jsonResponse({ branch, semesters }, {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=3600"
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}
