import { getAuthenticatedUser, isAdmin } from "../../../lib/auth";
import { jsonResponse, errorResponse } from "../../../lib/json";

// PUT /api/admin/feedback/:id — update status or add admin reply
export async function onRequestPut(context: { request: Request; env: { DB: D1Database }; params: { id: string } }) {
  const { request, env, params } = context;
  const user = await getAuthenticatedUser(request, env);
  if (!user) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(user.email, user.role)) return errorResponse("Forbidden: Admin access required", 403);
  if (!env.DB) return errorResponse("Database not configured", 500);

  const id = params.id;
  if (!id) return errorResponse("Feedback ID required", 400);

  try {
    const body: any = await request.json();
    const { status, admin_reply } = body;
    const now = new Date().toISOString();

    const updates: string[] = [];
    const values: (string | null)[] = [];

    if (status !== undefined) { updates.push("status = ?"); values.push(status); }
    if (admin_reply !== undefined) { updates.push("admin_reply = ?"); values.push(admin_reply); }
    if (updates.length === 0) return errorResponse("No fields to update", 400);

    updates.push("updated_at = ?");
    values.push(now);
    values.push(id);

    await env.DB.prepare(`UPDATE user_feedback SET ${updates.join(", ")} WHERE id = ?`).bind(...values).run();
    return jsonResponse({ success: true });
  } catch (error: any) {
    console.error("Error updating feedback:", error);
    return errorResponse(error.message || "Failed to update feedback", 500);
  }
}

// DELETE /api/admin/feedback/:id — remove a feedback entry
export async function onRequestDelete(context: { request: Request; env: { DB: D1Database }; params: { id: string } }) {
  const { request, env, params } = context;
  const user = await getAuthenticatedUser(request, env);
  if (!user) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(user.email, user.role)) return errorResponse("Forbidden: Admin access required", 403);
  if (!env.DB) return errorResponse("Database not configured", 500);

  const id = params.id;
  if (!id) return errorResponse("Feedback ID required", 400);

  try {
    await env.DB.prepare("DELETE FROM user_feedback WHERE id = ?").bind(id).run();
    return jsonResponse({ success: true });
  } catch (error: any) {
    console.error("Error deleting feedback:", error);
    return errorResponse(error.message || "Failed to delete feedback", 500);
  }
}
