// POST /api/admin/questions/:id/duplicate
import { getAuthenticatedUser, isAdmin } from '../../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../../lib/json';
import { markDuplicateQuestion } from '../../../../lib/questionIntelligence';

export async function onRequestPost(context: { request: Request; env: any; params: { id?: string } }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
    if (!isAdmin(user.email, user.role) && user.role !== "admin" && user.role !== "teacher") {
      return errorResponse('Forbidden: Admin access required', 403);
    }

    const questionId = context.params.id;
    if (!questionId) return errorResponse('Missing question ID', 400);

    const body = await context.request.json() as any;
    if (!body.targetQuestionId) {
      return errorResponse('Missing targetQuestionId parameter', 400);
    }

    const result = await markDuplicateQuestion(context.env, user.uid, questionId, body.targetQuestionId, body.reason);
    return jsonResponse(result);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to mark duplicate question', 400);
  }
}
