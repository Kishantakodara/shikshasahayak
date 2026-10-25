// GET /api/admin/question-pipeline/:id/errors
import { getAuthenticatedUser, isAdmin } from '../../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../../lib/json';
import { getPipelineJobErrors } from '../../../../lib/questionIntelligence';

export async function onRequestGet(context: { request: Request; env: any; params: any }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
    if (!isAdmin(user.email, user.role) && user.role !== "admin" && user.role !== "teacher") {
      return errorResponse('Forbidden: Admin access required', 403);
    }

    const id = context.params.id;
    const errors = await getPipelineJobErrors(context.env, id);
    return jsonResponse({ success: true, errors });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch pipeline job errors', 500);
  }
}
