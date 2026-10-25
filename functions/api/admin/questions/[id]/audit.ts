// GET /api/admin/questions/:id/audit
import { getAuthenticatedUser, isAdmin } from '../../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../../lib/json';
import { getQuestionAuditLogs } from '../../../../lib/questionIntelligence';

export async function onRequestGet(context: { request: Request; env: any; params: { id?: string } }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
    if (!isAdmin(user.email, user.role) && user.role !== "admin" && user.role !== "teacher") {
      return errorResponse('Forbidden: Admin access required', 403);
    }

    const questionId = context.params.id;
    if (!questionId) return errorResponse('Missing question ID', 400);

    const logs = await getQuestionAuditLogs(context.env, questionId);
    return jsonResponse({ success: true, logs });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch audit logs', 500);
  }
}
