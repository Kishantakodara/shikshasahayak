// POST /api/admin/question-pipeline/preview
import { getAuthenticatedUser, isAdmin } from '../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../lib/json';
import { previewPipelineJob } from '../../../lib/questionIntelligence';

export async function onRequestPost(context: { request: Request; env: any }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
    if (!isAdmin(user.email, user.role) && user.role !== "admin" && user.role !== "teacher") {
      return errorResponse('Forbidden: Admin access required', 403);
    }

    const options = await context.request.json().catch(() => ({})) as any;
    const preview = await previewPipelineJob(context.env, options);
    return jsonResponse({ success: true, preview });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to preview pipeline job', 500);
  }
}
