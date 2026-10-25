import { jsonResponse } from "../lib/json";

export async function onRequestGet(context: any) {
  const { env } = context;

  try {
    const { results } = await env.DB.prepare(
      `SELECT id, title, type, html_content, frequency, expiry_days, start_date, end_date 
       FROM website_popups 
       WHERE is_active = 1 
       ORDER BY created_at DESC`
    ).all();

    const now = new Date().toISOString();

    const validPopups = (results || []).filter((popup: any) => {
      if (popup.start_date && popup.start_date > now) return false;
      if (popup.end_date && popup.end_date < now) return false;
      return true;
    });

    if (validPopups.length === 0) {
      return jsonResponse(null);
    }

    const popup = validPopups[0];
    return jsonResponse({
      id: popup.id,
      title: popup.title,
      type: popup.type,
      html_content: popup.html_content,
      frequency: popup.frequency,
      expiry_days: popup.expiry_days,
    });
  } catch (error: any) {
    return jsonResponse({ error: error.message }, 500);
  }
}
