// ============================================================
// ADMIN API: GET, PUT, DELETE /api/admin/academic/units/[id]
// Unit detail, update, and cascading safe deletion
// ============================================================

import { jsonResponse, errorResponse } from "../../../../lib/json";
import { getAuthenticatedUser, isAdmin } from "../../../../lib/auth";
import { recordAdminAuditLog } from "../../../../lib/adminPlatformService";

export async function onRequestGet(context: {
  params: { id: string };
  request: Request;
  env: { 
    DB: D1Database;
    FIREBASE_PROJECT_ID?: string;
    VITE_FIREBASE_PROJECT_ID?: string;
  };
}) {
  const { params, request, env } = context;
  const id = params.id;

  const user = await getAuthenticatedUser(request, env as any);
  if (!user) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(user.email, user.role) && user.role !== "admin") {
    return errorResponse("Forbidden: Admin authorization required", 403);
  }

  try {
    const unit = await env.DB.prepare(`
      SELECT 
        u.id,
        u.subject_id,
        u.unit_no,
        u.title,
        u.description,
        u.created_at,
        u.updated_at,
        s.name AS subject_name,
        s.code AS subject_code
      FROM subject_units u
      JOIN subjects s ON s.id = u.subject_id
      WHERE u.id = ?
    `).bind(id).first<any>();

    if (!unit) return errorResponse("Unit not found", 404);

    const { results: topics } = await env.DB.prepare(`
      SELECT id, unit_id, topic_no, title, description, created_at, updated_at
      FROM subject_topics
      WHERE unit_id = ?
      ORDER BY topic_no ASC
    `).bind(id).all<any>();

    return jsonResponse({
      success: true,
      unit: {
        ...unit,
        topics: topics || []
      }
    });
  } catch (error: any) {
    return errorResponse(error.message || "Failed to fetch unit", 500);
  }
}

export async function onRequestPut(context: {
  params: { id: string };
  request: Request;
  env: { 
    DB: D1Database;
    FIREBASE_PROJECT_ID?: string;
    VITE_FIREBASE_PROJECT_ID?: string;
  };
}) {
  const { params, request, env } = context;
  const id = params.id;

  const user = await getAuthenticatedUser(request, env as any);
  if (!user) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(user.email, user.role) && user.role !== "admin") {
    return errorResponse("Forbidden: Admin authorization required", 403);
  }

  try {
    const data = await request.json() as {
      unitNo?: number;
      unit_no?: number;
      title?: string;
      description?: string;
    };

    const existing = await env.DB.prepare(`SELECT id, subject_id FROM subject_units WHERE id = ?`).bind(id).first<any>();
    if (!existing) return errorResponse("Unit not found", 404);

    const unitNo = data.unitNo !== undefined ? data.unitNo : data.unit_no;

    await env.DB.prepare(`
      UPDATE subject_units SET
        unit_no = COALESCE(?, unit_no),
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      unitNo !== undefined ? Number(unitNo) : null,
      data.title || null,
      data.description !== undefined ? data.description : null,
      id
    ).run();

    await recordAdminAuditLog(
      env as any,
      user.email || user.uid,
      "UNIT_UPDATE",
      "curriculum_unit",
      id,
      data
    );

    return jsonResponse({
      success: true,
      message: "Unit updated successfully"
    });
  } catch (error: any) {
    return errorResponse(error.message || "Failed to update unit", 500);
  }
}

export async function onRequestDelete(context: {
  params: { id: string };
  request: Request;
  env: { 
    DB: D1Database;
    FIREBASE_PROJECT_ID?: string;
    VITE_FIREBASE_PROJECT_ID?: string;
  };
}) {
  const { params, request, env } = context;
  const id = params.id;

  const user = await getAuthenticatedUser(request, env as any);
  if (!user) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(user.email, user.role) && user.role !== "admin") {
    return errorResponse("Forbidden: Admin authorization required", 403);
  }

  try {
    const existing = await env.DB.prepare(`SELECT id, title, subject_id FROM subject_units WHERE id = ?`).bind(id).first<any>();
    if (!existing) return errorResponse("Unit not found", 404);

    // Cascade: delete topics first then unit
    await env.DB.prepare(`DELETE FROM subject_topics WHERE unit_id = ?`).bind(id).run();
    await env.DB.prepare(`DELETE FROM subject_units WHERE id = ?`).bind(id).run();

    await recordAdminAuditLog(
      env as any,
      user.email || user.uid,
      "UNIT_DELETE",
      "curriculum_unit",
      id,
      { unit: existing }
    );

    return jsonResponse({
      success: true,
      message: `Unit "${existing.title}" and its topics deleted successfully`
    });
  } catch (error: any) {
    return errorResponse(error.message || "Failed to delete unit", 500);
  }
}
