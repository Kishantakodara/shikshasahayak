import { jsonResponse, errorResponse } from "../../../lib/json";
import { getAuthenticatedUser } from "../../../lib/auth";

export async function onRequestGet(context: {
  env: { PADHAKU_CORE_DB?: any; DB?: any; ASSESSMENT_DB?: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
}) {
  const { env, request } = context;
  const url = new URL(request.url);

  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const db = env.PADHAKU_CORE_DB || env.DB || env.ASSESSMENT_DB;
    if (!db) {
      return errorResponse("Database binding error", 500);
    }

    // Fetch student notifications
    let queryResult = await db.prepare(
      `SELECT id, user_id, type, channel, title, message, link, metadata, is_read, read_at, created_at
       FROM notifications
       WHERE user_id = ? OR user_id = 'all' OR user_id = 'broadcast'
       ORDER BY created_at DESC
       LIMIT 30`
    )
      .bind(user.uid)
      .all();

    let rows = queryResult.results || [];

    // An empty inbox is a valid state. Notifications are created by real events.

    // Format results
    const notifications = rows.map((r: any) => ({
      id: r.id,
      title: r.title,
      desc: r.message,
      message: r.message,
      type: r.type,
      channel: r.channel,
      link: r.link,
      unread: r.is_read === 0,
      is_read: r.is_read,
      time: formatRelativeTime(r.created_at),
      created_at: r.created_at
    }));

    return jsonResponse({
      success: true,
      notifications,
      unread_count: notifications.filter((n: any) => n.unread).length
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(msg, 500);
  }
}

export async function onRequestPost(context: {
  env: { PADHAKU_CORE_DB?: any; DB?: any; ASSESSMENT_DB?: any };
  request: Request;
}) {
  const { env, request } = context;

  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user) return errorResponse("Unauthorized", 401);

    const body: any = await request.json();
    const { title, message, type = 'general', channel = 'in_app', link = null } = body;

    if (!title || !message) {
      return errorResponse("Missing required fields: title, message", 400);
    }

    const db = env.PADHAKU_CORE_DB || env.DB || env.ASSESSMENT_DB;
    if (!db) return errorResponse("Database binding error", 500);

    const id = `notif-${crypto.randomUUID()}`;
    await db.prepare(
      `INSERT INTO notifications (id, user_id, type, channel, title, message, link, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)`
    )
      .bind(id, user.uid, type, channel, title, message, link)
      .run();

    return jsonResponse({ success: true, id });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(msg, 500);
  }
}

function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (isNaN(diffMs) || diffMs < 0) return 'Just now';

    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  } catch {
    return 'Recently';
  }
}
