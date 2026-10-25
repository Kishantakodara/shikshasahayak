// ============================================================
// ADMIN API: GET & POST /api/admin/academic/topics
// Single Source of Truth for Subject Topics in Curriculum CMS
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
  const unitId = url.searchParams.get("unitId") || url.searchParams.get("unit_id");
  const subjectId = url.searchParams.get("subjectId") || url.searchParams.get("subject_id");

  try {
    let query = `
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
    `;
    const bindings: any[] = [];

    if (unitId) {
      query += ` WHERE t.unit_id = ?`;
      bindings.push(unitId);
    } else if (subjectId) {
      query += ` WHERE u.subject_id = ?`;
      bindings.push(subjectId);
    }

    query += ` ORDER BY u.unit_no ASC, t.topic_no ASC`;

    const { results } = await env.DB.prepare(query).bind(...bindings).all<any>();

    return jsonResponse({
      success: true,
      count: results?.length || 0,
      topics: results || []
    });
  } catch (error: any) {
    return errorResponse(error.message || "Failed to fetch topics", 500);
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
      unitId?: string;
      unit_id?: string;
      topicNo?: number;
      topic_no?: number;
      title: string;
      description?: string;
    };

    const unitId = data.unitId || data.unit_id;
    const topicNo = data.topicNo !== undefined ? data.topicNo : data.topic_no;
    const title = data.title ? data.title.trim() : "";

    if (!unitId || topicNo === undefined || !title) {
      return errorResponse("Missing required fields: unitId, topicNo, title", 400);
    }

    const unit = await env.DB.prepare(`SELECT id, title, subject_id FROM subject_units WHERE id = ?`).bind(unitId).first<any>();
    if (!unit) {
      return errorResponse("Unit not found", 404);
    }

    const topicId = `topic_${crypto.randomUUID().slice(0, 8)}`;

    await env.DB.prepare(`
      INSERT INTO subject_topics (id, unit_id, topic_no, title, description)
      VALUES (?, ?, ?, ?, ?)
    `).bind(topicId, unitId, Number(topicNo), title, data.description || null).run();

    // Dual-write into KeyDocs 3.0 curriculum_nodes for instant canonical sync
    await env.DB.prepare(`
      INSERT INTO curriculum_nodes (id, subject_id, parent_id, node_type, node_number, title, description, sort_order)
      VALUES (?, ?, ?, 'topic', ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET title = excluded.title, description = excluded.description
    `).bind(topicId, unit.subject_id, unitId, Number(topicNo), title, data.description || null, Math.floor(Number(topicNo))).run();

    await recordAdminAuditLog(
      env as any,
      user.email || user.uid,
      "TOPIC_CREATE",
      "curriculum_topic",
      topicId,
      { unitId, topicNo: Number(topicNo), title, description: data.description }
    );

    return jsonResponse({
      success: true,
      id: topicId,
      topic: {
        id: topicId,
        unit_id: unitId,
        topic_no: Number(topicNo),
        title,
        description: data.description || null
      },
      message: `Topic ${topicNo}: "${title}" created successfully`
    });
  } catch (error: any) {
    return errorResponse(error.message || "Failed to create topic", 500);
  }
}
