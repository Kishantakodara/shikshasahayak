import { jsonResponse, errorResponse } from "../../../../lib/json";
import { getAuthenticatedUser } from "../../../../lib/auth";

export async function onRequestPut(context: {
  env: { PADHAKU_CORE_DB?: any; DB?: any; ASSESSMENT_DB?: any };
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const notificationId = params.id;

  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user) return errorResponse("Unauthorized", 401);

    const db = env.PADHAKU_CORE_DB || env.DB || env.ASSESSMENT_DB;
    if (!db) return errorResponse("Database binding error", 500);

    await db.prepare(
      `UPDATE notifications 
       SET is_read = 1, read_at = CURRENT_TIMESTAMP 
       WHERE id = ? AND (user_id = ? OR user_id = 'all' OR user_id = 'broadcast')`
    )
      .bind(notificationId, user.uid)
      .run();

    return jsonResponse({ success: true, id: notificationId });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(msg, 500);
  }
}
