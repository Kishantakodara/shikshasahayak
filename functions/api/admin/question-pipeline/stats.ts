// GET /api/admin/question-pipeline/stats
import { getAuthenticatedUser, isAdmin } from '../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../lib/json';
import { getPipelineOverallMetrics } from '../../../lib/questionIntelligence';

export async function onRequestGet(context: { request: Request; env: any }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
    if (!isAdmin(user.email, user.role) && user.role !== "admin" && user.role !== "teacher") {
      return errorResponse('Forbidden: Admin access required', 403);
    }

    const metrics = await getPipelineOverallMetrics(context.env);
    return jsonResponse({ success: true, metrics });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch pipeline overall metrics', 500);
  }
}
