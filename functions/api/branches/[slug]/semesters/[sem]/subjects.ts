import { jsonResponse, errorResponse } from "../../../../../lib/json";
import { normalizeDocumentType } from "../../../../../lib/materialUpload";
import { findBranch, slugify } from "../../../../../lib/coreDb";

export async function onRequestGet(context: {
  request: Request;
  env: any;
  params: { slug?: string; sem?: string };
}) {
  const { request, env, params } = context;
  const slug = params.slug;
  const semester = Number(params.sem);
  const url = new URL(request.url);
  const curriculum = url.searchParams.get("curriculum") || "cv_2026";
  const materialType = normalizeDocumentType(url.searchParams.get("type") || "pyq");

  if (!slug || !Number.isFinite(semester)) {
    return errorResponse("Missing branch slug or semester");
  }

  try {
    const branch = await findBranch(env, slug);

    if (!branch) {
      return errorResponse("Branch not found", 404);
    }

    const databases: D1Database[] = [];
    if (env.PADHAKU_CORE_DB) databases.push(env.PADHAKU_CORE_DB);
    if (env.DB) databases.push(env.DB);

    let subjects: any[] = [];

    for (const db of databases) {
      try {
        const { results } = await db.prepare(
          `SELECT
             s.id AS offering_id,
             s.semester AS semester,
             'branch_core' AS subject_group,
             ? AS curriculum_id,
             ? AS curriculum_name,
             s.id AS subject_id,
             s.code AS subject_code,
             s.name AS subject_name,
             COALESCE(s.code, LOWER(REPLACE(REPLACE(s.name, ' ', '-'), '/', '-'))) AS subject_slug,
             (
               SELECT COUNT(DISTINCT d.paper_year || '-' || d.season)
               FROM documents d
               WHERE d.subject_id = s.id
                 AND d.document_type = ?
                 AND d.approval_status = 'approved'
             ) AS session_count,
             (
               SELECT COUNT(*)
               FROM documents d
               WHERE d.subject_id = s.id
                 AND d.document_type = ?
                 AND d.approval_status = 'approved'
             ) AS material_count
           FROM subjects s
           WHERE (s.branch_id = ? OR s.branch_id = ? OR s.branch_id = ? OR s.branch_id = ?)
             AND s.semester = ?
           ORDER BY s.name`
        )
          .bind(curriculum, curriculum.replace(/^cv_/, ""), materialType, materialType, branch.id, branch.code, slug, branch.slug, semester)
          .all();

        if (results && results.length > 0) {
          subjects = results;
          break;
        }
      } catch {
        // Simple fallback
        try {
          const { results } = await db.prepare(
            `SELECT
               s.id AS offering_id,
               s.semester AS semester,
               'branch_core' AS subject_group,
               ? AS curriculum_id,
               ? AS curriculum_name,
               s.id AS subject_id,
               s.code AS subject_code,
               s.name AS subject_name,
               s.code AS subject_slug,
               0 AS session_count,
               0 AS material_count
             FROM subjects s
             WHERE (s.branch_id = ? OR s.branch_id = ? OR s.branch_id = ?)
               AND s.semester = ?
             ORDER BY s.name`
          )
            .bind(curriculum, curriculum.replace(/^cv_/, ""), branch.id, slug, branch.slug, semester)
            .all();

          if (results && results.length > 0) {
            subjects = results;
            break;
          }
        } catch {}
      }
    }

    // Ensure subject_slug is always a valid slug
    subjects = subjects.map((sub: any) => ({
      ...sub,
      subject_slug: sub.subject_slug || slugify(sub.subject_name) || sub.subject_code?.toLowerCase() || sub.subject_id,
    }));

    return jsonResponse({
      branch,
      semester,
      subjects,
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
