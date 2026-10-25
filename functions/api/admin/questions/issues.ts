// GET /api/admin/questions/issues
import { getAuthenticatedUser, isAdmin } from '../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../lib/json';
import { listQuestionReports } from '../../../lib/questionIntelligence';

export async function onRequestGet(context: { request: Request; env: any }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
    if (!isAdmin(user.email, user.role) && user.role !== "admin" && user.role !== "teacher") {
      return errorResponse('Forbidden: Admin access required', 403);
    }

    const url = new URL(context.request.url);
    const status = url.searchParams.get('status') || undefined;
    const res = await listQuestionReports(context.env, { status });

    return jsonResponse(res);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch question issues', 500);
  }
}
