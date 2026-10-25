import { jsonResponse, errorResponse, materialDownloadUrl } from "../../../lib/json";

export async function onRequestGet(context: {
  request: Request;
  params: { offeringId?: string };
  env: { DB: D1Database };
}) {
  const { params, env, request } = context;
  const subjectId = params.offeringId;

  if (!subjectId) {
    return errorResponse("Missing subject id");
  }

  try {
    const { results } = await env.DB.prepare(
      `SELECT
         d.id,
         d.title,
         d.document_type,
         d.approval_status,
         d.created_at,
         f.storage_key,
         f.file_url,
         p.paper_year,
         CASE p.season WHEN 'W' THEN 'winter' WHEN 'S' THEN 'summer' ELSE NULL END AS exam_session,
         b.id AS blog_id
       FROM documents d
       LEFT JOIN document_files f ON f.document_id = d.id AND f.is_primary = 1
       LEFT JOIN pyq_details p ON p.document_id = d.id
       LEFT JOIN blogs b ON b.id = d.blog_id AND b.status = 'published'
       WHERE d.subject_id = ? AND d.approval_status = 'approved'
       ORDER BY p.paper_year DESC, d.title`
    )
      .bind(subjectId)
      .all();

    const materials = results.map((m: any) => ({
      id: m.id,
      title: m.title,
      type: m.document_type,
      material_type: m.document_type,
      offeringId: subjectId,
      pdfUrl: m.file_url || materialDownloadUrl(String(m.storage_key), request.url),
      url: m.file_url || materialDownloadUrl(String(m.storage_key), request.url),
      year: m.paper_year,
      examSession: m.exam_session,
      status: "published",
      createdAt: m.created_at,
      blog_id: m.blog_id || undefined,
    }));

    return jsonResponse(materials);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}
