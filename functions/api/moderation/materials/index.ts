import { requireAdminOrTeacher } from "../../../lib/auth";

export async function onRequestGet(context: any) {
  const { request, env } = context;

  const { errorResponse: authError } = await requireAdminOrTeacher(request, env);
  if (authError) {
    return authError;
  }
  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "pending";

  try {
    const query = `
      SELECT
        d.id,
        d.title,
        d.document_type,
        d.document_type AS material_type,
        d.approval_status AS status,
        d.created_at,
        d.branch_id,
        d.semester AS semester_no,
        b.name AS branch_name,
        b.short_name AS branch_short_name,
        s.id AS subject_id,
        s.name AS subject_name,
        s.code AS subject_code,
        f.storage_key,
        f.file_url,
        COALESCE(d.author, d.uploaded_by) AS author_name
      FROM documents d
      LEFT JOIN branches b ON b.id = d.branch_id
      LEFT JOIN subjects s ON s.id = d.subject_id
      LEFT JOIN document_files f ON f.document_id = d.id AND f.is_primary = 1
      WHERE d.approval_status = ?
      ORDER BY d.created_at DESC
    `;

    const { results } = await env.DB.prepare(query).bind(status).all();

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
