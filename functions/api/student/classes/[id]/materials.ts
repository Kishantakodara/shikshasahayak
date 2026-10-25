import { jsonResponse, errorResponse } from "../../../../lib/json";
import { getAuthenticatedUser } from "../../../../lib/auth";
import { getTeacherDb } from "../../../../lib/classHelpers";

/**
 * GET /api/student/classes/:id/materials
 * Returns all visible materials uploaded by the instructor for this class
 */
export async function onRequestGet(context: {
  env: { PADHAKU_CORE_DB?: D1Database; ASSESSMENT_DB?: D1Database; DB?: D1Database; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const classId = params.id;
  const db = getTeacherDb(env);

  if (!db) {
    return errorResponse("Database binding not configured", 500);
  }

  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user) return errorResponse('Unauthorized', 401);
    const membership = await db.prepare(`SELECT ce.id FROM class_enrollments ce
      JOIN users u ON u.id = ce.student_id
      WHERE ce.class_id = ? AND (u.id = ? OR u.firebase_uid = ?) AND LOWER(ce.enrollment_status) = 'active' LIMIT 1`)
      .bind(classId, user.uid, user.uid).first();
    if (!membership) return errorResponse('Forbidden: Class enrollment required', 403);
    // Even if user object is lightweight, verify class exists
    const cls = await db
      .prepare(`SELECT id, name, section, semester FROM classes WHERE id = ? AND is_active = 1 LIMIT 1`)
      .bind(classId)
      .first<{ id: string; name: string; section?: string; semester?: number }>();

    if (!cls) {
      return errorResponse("Class not found or inactive", 404);
    }

    // Fetch materials with joined document details if available
    let materials: any[] = [];
    try {
      const res = await db
        .prepare(
          `SELECT 
             cm.id,
             cm.class_id,
             cm.document_id,
             cm.title,
             cm.description,
             cm.is_visible,
             cm.created_at,
             cm.updated_at,
             d.title AS doc_title,
             df.file_url,
             df.file_type,
             df.size_bytes AS file_size,
             u.display_name AS uploaded_by_name
           FROM class_materials cm
           LEFT JOIN documents d ON d.id = cm.document_id
           LEFT JOIN document_files df ON df.id = (SELECT id FROM document_files WHERE document_id = d.id ORDER BY is_primary DESC, created_at DESC LIMIT 1)
           LEFT JOIN users u ON u.id = cm.uploaded_by
           WHERE cm.class_id = ? AND cm.is_visible = 1
           ORDER BY cm.created_at DESC`
        )
        .bind(classId)
        .all();
      materials = res.results || [];
    } catch {
      // Fallback if documents table or joins differ
      const fallbackRes = await db
        .prepare(`SELECT * FROM class_materials WHERE class_id = ? AND is_visible = 1 ORDER BY created_at DESC`)
        .bind(classId)
        .all();
      materials = fallbackRes.results || [];
    }

    return jsonResponse({
      success: true,
      classId,
      className: cls.name,
      materials,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch class materials";
    return errorResponse(message, 500);
  }
}
