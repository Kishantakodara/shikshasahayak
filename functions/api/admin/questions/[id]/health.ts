// GET /api/admin/questions/:id/health
import { getAuthenticatedUser, isAdmin } from '../../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../../lib/json';
import { evaluateQuestionQuality } from '../../../../lib/questionIntelligence';

export async function onRequestGet(context: { request: Request; env: any; params: any }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
    if (!isAdmin(user.email, user.role) && user.role !== "admin" && user.role !== "teacher") {
      return errorResponse('Forbidden: Admin access required', 403);
    }

    const questionId = context.params.id;
    const evalRes = await evaluateQuestionQuality(context.env, questionId);
    return jsonResponse({ success: true, health: evalRes });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch question health evaluation', 500);
  }
}
