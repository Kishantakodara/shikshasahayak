import { getAuthenticatedUser, isAdmin } from "../../../lib/auth";
import { jsonResponse, errorResponse } from "../../../lib/json";

export async function onRequestPut(context: {
  request: Request;
  env: { DB: D1Database; ASSESSMENT_DB?: any };
  params: { id: string };
}) {
  const { request, env, params } = context;
  const { id } = params;

  const user = await getAuthenticatedUser(request, env);
  if (!user) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(user.email, user.role)) {
    return errorResponse("Unauthorized", 403);
  }

  if (!env.DB) {
    return errorResponse("Database is not configured", 500);
  }

  try {
    const data = await request.json() as any;
    const { status } = data;

    const validStatuses = ["pending", "investigating", "resolved", "closed"];
    if (!status || !validStatuses.includes(status)) {
      return errorResponse(`Invalid status. Must be one of: ${validStatuses.join(", ")}`, 400);
    }

    const result = await env.DB.prepare(`
      UPDATE bug_reports
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(status, id).run();

    if (result.meta.changes === 0) {
      return errorResponse("Bug report not found", 404);
    }

    return jsonResponse({ success: true, message: `Bug report status updated to ${status}.` });
  } catch (error: any) {
    console.error("Error updating bug report status:", error);
    return errorResponse(error.message || "Failed to update bug report", 500);
  }
}

export async function onRequestDelete(context: {
  request: Request;
  env: { DB: D1Database; ASSESSMENT_DB?: any };
  params: { id: string };
}) {
  const { request, env, params } = context;
  const { id } = params;

  const user = await getAuthenticatedUser(request, env);
  if (!user) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(user.email, user.role)) {
    return errorResponse("Unauthorized", 403);
  }

  if (!env.DB) {
    return errorResponse("Database is not configured", 500);
  }

  try {
    const result = await env.DB.prepare(`
      DELETE FROM bug_reports WHERE id = ?
    `).bind(id).run();

    if (result.meta.changes === 0) {
      return errorResponse("Bug report not found", 404);
    }

    return jsonResponse({ success: true, message: "Bug report deleted successfully." });
  } catch (error: any) {
    console.error("Error deleting bug report:", error);
    return errorResponse(error.message || "Failed to delete bug report", 500);
  }
}
