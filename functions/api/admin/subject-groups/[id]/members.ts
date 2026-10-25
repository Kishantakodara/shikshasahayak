import { jsonResponse, errorResponse } from "../../../../lib/json";
import { requireAdmin } from "../../../../lib/auth";

/**
 * POST  /api/admin/subject-groups/:id/members
 *   body: { subject_id: string, wef_year?: number }
 *   Assigns a subject to this group (and optionally records its WEF year).
 *   If the subject is already in a different group, it is moved here.
 *
 * DELETE /api/admin/subject-groups/:id/members
 *   body: { subject_id: string }
 *   Removes a subject from this group (sets subject_group_id = NULL).
 */

export async function onRequestPost(context: any) {
  const { request, env, params } = context;

  const { errorResponse: authError } = await requireAdmin(request, env);
  if (authError) {
    return authError;
  }

  const groupId = params.id as string;
  if (!groupId) return errorResponse("Missing group id", 400);

  try {
    const { subject_id, wef_year } = await request.json();
    if (!subject_id) {
      return errorResponse("Missing required field: subject_id", 400);
    }

    // Verify group exists
    const group = await env.DB.prepare(
      `SELECT id FROM subject_groups WHERE id = ?`
    ).bind(groupId).first();
    if (!group) return errorResponse("Subject group not found", 404);

    // Verify subject exists
    const subject = await env.DB.prepare(
      `SELECT id FROM subjects WHERE id = ?`
    ).bind(subject_id).first();
    if (!subject) return errorResponse("Subject not found", 404);

    // Assign / move the subject to this group
    await env.DB.prepare(
      `UPDATE subjects
       SET subject_group_id = ?,
           wef_year = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).bind(groupId, wef_year ?? null, subject_id).run();

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
    const { subject_id } = await request.json();
    if (!subject_id) {
      return errorResponse("Missing required field: subject_id", 400);
    }

    await env.DB.prepare(
      `UPDATE subjects
       SET subject_group_id = NULL,
           wef_year = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND subject_group_id = ?`
    ).bind(subject_id, groupId).run();

    return jsonResponse({ success: true });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
