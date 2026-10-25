// GET & PUT /api/admin/questions/:id
import { getAuthenticatedUser, isAdmin } from '../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../lib/json';
import { getQuestionDetailForReview, reviewAndUpdateQuestion } from '../../../lib/questionIntelligence';

export async function onRequestGet(context: { request: Request; env: any; params: { id?: string } }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
    if (!isAdmin(user.email, user.role) && user.role !== "admin" && user.role !== "teacher") {
      return errorResponse('Forbidden: Admin access required', 403);
    }

    const questionId = context.params.id;
    if (!questionId) return errorResponse('Missing question ID', 400);

    const question = await getQuestionDetailForReview(context.env, questionId);
    return jsonResponse({ success: true, question });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch question detail', 500);
  }
}

export async function onRequestPut(context: { request: Request; env: any; params: { id?: string } }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
    if (!isAdmin(user.email, user.role) && user.role !== "admin" && user.role !== "teacher") {
      return errorResponse('Forbidden: Admin access required', 403);
    }

    const questionId = context.params.id;
    if (!questionId) return errorResponse('Missing question ID', 400);

    const payload = await context.request.json() as any;
    const updated = await reviewAndUpdateQuestion(context.env, user.uid, questionId, payload);
    return jsonResponse({ success: true, question: updated });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update question', 400);
  }
}
