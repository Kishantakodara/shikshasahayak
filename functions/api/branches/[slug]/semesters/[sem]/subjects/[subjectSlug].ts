import { jsonResponse, errorResponse, sessionCode } from "../../../../../../lib/json";
import { normalizeDocumentType, sessionName } from "../../../../../../lib/materialUpload";
import { findBranch, slugify } from "../../../../../../lib/coreDb";

export async function onRequestGet(context: {
  request: Request;
  env: any;
  params: { slug?: string; sem?: string; subjectSlug?: string };
}) {
  const { request, env, params } = context;
  const slug = params.slug;
  const semester = Number(params.sem);
  const subjectSlug = params.subjectSlug;
  const url = new URL(request.url);
  const curriculum = url.searchParams.get("curriculum") || "cv_2026";
  const materialType = normalizeDocumentType(url.searchParams.get("type") || "pyq");

  if (!slug || !subjectSlug || !Number.isFinite(semester)) {
    return errorResponse("Missing branch, semester, or subject");
  }

  try {
    const branch = await findBranch(env, slug);

    if (!branch) {
      return errorResponse("Branch not found", 404);
    }

    const databases: D1Database[] = [];
    if (env.PADHAKU_CORE_DB) databases.push(env.PADHAKU_CORE_DB);
    if (env.DB) databases.push(env.DB);

    const cleanSubject = (subjectSlug || "").trim().toLowerCase();
    const cleanSubjectName = cleanSubject.replace(/-/g, ' ');
    const bId = branch.id || '';
    const bCode = String(branch.code || branch.Code || '');
    const bSlug = branch.slug || slug;

    let offering: any = null;
    let sessions: any[] = [];
    let otherMaterials: any[] = [];

    for (const db of databases) {
      try {
        // Query offering
        const { results: candidateSubjects } = await db.prepare(
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
             s.subject_group_id,
             s.wef_year
           FROM subjects s
           WHERE (s.branch_id = ? OR s.branch_id = ? OR s.branch_id = ? OR s.branch_id = ?)
             AND s.semester = ?`
        )
          .bind(curriculum, curriculum.replace(/^cv_/, ""), bId, bCode, slug, bSlug, semester)
          .all<any>();

        if (candidateSubjects && candidateSubjects.length > 0) {
          // Find matching candidate
          offering = candidateSubjects.find((s) => {
            const codeMatch = s.subject_code && s.subject_code.toLowerCase() === cleanSubject;
            const idMatch = s.subject_id && s.subject_id.toLowerCase() === cleanSubject;
            const slugMatch = s.subject_slug && s.subject_slug.toLowerCase() === cleanSubject;
            const nameSlugMatch = slugify(s.subject_name) === cleanSubject;
            const nameMatch = s.subject_name && s.subject_name.toLowerCase().includes(cleanSubjectName);
            return codeMatch || idMatch || slugMatch || nameSlugMatch || nameMatch;
          });

          if (offering) {
            // Fetch sessions
            try {
              const { results: sList } = await db.prepare(
                `SELECT DISTINCT d.paper_year, d.season
                 FROM documents d
                 WHERE d.subject_id = ?
                   AND d.document_type = ?
                   AND d.approval_status = 'approved'
                   AND d.paper_year IS NOT NULL
                 ORDER BY d.paper_year DESC, CASE d.season WHEN 'W' THEN 0 ELSE 1 END`
              )
                .bind(offering.subject_id, materialType)
                .all<{ paper_year: number; season: string }>();

              sessions = sList || [];
            } catch {}

            // Fetch materials
            try {
              const { results: mList } = await db.prepare(
                `SELECT
                   d.id,
                   d.title,
                   d.document_type AS material_type,
                   COALESCE(d.material_kind, 'notes') AS material_kind,
                   d.unit_no,
                   d.chapter,
                   d.topic,
                   f.storage_key,
                   f.file_url,
                   f.original_filename,
                   f.file_type,
                   f.file_size,
                   d.created_at,
                   b.id AS blog_id,
                   d.version_label
                 FROM documents d
                 LEFT JOIN document_files f ON f.document_id = d.id AND f.is_primary = 1
                 LEFT JOIN blogs b ON b.id = d.blog_id AND b.status = 'published'
                 WHERE d.subject_id = ?
                   AND d.document_type = ?
                   AND d.approval_status = 'approved'
                   AND (d.paper_year IS NULL OR d.document_type != 'pyq')
                 ORDER BY d.created_at DESC`
              )
                .bind(offering.subject_id, materialType)
                .all();

              otherMaterials = mList || [];
            } catch {}

            break;
          }
        }
      } catch {}
    }

    if (!offering) {
      return errorResponse("Subject not found for this branch and semester", 404);
    }

    const sessionFolders = (sessions || []).map((row) => ({
      code: sessionCode(row.paper_year, sessionName(row.season) || "summer"),
      year: row.paper_year,
      session: sessionName(row.season) || "summer",
      label: row.season === "W" ? `Winter ${row.paper_year}` : `Summer ${row.paper_year}`,
    }));

    return jsonResponse({
      branch,
      offering: {
        ...offering,
        subject_slug: offering.subject_slug || slugify(offering.subject_name) || offering.subject_code,
      },
      semester,
      curriculum,
      material_type: materialType,
      sessions: sessionFolders,
      materials_without_session: otherMaterials || [],
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
