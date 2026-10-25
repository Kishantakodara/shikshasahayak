// ============================================================
// SHIKSHA SAHAYAK OS API: /api/auth/sessions
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getActiveSessions } from "../../lib/identityAuth";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId") || "guest_user";

  try {
    const sessions = await getActiveSessions(env, userId);
    return jsonResponse(sessions, {
      headers: {
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
