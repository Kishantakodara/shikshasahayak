// GET /api/admin/question-pipeline/:id
import { getAuthenticatedUser, isAdmin } from '../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../lib/json';
import { getPipelineJobDetail } from '../../../lib/questionIntelligence';

export async function onRequestGet(context: { request: Request; env: any; params: any }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
    if (!isAdmin(user.email, user.role) && user.role !== "admin" && user.role !== "teacher") {
      return errorResponse('Forbidden: Admin access required', 403);
    }

    const id = context.params.id;
    const job = await getPipelineJobDetail(context.env, id);
    if (!job) return errorResponse('Pipeline job not found', 404);

    return jsonResponse({ success: true, job });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch pipeline job detail', 500);
  }
}
