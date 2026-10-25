// POST /api/admin/gtu/retry
import { getAuthenticatedUser, isAdmin } from '../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../lib/json';
import { retryFailedJob } from '../../../lib/questionIntelligence';

export async function onRequestPost(context: { request: Request; env: any }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
    if (!isAdmin(user.email, user.role) && user.role !== "admin" && user.role !== "teacher") {
      return errorResponse('Forbidden: Admin access required', 403);
    }

    const body = await context.request.json() as any;
    if (!body.paperId) return errorResponse('Missing paperId parameter', 400);

    const res = await retryFailedJob(context.env, body.paperId);
    return jsonResponse(res);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to retry GTU job', 500);
  }
}
