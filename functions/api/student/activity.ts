// ============================================================
// SHIKSHA SAHAYAK OS API: /api/student/activity
// Authenticated student recent activity logger and feed
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getAuthenticatedUser } from "../../lib/auth";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);

  try {
    const authUser = await getAuthenticatedUser(request, env);
    const userId = authUser ? authUser.uid : (url.searchParams.get("userId") || "guest_student");

    const { results } = await env.DB.prepare(
      `SELECT id, user_id, action_type, resource_id, resource_title, url, subject_name, created_at
       FROM student_recent_activity
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 20`
    )
      .bind(userId)
      .all<Record<string, unknown>>();

    const activities = (results || []).map((row) => ({
      id: String(row.id),
      userId: String(row.user_id),
      actionType: String(row.action_type),
      resourceId: String(row.resource_id),
      resourceTitle: String(row.resource_title),
      url: String(row.url),
      subjectName: row.subject_name ? String(row.subject_name) : null,
      createdAt: String(row.created_at),
    }));

    return jsonResponse(activities, {
      headers: { "Cache-Control": "private, no-cache" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    const authUser = await getAuthenticatedUser(request, env);
    const body = (await request.json()) as {
      userId?: string;
      actionType?: string;
      resourceId: string;
      resourceTitle: string;
      url: string;
      subjectName?: string;
    };

    const targetUserId = authUser ? authUser.uid : body?.userId;

    if (!targetUserId || !body || !body.resourceId || !body.resourceTitle || !body.url) {
      return errorResponse("Missing required activity fields", 400);
    }

    const id = `act_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    await env.DB.prepare(
      `INSERT INTO student_recent_activity (id, user_id, action_type, resource_id, resource_title, url, subject_name)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        targetUserId,
        body.actionType || "view",
        body.resourceId,
        body.resourceTitle,
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
