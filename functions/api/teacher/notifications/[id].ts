import { jsonResponse, errorResponse } from "../../../lib/json";
import { getAuthenticatedUser } from "../../../lib/auth";

/**
 * PUT /api/teacher/notifications/:id/read
 * Mark a notification as read
 * 
 * Requirements: 8.2
 */
export async function onRequestPut(context: {
  env: { ASSESSMENT_DB: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const notificationId = params.id;
  const url = new URL(request.url);

  try {
    // Check if this is a read action
    if (!url.pathname.endsWith('/read')) {
      return errorResponse("Invalid action. Use /read to mark as read", 400);
    }

    // Authenticate user
    const user = await getAuthenticatedUser(request, env);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    // Verify notification exists and belongs to user
    const notification = await env.ASSESSMENT_DB
      .prepare("SELECT id, user_id, is_read FROM notifications WHERE id = ?")
      .bind(notificationId)
      .first();

    if (!notification) {
      return errorResponse("Notification not found", 404);
    }

    if (notification.user_id !== user.uid) {
      return errorResponse("Forbidden: You can only mark your own notifications as read", 403);
    }

    if (notification.is_read) {
      return jsonResponse({
        success: true,
        message: "Notification already marked as read",
        notification_id: notificationId,
      });
    }

    // Mark as read
    const result = await env.ASSESSMENT_DB
      .prepare(
        "UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE id = ?"
      )
      .bind(notificationId)
      .run();

    if (!result.success) {
      return errorResponse("Failed to mark notification as read", 500);
    }

    return jsonResponse({
      success: true,
      message: "Notification marked as read",
      notification_id: notificationId,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("PUT /api/teacher/notifications/:id/read error:", message);
    return errorResponse(message, 500);
  }
}

/**
 * DELETE /api/teacher/notifications/:id
 * Delete a notification
 * 
 * Requirements: 8.2
 */
export async function onRequestDelete(context: {
  env: { ASSESSMENT_DB: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const notificationId = params.id;

  try {
    // Authenticate user
    const user = await getAuthenticatedUser(request, env);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    // Verify notification exists and belongs to user
    const notification = await env.ASSESSMENT_DB
      .prepare("SELECT id, user_id FROM notifications WHERE id = ?")
      .bind(notificationId)
      .first();

    if (!notification) {
      return errorResponse("Notification not found", 404);
    }

    if (notification.user_id !== user.uid) {
      return errorResponse("Forbidden: You can only delete your own notifications", 403);
    }

    // Delete notification
    const result = await env.ASSESSMENT_DB
      .prepare("DELETE FROM notifications WHERE id = ?")
      .bind(notificationId)
      .run();

    if (!result.success) {
      return errorResponse("Failed to delete notification", 500);
    }

    return jsonResponse({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("DELETE /api/teacher/notifications/:id error:", message);
    return errorResponse(message, 500);
  }
}