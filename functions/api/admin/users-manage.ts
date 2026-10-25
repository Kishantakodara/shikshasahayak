// ============================================================
// SHIKSHA SAHAYAK OS API: /api/admin/users-manage
// SECURITY: Requires admin role
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { recordAdminAuditLog } from "../../lib/adminPlatformService";
import { getAuthenticatedUser, isAdmin } from "../../lib/auth";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;

  // ── Auth Guard ──────────────────────────────────────────
  const user = await getAuthenticatedUser(request, env);
  if (!user) return errorResponse("Unauthorized", 401);
  if (!isAdmin(user.email, user.role) && user.role !== "admin") return errorResponse("Forbidden: admin access required", 403);
  // ────────────────────────────────────────────────────────

  try {
    let users: unknown[] = [];
    try {
      const { results } = await env.DB.prepare(
        `SELECT id, uid, email, display_name, user_type AS role, created_at
         FROM unified_users
         ORDER BY created_at DESC
         LIMIT 100`
      ).all<Record<string, unknown>>();

      users = (results || []).map((r) => ({
        id: String(r.id || r.uid || ""),
        email: String(r.email || ""),
        displayName: String(r.display_name || ""),
        role: String(r.role || "student"),
        createdAt: String(r.created_at || ""),
      }));
    } catch {
      // Fallback
      users = [];
    }

    return jsonResponse(users, {
      headers: { "Cache-Control": "private, no-cache" },
    });
  } catch (error: unknown) {
    return errorResponse("Internal Server Error", 500);
  }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  // ── Auth Guard ──────────────────────────────────────────
  const user = await getAuthenticatedUser(request, env);
  if (!user) return errorResponse("Unauthorized", 401);
  if (!isAdmin(user.email, user.role) && user.role !== "admin") return errorResponse("Forbidden: admin access required", 403);
  // ────────────────────────────────────────────────────────

  try {
    const body = (await request.json()) as {
      targetUserId: string;
      newRole?: string;
      newStatus?: string;
    };

    if (!body || !body.targetUserId) {
      return errorResponse("Missing targetUserId", 400);
    }

    const allowedRoles = ["student", "teacher", "admin", "moderator", "super_admin"];
    if (body.newRole && !allowedRoles.includes(body.newRole)) {
      return errorResponse("Invalid role value", 400);
    }

    if (body.newRole) {
      await env.DB.prepare(
        `UPDATE unified_users SET user_type = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? OR uid = ? OR LOWER(email) = LOWER(?)`
      )
        .bind(body.newRole, body.targetUserId, body.targetUserId, body.targetUserId)
        .run();
    }

    if (body.newStatus) {
      await env.DB.prepare(
        `UPDATE unified_users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? OR uid = ? OR LOWER(email) = LOWER(?)`
      )
        .bind(body.newStatus, body.targetUserId, body.targetUserId, body.targetUserId)
        .run();
    }

    await recordAdminAuditLog(
      env,
      user.uid,
      "USER_ROLE_MUTATION",
      "unified_users",
      body.targetUserId,
      { newRole: body.newRole, newStatus: body.newStatus, actorEmail: user.email }
    );

    return jsonResponse({ success: true, targetUserId: body.targetUserId });
  } catch (error: unknown) {
    return errorResponse("Internal Server Error", 500);
  }
}
