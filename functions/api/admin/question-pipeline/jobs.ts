// GET /api/admin/question-pipeline/jobs
import { getAuthenticatedUser, isAdmin } from '../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../lib/json';
import { listPipelineJobs } from '../../../lib/questionIntelligence';

export async function onRequestGet(context: { request: Request; env: any }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
    if (!isAdmin(user.email, user.role) && user.role !== "admin" && user.role !== "teacher") {
      return errorResponse('Forbidden: Admin access required', 403);
    }

    const url = new URL(context.request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    const res = await listPipelineJobs(context.env, limit, offset);
    return jsonResponse({ success: true, ...res });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to list pipeline jobs', 500);
  }
}
