// ============================================================
// SHIKSHA SAHAYAK OS API: /api/admin/metrics
// SECURITY: Requires admin role
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getPlatformMetrics } from "../../lib/adminPlatformService";
import { getAuthenticatedUser, isAdmin } from "../../lib/auth";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;

  // ── Auth Guard ──────────────────────────────────────────
  const user = await getAuthenticatedUser(request, env);
  if (!user) return errorResponse("Unauthorized", 401);
  if (!isAdmin(user.email, user.role)) return errorResponse("Forbidden: admin access required", 403);
  // ────────────────────────────────────────────────────────

  try {
    const metrics = await getPlatformMetrics(env);
    return jsonResponse(metrics, {
      headers: { "Cache-Control": "private, max-age=60" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
