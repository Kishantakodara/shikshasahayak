// GET /api/admin/questions/stats
import { getAuthenticatedUser, isAdmin } from '../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../lib/json';
import { getQuestionBankDashboardStats } from '../../../lib/questionIntelligence';

export async function onRequestGet(context: { request: Request; env: any }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
    if (!isAdmin(user.email, user.role) && user.role !== "admin" && user.role !== "teacher") {
      return errorResponse('Forbidden: Admin access required', 403);
    }

    const stats = await getQuestionBankDashboardStats(context.env);
    return jsonResponse({ success: true, stats });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch question bank stats', 500);
  }
}
