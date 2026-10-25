import { jsonResponse, errorResponse } from "../../lib/json";

interface Env {
  PADHAKU_CORE_DB?: D1Database;
  DB?: D1Database;
}

export async function onRequestGet(context: { env: Env }) {
  const { env } = context;
  const db = env.PADHAKU_CORE_DB || env.DB;

  if (!db) {
    return errorResponse("Database connection unavailable", 500);
  }

  try {
    const query = `
      SELECT 
        d.id,
        d.title,
        d.document_type,
        d.semester,
        d.created_at,
        COALESCE(ds.views, 0) AS views,
        COALESCE(ds.downloads, 0) AS downloads,
        COALESCE(d.author, 'Academic Team') AS author,
        COALESCE(d.material_kind, 'notes') AS material_kind,
        s.name AS subject_name,
        s.code AS subject_code,
        s.code AS subject_slug,
        b.name AS branch_name,
        b.code AS branch_code,
        b.code AS branch_slug
      FROM documents d
      LEFT JOIN document_stats ds ON ds.document_id = d.id
      LEFT JOIN subjects s ON s.id = d.subject_id
      LEFT JOIN branches b ON b.id = d.branch_id
      WHERE d.approval_status = 'approved' OR d.approval_status IS NULL
      ORDER BY d.created_at DESC
      LIMIT 12
    `;

    const { results } = await db.prepare(query).all();

    // Map each document to consistent response fields
    const mapped = (results || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      documentType: row.document_type || 'study-material',
      semester: row.semester ? Number(row.semester) : null,
      createdAt: row.created_at,
      views: Number(row.views || 0),
      downloads: Number(row.downloads || 0),
      author: row.author,
      materialKind: row.material_kind,
      subjectName: row.subject_name || '',
      subjectCode: row.subject_code || '',
      subjectSlug: row.subject_slug || (row.subject_code || row.subject_name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      branchName: row.branch_name || '',
      branchSlug: row.branch_slug || (row.branch_code || row.branch_name || 'computer-engineering').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      link: `/materials/${row.id}`
    }));

    return jsonResponse(mapped, {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300"
      }
    });
  } catch (error: any) {
    console.error("Error fetching latest documents:", error);
    return errorResponse(error?.message || "Failed to fetch latest documents", 500);
  }
}
