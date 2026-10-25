// ============================================================
// ADMIN API: GET & POST /api/admin/academic/units
// Single Source of Truth for Subject Units in Curriculum CMS
// ============================================================

import { jsonResponse, errorResponse } from "../../../../lib/json";
import { getAuthenticatedUser, isAdmin } from "../../../../lib/auth";
import { recordAdminAuditLog } from "../../../../lib/adminPlatformService";

export async function onRequestGet(context: {
  request: Request;
  env: { 
    DB: D1Database;
    FIREBASE_PROJECT_ID?: string;
    VITE_FIREBASE_PROJECT_ID?: string;
  };
}) {
  const { request, env } = context;

  // Auth Guard
  const user = await getAuthenticatedUser(request, env as any);
  if (!user) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(user.email, user.role) && user.role !== "admin") {
    return errorResponse("Forbidden: Admin authorization required", 403);
  }

  const url = new URL(request.url);
  const subjectId = url.searchParams.get("subjectId") || url.searchParams.get("subject_id");

  try {
    let query = `
      SELECT 
        u.id,
        u.subject_id,
        u.unit_no,
        u.title,
        u.description,
        u.created_at,
        u.updated_at,
        s.name AS subject_name,
        s.code AS subject_code,
        (SELECT COUNT(t.id) FROM subject_topics t WHERE t.unit_id = u.id) as topics_count,
        (SELECT COUNT(d.id) FROM documents d WHERE d.subject_id = u.subject_id AND d.unit_no = u.unit_no AND d.document_type = 'study-material') as materials_count,
        (SELECT COUNT(d.id) FROM documents d WHERE d.subject_id = u.subject_id AND d.unit_no = u.unit_no AND d.document_type = 'pyq') as pyqs_count
      FROM subject_units u
      JOIN subjects s ON s.id = u.subject_id
    `;
    const bindings: any[] = [];

    if (subjectId) {
      query += ` WHERE u.subject_id = ?`;
      bindings.push(subjectId);
    }

    query += ` ORDER BY u.unit_no ASC`;

    const { results } = await env.DB.prepare(query).bind(...bindings).all<any>();

    return jsonResponse({
      success: true,
      count: results?.length || 0,
      units: results || []
    });
  } catch (error: any) {
    return errorResponse(error.message || "Failed to fetch units", 500);
  }
}

export async function onRequestPost(context: {
  request: Request;
  env: { 
    DB: D1Database;
    FIREBASE_PROJECT_ID?: string;
    VITE_FIREBASE_PROJECT_ID?: string;
  };
}) {
  const { request, env } = context;

  // Auth Guard
  const user = await getAuthenticatedUser(request, env as any);
  if (!user) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(user.email, user.role) && user.role !== "admin") {
    return errorResponse("Forbidden: Admin authorization required", 403);
  }

  try {
    const data = await request.json() as {
      subjectId?: string;
      subject_id?: string;
      unitNo?: number;
      unit_no?: number;
      title: string;
      description?: string;
    };

    const subjectId = data.subjectId || data.subject_id;
    const unitNo = data.unitNo !== undefined ? data.unitNo : data.unit_no;
    const title = data.title ? data.title.trim() : "";

    if (!subjectId || unitNo === undefined || !title) {
      return errorResponse("Missing required fields: subjectId, unitNo, title", 400);
    }

    const subject = await env.DB.prepare(`SELECT id, name FROM subjects WHERE id = ?`).bind(subjectId).first();
    if (!subject) {
      return errorResponse("Subject not found", 404);
    }

    const unitId = `unit_${crypto.randomUUID().slice(0, 8)}`;

    await env.DB.prepare(`
      INSERT INTO subject_units (id, subject_id, unit_no, title, description)
      VALUES (?, ?, ?, ?, ?)
    `).bind(unitId, subjectId, Number(unitNo), title, data.description || null).run();

    // Dual-write into KeyDocs 3.0 curriculum_nodes for instant canonical sync
    await env.DB.prepare(`
      INSERT INTO curriculum_nodes (id, subject_id, parent_id, node_type, node_number, title, description, sort_order)
      VALUES (?, ?, NULL, 'unit', ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET title = excluded.title, description = excluded.description
    `).bind(unitId, subjectId, Number(unitNo), title, data.description || null, Number(unitNo)).run();

    await recordAdminAuditLog(
      env as any,
      user.email || user.uid,
      "UNIT_CREATE",
      "curriculum_unit",
      unitId,
      { subjectId, unitNo: Number(unitNo), title, description: data.description }
    );

    return jsonResponse({
      success: true,
      id: unitId,
      unit: {
        id: unitId,
        subject_id: subjectId,
        unit_no: Number(unitNo),
        title,
        description: data.description || null
      },
      message: `Unit ${unitNo}: "${title}" created successfully`
    });
  } catch (error: any) {
    return errorResponse(error.message || "Failed to create unit", 500);
  }
}
