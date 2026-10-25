// ============================================================
// ADMIN API: GET, PUT, DELETE /api/admin/academic/topics/[id]
// Topic detail, update, and safe deletion
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
    const topic = await env.DB.prepare(`
      SELECT 
        t.id,
        t.unit_id,
        t.topic_no,
        t.title,
        t.description,
        t.created_at,
        t.updated_at,
        u.unit_no,
        u.title AS unit_title,
        u.subject_id,
        s.name AS subject_name,
        s.code AS subject_code
      FROM subject_topics t
      JOIN subject_units u ON u.id = t.unit_id
      JOIN subjects s ON s.id = u.subject_id
      WHERE t.id = ?
    `).bind(id).first<any>();

    if (!topic) return errorResponse("Topic not found", 404);

    return jsonResponse({
      success: true,
      topic
    });
  } catch (error: any) {
    return errorResponse(error.message || "Failed to fetch topic", 500);
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
      topicNo?: number;
      topic_no?: number;
      title?: string;
      description?: string;
    };

    const existing = await env.DB.prepare(`SELECT id, unit_id FROM subject_topics WHERE id = ?`).bind(id).first<any>();
    if (!existing) return errorResponse("Topic not found", 404);

    const topicNo = data.topicNo !== undefined ? data.topicNo : data.topic_no;

    await env.DB.prepare(`
      UPDATE subject_topics SET
        topic_no = COALESCE(?, topic_no),
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      topicNo !== undefined ? Number(topicNo) : null,
      data.title || null,
      data.description !== undefined ? data.description : null,
      id
    ).run();

    await recordAdminAuditLog(
      env as any,
      user.email || user.uid,
      "TOPIC_UPDATE",
      "curriculum_topic",
      id,
      data
    );

    return jsonResponse({
      success: true,
      message: "Topic updated successfully"
    });
  } catch (error: any) {
    return errorResponse(error.message || "Failed to update topic", 500);
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
    const existing = await env.DB.prepare(`SELECT id, title, unit_id FROM subject_topics WHERE id = ?`).bind(id).first<any>();
    if (!existing) return errorResponse("Topic not found", 404);

    await env.DB.prepare(`DELETE FROM subject_topics WHERE id = ?`).bind(id).run();

    await recordAdminAuditLog(
      env as any,
      user.email || user.uid,
      "TOPIC_DELETE",
      "curriculum_topic",
      id,
      { topic: existing }
    );

    return jsonResponse({
      success: true,
      message: `Topic "${existing.title}" deleted successfully`
    });
  } catch (error: any) {
    return errorResponse(error.message || "Failed to delete topic", 500);
  }
}
