import { jsonResponse, errorResponse } from "../../../lib/json";
import { requireAdmin } from "../../../lib/auth";

export async function onRequestDelete(context: any) {
  const { request, env, params } = context;

  const { errorResponse: authError } = await requireAdmin(request, env);
  if (authError) {
    return authError;
  }
  const id = params.id as string;
  if (!id) {
    return errorResponse("Missing branch id", 400);
  }
  try {
    await env.DB.prepare(`DELETE FROM branches WHERE id = ?`).bind(id).run();
    return jsonResponse({ success: true });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
