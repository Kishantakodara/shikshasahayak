// ============================================================
// SHIKSHA SAHAYAK OS API: /api/auth/permissions
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getUserRolesAndPermissions } from "../../lib/identityAuth";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const role = url.searchParams.get("role") || "student";

  try {
    const permissions = await getUserRolesAndPermissions(env, role);
    return jsonResponse({ role, permissions }, {
      headers: {
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
