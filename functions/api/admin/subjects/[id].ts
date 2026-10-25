import { jsonResponse, errorResponse } from "../../../lib/json";
import { requireAdmin } from "../../../lib/auth";

export async function onRequestDelete(context: any) {
  const { request, env, params } = context;

  const { errorResponse: authError } = await requireAdmin(request, env);
  if (authError) {
    return authError;
  }

  const subjectId = params.id as string;
  if (!subjectId) {
    return errorResponse("Missing subject id", 400);
  }

  try {
    await env.DB.prepare("DELETE FROM subjects WHERE id = ?").bind(subjectId).run();
    return jsonResponse({ success: true });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
