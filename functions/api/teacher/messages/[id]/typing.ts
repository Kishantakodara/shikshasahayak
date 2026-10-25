// ============================================================
// TEACHER API: POST /api/teacher/messages/:id/typing
// Real-time typing status indicators for message threads
// ============================================================

import { jsonResponse, errorResponse } from "../../../../lib/json";
import { getAuthenticatedUser } from "../../../../lib/auth";

export async function onRequestPost(context: {
  env: { DB?: any; ASSESSMENT_DB?: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const threadId = params.id;
  const db = env.ASSESSMENT_DB || env.DB;

  if (!db) {
    return errorResponse("Database binding not found", 500);
  }

  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user || !user.uid) {
      return errorResponse("Unauthorized - Authentication required", 401);
    }

    const body = (await request.json().catch(() => ({}))) as {
      is_typing?: boolean;
      isTyping?: boolean;
    };

    const isTyping = body.is_typing ?? body.isTyping ?? true;
    const nowIso = new Date().toISOString();

    try {
      if (isTyping) {
        await db
          .prepare(
            `INSERT OR REPLACE INTO typing_indicators (id, thread_id, user_id, is_typing, updated_at)
             VALUES (?, ?, ?, 1, ?)`
          )
          .bind(`type_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`, threadId, user.uid, nowIso)
          .run();
      } else {
        await db
          .prepare(`DELETE FROM typing_indicators WHERE thread_id = ? AND user_id = ?`)
          .bind(threadId, user.uid)
          .run();
      }
    } catch {
      // typing indicator table is optional
    }

    return jsonResponse({
      success: true,
      message: `Typing indicator ${isTyping ? "set" : "cleared"}`,
      threadId,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update typing status";
    console.error("POST /api/teacher/messages/:id/typing error:", message);
    return errorResponse(message, 500);
  }
}
