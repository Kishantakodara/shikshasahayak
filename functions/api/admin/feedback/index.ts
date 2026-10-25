import { getAuthenticatedUser, isAdmin } from "../../../lib/auth";
import { jsonResponse, errorResponse } from "../../../lib/json";

// GET /api/admin/feedback — list all user feedback submissions
export async function onRequestGet(context: { request: Request; env: { DB: D1Database } }) {
  const { request, env } = context;
  const user = await getAuthenticatedUser(request, env);
  if (!user) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(user.email, user.role)) return errorResponse("Forbidden: Admin access required", 403);
  if (!env.DB) return errorResponse("Database not configured", 500);

  try {
    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    const status = url.searchParams.get("status");
    const limit = Math.min(Number(url.searchParams.get("limit") || "100"), 500);

    let query = `SELECT id, user_id, user_email, type, rating, message, page_url, status, admin_reply, created_at, updated_at FROM user_feedback`;
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (type) { conditions.push("type = ?"); params.push(type); }
    if (status) { conditions.push("status = ?"); params.push(status); }
    if (conditions.length > 0) query += ` WHERE ${conditions.join(" AND ")}`;
    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);

    const { results } = await env.DB.prepare(query).bind(...params).all();
    return jsonResponse(results || []);
  } catch (error: any) {
    console.error("Error fetching feedback:", error);
    return errorResponse(error.message || "Failed to fetch feedback", 500);
  }
}
