// ============================================================
// SHIKSHA SAHAYAK OS API: /api/performance/telemetry
// SECURITY: GET requires admin, POST requires authentication
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import {
  recordPerformanceTelemetry,
  getPerformanceHealthSummary,
} from "../../lib/performanceOptimizationService";
import { getAuthenticatedUser, isAdmin } from "../../lib/auth";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;

  // ── Auth Guard — admin only for health dashboard ────────
  const user = await getAuthenticatedUser(request, env);
  if (!user) return errorResponse("Unauthorized", 401);
  if (!isAdmin(user.email)) return errorResponse("Forbidden: admin access required", 403);
  // ────────────────────────────────────────────────────────

  try {
    const summary = await getPerformanceHealthSummary(env);
    return jsonResponse(summary, {
      headers: { "Cache-Control": "private, max-age=30" },
    });
  } catch (error: unknown) {
    return errorResponse("Internal Server Error", 500);
  }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  // ── Auth Guard — any authenticated user can submit telemetry
  const user = await getAuthenticatedUser(request, env);
  if (!user) return errorResponse("Unauthorized", 401);
  // ────────────────────────────────────────────────────────

  try {
    const body = (await request.json()) as {
      endpoint: string;
      method?: string;
      statusCode?: number;
      latencyMs: number;
      errorMessage?: string;
    };

    if (!body || !body.endpoint || body.latencyMs === undefined) {
      return errorResponse("Missing required telemetry fields", 400);
    }

    // Clamp latency to sane range to prevent data poisoning
    const latencyMs = Math.min(Math.max(Number(body.latencyMs), 0), 60000);

    const success = await recordPerformanceTelemetry(
      env,
      String(body.endpoint).slice(0, 200),
      body.method || "GET",
      body.statusCode || 200,
      latencyMs,
      user.uid, // always use server-verified UID
      body.errorMessage ? String(body.errorMessage).slice(0, 500) : undefined
    );

    return jsonResponse({ success });
  } catch (error: unknown) {
    return errorResponse("Internal Server Error", 500);
  }
}
