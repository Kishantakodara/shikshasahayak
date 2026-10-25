import { getAuthenticatedUser, isAdmin } from "../../../lib/auth";
import { jsonResponse, errorResponse } from "../../../lib/json";

export async function onRequestGet(context: { request: Request; env: { DB: D1Database; ASSESSMENT_DB?: any } }) {
  const { request, env } = context;

  const user = await getAuthenticatedUser(request, env);
  if (!user) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(user.email, user.role)) {
    return errorResponse("Unauthorized", 403);
  }

  if (!env.DB) {
    return errorResponse("Database is not configured", 500);
  }

  try {
    const { results } = await env.DB.prepare(`
      SELECT id, user_email, description, screenshot_url, error_stack, browser_info, status, created_at, updated_at
      FROM bug_reports
      ORDER BY created_at DESC
    `).all();

    return jsonResponse(results || []);
  } catch (error: any) {
    console.error("Error fetching admin bug reports:", error);
    return errorResponse(error.message || "Failed to fetch bug reports", 500);
  }
}
