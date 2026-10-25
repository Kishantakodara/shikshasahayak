// POST /api/admin/questions/:id/reject
import { getAuthenticatedUser, isAdmin } from '../../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../../lib/json';
import { rejectQuestionInBank } from '../../../../lib/questionIntelligence';

export async function onRequestPost(context: { request: Request; env: any; params: { id?: string } }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
    if (!isAdmin(user.email, user.role) && user.role !== "admin" && user.role !== "teacher") {
      return errorResponse('Forbidden: Admin access required', 403);
    }

    const questionId = context.params.id;
    if (!questionId) return errorResponse('Missing question ID', 400);

    const body = await context.request.json().catch(() => ({})) as any;
    const reason = body.reason || 'Rejected by Admin';
    const result = await rejectQuestionInBank(context.env, user.uid, questionId, reason);
    return jsonResponse(result);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to reject question', 400);
  }
}
