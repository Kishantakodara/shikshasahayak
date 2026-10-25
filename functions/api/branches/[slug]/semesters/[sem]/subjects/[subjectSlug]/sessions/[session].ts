import {
  jsonResponse,
  errorResponse,
  parseSessionCode,
  materialDownloadUrl,
} from "../../../../../../../../lib/json";
import { normalizeDocumentType } from "../../../../../../../../lib/materialUpload";

export async function onRequestGet(context: {
  request: Request;
  env: { DB: D1Database };
  params: { slug?: string; sem?: string; subjectSlug?: string; session?: string };
}) {
  const { request, env, params } = context;
  const slug = params.slug;
  const semester = Number(params.sem);
  const subjectSlug = params.subjectSlug;
  const sessionParam = params.session;
  const url = new URL(request.url);
  const curriculum = url.searchParams.get("curriculum") || "cv_2026";
  const materialType = normalizeDocumentType(url.searchParams.get("type") || "pyq");

  const parsed = sessionParam ? parseSessionCode(sessionParam) : null;
  if (!slug || !subjectSlug || !Number.isFinite(semester) || !parsed) {
    return errorResponse("Invalid browse path or session code (use S2026 or W2025)");
  }

  const season = parsed.session === "winter" ? "W" : "S";

  try {
    const branch = await env.DB.prepare(
      `SELECT id, name, slug, short_name, code FROM branches WHERE slug = ? OR id = ? OR code = ?`
    )
      .bind(slug, slug, slug)
      .first<{ id: string; name: string; slug: string; code?: string }>();

    if (!branch) {
      return errorResponse("Branch not found", 404);
    }

    const offering = await env.DB.prepare(
      `SELECT s.id AS offering_id, s.name AS subject_name, s.slug AS subject_slug
       FROM subjects s
       WHERE s.branch_id = ?
         AND s.semester = ?
         AND (s.slug = ? OR s.id = ?)`
    )
      .bind(branch.id, semester, subjectSlug, subjectSlug)
      .first<{ offering_id: string; subject_name: string; subject_slug: string }>();

    if (!offering) {
      return errorResponse("Subject not found", 404);
    }

    const { results } = await env.DB.prepare(
      `SELECT
         d.id,
         d.title,
         d.document_type,
         f.storage_key,
         f.file_url,
         d.paper_year,
         d.season,
         d.created_at,
         d.approval_status,
         d.views,
         d.likes,
         d.downloads,
         b.id AS blog_id
       FROM documents d
       LEFT JOIN document_files f ON f.document_id = d.id AND f.is_primary = 1
       LEFT JOIN blogs b ON b.id = d.blog_id AND b.status = 'published'
       WHERE d.subject_id = ?
         AND d.document_type = ?
         AND d.approval_status = 'approved'
         AND d.paper_year = ?
         AND d.season = ?
       ORDER BY d.title`
    )
      .bind(offering.offering_id, materialType, parsed.year, season)
      .all();

    const materials = results.map((row: Record<string, any>) => ({
      id: row.id,
      title: row.title,
      type: row.document_type,
      material_type: row.document_type,
      url: row.file_url || materialDownloadUrl(String(row.storage_key), request.url),
      pdfUrl: row.file_url || materialDownloadUrl(String(row.storage_key), request.url),
      year: row.paper_year,
      examSession: parsed.session,
      status: "published",
      views: row.views || 0,
      likes: row.likes || 0,
      downloads: row.downloads || 0,
      blog_id: row.blog_id || undefined,
    }));

    return jsonResponse({
      branch,
      offering,
      semester,
      curriculum,
      session: {
        code: sessionParam,
        year: parsed.year,
        session: parsed.session,
        label:
          parsed.session === "winter"
            ? `Winter ${parsed.year}`
            : `Summer ${parsed.year}`,
      },
      material_type: materialType,
      materials,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}
