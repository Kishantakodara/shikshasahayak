// POST /api/admin/questions/bulk
import { getAuthenticatedUser, isAdmin } from '../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../lib/json';
import { executeBulkOperation } from '../../../lib/questionIntelligence';

export async function onRequestPost(context: { request: Request; env: any }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
    if (!isAdmin(user.email, user.role) && user.role !== "admin" && user.role !== "teacher") {
      return errorResponse('Forbidden: Admin access required', 403);
    }

    const body = await context.request.json() as any;
    if (!body.action || !Array.isArray(body.questionIds) || body.questionIds.length === 0) {
      return errorResponse('Invalid parameters: action and questionIds required', 400);
    }

    const result = await executeBulkOperation(context.env, user.uid, body.action, body.questionIds, body.payload);
    return jsonResponse(result);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to execute bulk operation', 400);
  }
}
