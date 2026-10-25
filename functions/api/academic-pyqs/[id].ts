import { deleteDocumentAndFiles } from "../../lib/materialUpload";
import { convertLegacyGtuUrl } from "../../lib/gtuPyqDiscoveryEngine";

const pyqById = `
  SELECT
    d.id,
    d.title,
    b.name AS branch_name,
    s.semester,
    s.name AS subject_name,
    s.code AS subject_code,
    'PYQ' AS exam_type,
    u.name AS university,
    CASE d.season WHEN 'W' THEN 'Winter' WHEN 'S' THEN 'Summer' ELSE NULL END AS exam_month,
    d.paper_year AS exam_year,
    d.description AS short_description,
    blog.content AS content,
    NULL AS important_topics,
    NULL AS difficulty,
    paper.file_url AS question_paper_url,
    solution.file_url AS solution_url,
    d.approval_status AS status,
    d.views,
    d.downloads,
    d.created_at,
    d.updated_at
  FROM documents d
  JOIN universities u ON u.id = d.university_id
  JOIN branches b ON b.id = d.branch_id
  JOIN subjects s ON s.id = d.subject_id
  LEFT JOIN document_files paper ON paper.document_id = d.id AND paper.file_type = 'paper'
  LEFT JOIN document_files solution ON solution.document_id = d.id AND solution.file_type = 'solution'
  LEFT JOIN blogs blog ON blog.related_document_id = d.id
  WHERE d.id = ?
`;

export async function onRequestGet(context: any) {
  try {
    const { env, params } = context;
    const id = params.id;

    const pyq = await env.DB.prepare(pyqById).bind(id).first();

    if (!pyq) {
      return new Response("Not found", { status: 404 });
    }

    const formatted = {
      ...(pyq as any),
      question_paper_url: convertLegacyGtuUrl((pyq as any).question_paper_url),
    };

    return new Response(JSON.stringify(formatted), {
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

    const season = data.exam_month ? (String(data.exam_month).toLowerCase().startsWith("w") ? "W" : "S") : null;
    const examLabel = data.exam_month ? `${data.exam_month} ${data.exam_year || ""}`.trim() : null;

    await env.DB.prepare(
      `UPDATE documents
       SET title = COALESCE(?, title),
           description = COALESCE(?, description),
           approval_status = COALESCE(?, approval_status),
           paper_year = COALESCE(?, paper_year),
           season = COALESCE(?, season),
           exam_label = COALESCE(?, exam_label),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND document_type = 'pyq'`
    )
      .bind(
        data.title ?? null,
        data.short_description ?? null,
        data.status ?? null,
        data.exam_year ?? null,
        season,
        examLabel,
        id
      )
      .run();

    if (data.content !== undefined) {
      const existing = await env.DB.prepare("SELECT id FROM blogs WHERE related_document_id = ?").bind(id).first();
      if (existing) {
        await env.DB.prepare(
          `UPDATE blogs SET title = COALESCE(?, title), content = ?, updated_at = CURRENT_TIMESTAMP WHERE related_document_id = ?`
        )
          .bind(data.title ?? null, data.content, id)
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
