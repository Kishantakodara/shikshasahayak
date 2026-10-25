// POST /api/admin/questions/:id/retire
import { getAuthenticatedUser, isAdmin } from '../../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../../lib/json';
import { retireQuestion } from '../../../../lib/questionIntelligence';

export async function onRequestPost(context: { request: Request; env: any; params: any }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
    if (!isAdmin(user.email, user.role) && user.role !== "admin" && user.role !== "teacher") {
      return errorResponse('Forbidden: Admin access required', 403);
    }

    const questionId = context.params.id;
    const body = await context.request.json().catch(() => ({})) as any;
    const reason = body.reason || 'Retired by admin';

    const res = await retireQuestion(context.env, questionId, user.uid || 'admin', reason);
    return jsonResponse(res);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to retire question', 500);
  }
}
