import { getAuthenticatedUser, isAdmin } from "../../../lib/auth";
import { jsonResponse, errorResponse } from "../../../lib/json";

export async function onRequestGet(context: any) {
  const { request, env, params } = context;
  const id = params.id as string;

  const user = await getAuthenticatedUser(request, env);
  if (!user) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(user.email, user.role)) {
    return errorResponse("Unauthorized", 403);
  }

  try {
    const popup = await env.DB.prepare(
      `SELECT * FROM website_popups WHERE id = ?`
    ).bind(id).first();

    if (!popup) {
      return errorResponse("Popup not found", 404);
    }

    return jsonResponse(popup);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function onRequestPut(context: any) {
  const { request, env, params } = context;
  const id = params.id as string;

  const user = await getAuthenticatedUser(request, env);
  if (!user) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(user.email, user.role)) {
    return errorResponse("Unauthorized", 403);
  }

  try {
    const data = await request.json();
    const { title, type, html_content, is_active, start_date, end_date, frequency, expiry_days } = data;

    if (!title || !title.trim()) {
      return errorResponse("Title is required", 400);
    }
    if (!html_content || !html_content.trim()) {
      return errorResponse("HTML content is required", 400);
    }

    const activeVal = is_active ? 1 : 0;

    const result = await env.DB.prepare(
      `UPDATE website_popups 
       SET title = ?, type = ?, html_content = ?, is_active = ?, start_date = ?, end_date = ?, frequency = ?, expiry_days = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).bind(
      title.trim(),
      type || "announcement",
      html_content.trim(),
      activeVal,
      start_date || null,
      end_date || null,
      frequency || "once",
      expiry_days !== undefined ? Number(expiry_days) : 7,
      id
    ).run();

    if (result.meta?.changes === 0) {
      return errorResponse("Popup not found", 404);
    }

    return jsonResponse({
      id,
      title: title.trim(),
      type: type || "announcement",
      html_content: html_content.trim(),
      is_active: activeVal,
      start_date: start_date || null,
      end_date: end_date || null,
      frequency: frequency || "once",
      expiry_days: expiry_days !== undefined ? Number(expiry_days) : 7
    });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function onRequestDelete(context: any) {
  const { request, env, params } = context;
  const id = params.id as string;

  const user = await getAuthenticatedUser(request, env);
  if (!user) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(user.email, user.role)) {
    return errorResponse("Unauthorized", 403);
  }

  try {
    const result = await env.DB.prepare(
      `DELETE FROM website_popups WHERE id = ?`
    ).bind(id).run();

    if (result.meta?.changes === 0) {
      return errorResponse("Popup not found", 404);
    }

    return jsonResponse({ success: true });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
