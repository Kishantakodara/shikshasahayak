// ============================================================
// TEACHER API: PUT /api/teacher/notifications/:id/read
// Marks a notification as read
// ============================================================

import { jsonResponse, errorResponse } from "../../../../lib/json";
import { getAuthenticatedUser } from "../../../../lib/auth";

export async function onRequestPut(context: {
  env: { DB?: any; ASSESSMENT_DB?: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const notificationId = params.id;
  const db = env.ASSESSMENT_DB || env.DB;

  if (!db) {
    return errorResponse("Database binding not found", 500);
  }

  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user || !user.uid) {
      return errorResponse("Unauthorized - Authentication required", 401);
    }

    const nowIso = new Date().toISOString();

    await db
      .prepare(`UPDATE notifications SET is_read = 1, read_at = ? WHERE id = ? AND (user_id = ? OR user_id = 'all')`)
      .bind(nowIso, notificationId, user.uid)
      .run();

    return jsonResponse({
      success: true,
      message: "Notification marked as read",
      notificationId,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to mark notification as read";
    console.error("PUT /api/teacher/notifications/:id/read error:", message);
    return errorResponse(message, 500);
  }
}
