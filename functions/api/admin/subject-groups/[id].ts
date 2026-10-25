import { jsonResponse, errorResponse } from "../../../lib/json";
import { requireAdmin } from "../../../lib/auth";

export async function onRequestPut(context: any) {
  const { request, env, params } = context;

  const { errorResponse: authError } = await requireAdmin(request, env);
  if (authError) {
    return authError;
  }

  const groupId = params.id as string;
  if (!groupId) return errorResponse("Missing group id", 400);

  try {
    const { name } = await request.json();
    if (!name || typeof name !== "string" || !name.trim()) {
      return errorResponse("Missing required field: name", 400);
    }

    const result = await env.DB.prepare(
      `UPDATE subject_groups SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(name.trim(), groupId).run();

    if (result.meta?.changes === 0) {
      return errorResponse("Subject group not found", 404);
    }

    return jsonResponse({ success: true });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function onRequestDelete(context: any) {
  const { request, env, params } = context;

  const { errorResponse: authError } = await requireAdmin(request, env);
  if (authError) {
    return authError;
  }

  const groupId = params.id as string;
  if (!groupId) return errorResponse("Missing group id", 400);

  try {
    // Unlink all subjects first (set subject_group_id = NULL)
    await env.DB.prepare(
      `UPDATE subjects SET subject_group_id = NULL, wef_year = NULL WHERE subject_group_id = ?`
    ).bind(groupId).run();

    await env.DB.prepare(
      `DELETE FROM subject_groups WHERE id = ?`
    ).bind(groupId).run();

    return jsonResponse({ success: true });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
