import { jsonResponse, errorResponse } from "../../../lib/json";
import { requireAdmin } from "../../../lib/auth";

export async function onRequestPost(context: any) {
  const { request, env } = context;

  const { errorResponse: authError } = await requireAdmin(request, env);
  if (authError) {
    return authError;
  }
  try {
    const data = await request.json();
    const { id, name, slug, short_name, code } = data;
    
    if (!id || !name || !slug) {
      return errorResponse("Missing required fields: id, name, slug", 400);
    }

    const branchId = id.startsWith("branch_") ? id : `branch_${id}`;
    
    await env.DB.prepare(
      `INSERT INTO branches (id, university_id, name, slug, short_name, code)
       VALUES (?, 'gtu', ?, ?, ?, ?)`
    ).bind(branchId, name, slug, short_name || null, code || null).run();

    return jsonResponse({ success: true, id: branchId });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
