// POST /api/admin/question-pipeline/start
import { getAuthenticatedUser, isAdmin } from '../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../lib/json';
import { startPipelineJob } from '../../../lib/questionIntelligence';

export async function onRequestPost(context: { request: Request; env: any }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
    if (!isAdmin(user.email, user.role) && user.role !== "admin" && user.role !== "teacher") {
      return errorResponse('Forbidden: Admin access required', 403);
    }

    const options = await context.request.json().catch(() => ({})) as any;
    const job = await startPipelineJob(context.env, { ...options, createdBy: user.uid || 'admin' });
    return jsonResponse({ success: true, job });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to start pipeline job', 500);
  }
}
