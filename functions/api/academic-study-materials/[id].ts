import { deleteDocumentAndFiles } from "../../lib/materialUpload";

const studyById = `
  SELECT
    d.id,
    d.title,
    b.name AS branch_name,
    s.semester,
    s.name AS subject_name,
    d.unit_no AS unit_number,
    d.topic AS topic_name,
    d.author AS faculty_name,
    u.name AS university,
    NULL AS academic_year,
    d.description AS short_description,
    blog.content AS content,
    blog.tags AS tags,
    blog.thumbnail AS cover_image_url,
    file.file_url AS pdf_url,
    d.approval_status AS status,
    0 AS is_featured,
    d.views,
    d.downloads,
    d.created_at,
    d.updated_at
  FROM documents d
  JOIN universities u ON u.id = d.university_id
  JOIN branches b ON b.id = d.branch_id
  JOIN subjects s ON s.id = d.subject_id
  LEFT JOIN document_files file ON file.document_id = d.id AND file.is_primary = 1
  LEFT JOIN blogs blog ON blog.related_document_id = d.id
  WHERE d.id = ?
`;

export async function onRequestGet(context: any) {
  try {
    const { env, params } = context;
    const id = params.id;

    const note = await env.DB.prepare(studyById).bind(id).first();

    if (!note) {
      return new Response("Not found", { status: 404 });
    }

    return new Response(JSON.stringify(note), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(err.message, { status: 500 });
  }
}

export async function onRequestPut(context: any) {
  try {
    const { env, params, request } = context;
    const id = params.id;
    const data = await request.json();

    await env.DB.prepare(
      `UPDATE documents
       SET title = COALESCE(?, title),
           description = COALESCE(?, description),
           approval_status = COALESCE(?, approval_status),
           unit_no = COALESCE(?, unit_no),
           topic = COALESCE(?, topic),
           author = COALESCE(?, author),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND document_type = 'study-material'`
    )
      .bind(
        data.title ?? null,
        data.short_description ?? null,
        data.status ?? null,
        data.unit_number ?? null,
        data.topic_name ?? null,
        data.faculty_name ?? null,
        id
      )
      .run();

    if (data.content !== undefined) {
      const existing = await env.DB.prepare("SELECT id FROM blogs WHERE related_document_id = ?").bind(id).first();
      if (existing) {
        await env.DB.prepare(
          `UPDATE blogs
           SET title = COALESCE(?, title),
               content = ?,
               tags = COALESCE(?, tags),
               thumbnail = COALESCE(?, thumbnail),
               updated_at = CURRENT_TIMESTAMP
           WHERE related_document_id = ?`
        )
          .bind(data.title ?? null, data.content, data.tags ?? null, data.cover_image_url ?? null, id)
          .run();
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(err.message, { status: 500 });
  }
}

export async function onRequestDelete(context: any) {
  try {
    const { env, params } = context;
    const id = params.id;

    await deleteDocumentAndFiles(env, id);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(err.message, { status: 500 });
  }
}
