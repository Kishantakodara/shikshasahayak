import { jsonResponse, errorResponse } from "../../lib/json";
import { slugify } from "../../lib/coreDb";

export async function onRequestGet(context: {
  request: Request;
  params: { id?: string };
  env: any;
}) {
  const { params, env, request } = context;
  const id = params.id;

  if (!id) {
    return errorResponse("Missing document ID");
  }

  const cleanId = id.replace(/^doc_/, "");
  const docIdWithPrefix = id.startsWith("doc_") ? id : `doc_${id}`;

  const databases: D1Database[] = [];
  if (env.PADHAKU_CORE_DB) databases.push(env.PADHAKU_CORE_DB);
  if (env.DB) databases.push(env.DB);

  try {
    let result: any = null;

    for (const db of databases) {
      try {
        result = await db.prepare(
          `SELECT
             d.*,
             d.document_type AS material_type,
             COALESCE(u.name, 'Gujarat Technological University') AS university,
             COALESCE(b.name, 'Engineering') AS branch_name,
             COALESCE(b.short_name, 'ENG') AS branch_short_name,
             LOWER(REPLACE(REPLACE(REPLACE(COALESCE(b.name, 'engineering'), ' ', '-'), '/', '-'), '&', 'and')) AS branch_slug,
             s.name AS subject_name,
             s.code AS subject_code,
             COALESCE(s.code, LOWER(REPLACE(REPLACE(s.name, ' ', '-'), '/', '-'))) AS subject_slug,
             s.semester AS semester_no,
             f.storage_key,
             f.file_url,
             d.paper_year AS exam_year,
             CASE d.season WHEN 'W' THEN 'winter' WHEN 'S' THEN 'summer' ELSE NULL END AS exam_session,
             blog.id AS blog_id,
             blog.title AS blog_title,
             COALESCE(d.material_kind, 'notes') AS material_kind,
             d.unit_no,
             d.topic,
             d.author
           FROM documents d
           LEFT JOIN universities u ON u.id = d.university_id
           LEFT JOIN branches b ON b.id = d.branch_id
           LEFT JOIN subjects s ON s.id = d.subject_id
           LEFT JOIN document_files f ON f.document_id = d.id AND f.is_primary = 1
           LEFT JOIN blogs blog ON blog.id = d.blog_id OR blog.related_document_id = d.id
           WHERE d.id = ? OR d.id = ? OR d.id = ?`
        )
          .bind(id, docIdWithPrefix, cleanId)
          .first<Record<string, any>>();

        if (result) break;
      } catch {}
    }

    if (!result) {
      return errorResponse("Document not found", 404);
    }

    if (result.approval_status !== "approved") {
      const url = new URL(request.url);
      const isPreview = url.searchParams.get("preview") === "true";
      if (!isPreview) {
        return jsonResponse({
          id: result.id,
          title: result.title,
          document_type: result.document_type,
          approval_status: result.approval_status,
          status: result.approval_status,
          uploaded_by: result.uploaded_by,
          created_at: result.created_at,
          university: result.university,
          branch_name: result.branch_name,
          branch_short_name: result.branch_short_name,
          branch_slug: result.branch_slug || slugify(result.branch_name),
          subject_name: result.subject_name,
          subject_code: result.subject_code,
          message: "Document is pending approval and cannot be viewed publicly",
        }, 403);
      }
    }

    return jsonResponse({
      id: result.id,
      title: result.title,
      description: result.description,
      document_type: result.document_type,
      material_type: result.material_type || result.document_type,
      approval_status: result.approval_status,
      status: result.approval_status,
      created_at: result.created_at,
      updated_at: result.updated_at,
      semester: result.semester || result.semester_no,
      semester_no: result.semester_no || result.semester,
      university: result.university,
      branch_name: result.branch_name,
      branch_short_name: result.branch_short_name,
      branch_slug: result.branch_slug || slugify(result.branch_name),
      branch_id: result.branch_id,
      subject_id: result.subject_id,
      subject_name: result.subject_name,
      subject_code: result.subject_code,
      subject_slug: result.subject_slug || result.subject_code,
      storage_key: result.storage_key,
      file_url: result.file_url,
      exam_year: result.exam_year || result.paper_year,
      paper_year: result.paper_year || result.exam_year,
      exam_session: result.exam_session,
      season: result.season,
      material_kind: result.material_kind,
      unit_no: result.unit_no,
      topic: result.topic,
      chapter: result.chapter,
      author: result.author,
      blog_id: result.blog_id,
      blog_title: result.blog_title,
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
