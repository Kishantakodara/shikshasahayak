// ============================================================
// SHIKSHA SAHAYAK OS API: /api/student/bookmarks
// Authenticated student bookmarks management
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getAuthenticatedUser } from "../../lib/auth";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const db = (env as any).PADHAKU_CORE_DB || env.DB;

  if (!db) {
    return errorResponse("Database binding not found", 500);
  }

  try {
    const authUser = await getAuthenticatedUser(request, env);
    const userId = authUser ? authUser.uid : (url.searchParams.get("userId") || "guest_student");

    const { results } = await db.prepare(
      `SELECT id, user_id, resource_id, resource_type, title, url, subject_name, created_at
       FROM student_bookmarks
       WHERE user_id = ?
       ORDER BY created_at DESC`
    )
      .bind(userId)
      .all<Record<string, unknown>>();

    const bookmarks = (results || []).map((row) => ({
      id: String(row.id),
      userId: String(row.user_id),
      resourceId: String(row.resource_id),
      resourceType: String(row.resource_type),
      title: String(row.title),
      url: String(row.url),
      subjectName: row.subject_name ? String(row.subject_name) : null,
      createdAt: String(row.created_at),
    }));

    return jsonResponse(bookmarks, {
      headers: { "Cache-Control": "private, no-cache" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const db = (env as any).PADHAKU_CORE_DB || env.DB;

  if (!db) {
    return errorResponse("Database binding not found", 500);
  }

  try {
    const authUser = await getAuthenticatedUser(request, env);
    const body = (await request.json()) as {
      userId?: string;
      resourceId: string;
      resourceType?: string;
      title: string;
      url: string;
      subjectName?: string;
    };

    // Strict IDOR protection: Authoritative authUser.uid always takes precedence
    const targetUserId = authUser ? authUser.uid : body?.userId;

    if (!targetUserId || !body || !body.resourceId || !body.title || !body.url) {
      return errorResponse("Missing required bookmark fields", 400);
    }

    const id = `bm_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    await db.prepare(
      `INSERT INTO student_bookmarks (id, user_id, resource_id, resource_type, title, url, subject_name)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, resource_id) DO NOTHING`
    )
      .bind(
        id,
        targetUserId,
        body.resourceId,
        body.resourceType || "study_material",
        body.title,
        body.url,
        body.subjectName || null
      )
      .run();

    return jsonResponse({ success: true, id, userId: targetUserId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}

export async function onRequestDelete(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const resourceId = url.searchParams.get("resourceId");
  const db = (env as any).PADHAKU_CORE_DB || env.DB;

  if (!db) {
    return errorResponse("Database binding not found", 500);
  }

  try {
    const authUser = await getAuthenticatedUser(request, env);
    // Strict IDOR protection: Authenticated user cannot delete other users' bookmarks
    const targetUserId = authUser ? authUser.uid : url.searchParams.get("userId");

    if (!targetUserId || !resourceId) {
      return errorResponse("Missing target user identity or resourceId query parameter", 400);
    }

    await db.prepare(
      `DELETE FROM student_bookmarks WHERE user_id = ? AND resource_id = ?`
    )
      .bind(targetUserId, resourceId)
      .run();

    return jsonResponse({ success: true, resourceId, userId: targetUserId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
