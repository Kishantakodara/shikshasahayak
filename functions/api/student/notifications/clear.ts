import { jsonResponse, errorResponse } from "../../../lib/json";
import { getAuthenticatedUser } from "../../../lib/auth";

export async function onRequestPost(context: {
  env: { PADHAKU_CORE_DB?: any; DB?: any; ASSESSMENT_DB?: any };
  request: Request;
}) {
  const { env, request } = context;

  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user) return errorResponse("Unauthorized", 401);

    const db = env.PADHAKU_CORE_DB || env.DB || env.ASSESSMENT_DB;
    if (!db) return errorResponse("Database binding error", 500);

    await db.prepare(
      `DELETE FROM notifications 
       WHERE user_id = ?`
    )
      .bind(user.uid)
      .run();

    return jsonResponse({ success: true, message: "All notifications cleared" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(msg, 500);
  }
}

export async function onRequestDelete(context: {
  env: { PADHAKU_CORE_DB?: any; DB?: any; ASSESSMENT_DB?: any };
  request: Request;
}) {
  return onRequestPost(context);
}
