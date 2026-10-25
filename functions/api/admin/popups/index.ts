import { getAuthenticatedUser, isAdmin } from "../../../lib/auth";
import { jsonResponse, errorResponse } from "../../../lib/json";

export async function onRequestGet(context: any) {
  const { request, env } = context;

  const user = await getAuthenticatedUser(request, env);
  if (!user) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(user.email, user.role)) {
    return errorResponse("Unauthorized", 403);
  }

  try {
    const { results } = await env.DB.prepare(
      `SELECT * FROM website_popups ORDER BY created_at DESC`
    ).all();

    return jsonResponse(results || []);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function onRequestPost(context: any) {
  const { request, env } = context;

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

    const id = `pop_${crypto.randomUUID().split("-")[0]}`;
    const activeVal = is_active ? 1 : 0;

    await env.DB.prepare(
      `INSERT INTO website_popups (id, title, type, html_content, is_active, start_date, end_date, frequency, expiry_days)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      title.trim(),
      type || "announcement",
      html_content.trim(),
      activeVal,
      start_date || null,
      end_date || null,
      frequency || "once",
      expiry_days !== undefined ? Number(expiry_days) : 7
    ).run();

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
    }, 201);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
