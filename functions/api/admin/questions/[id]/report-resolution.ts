// POST /api/admin/questions/:id/report-resolution
import { getAuthenticatedUser, isAdmin } from '../../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../../lib/json';
import { resolveQuestionReport } from '../../../../lib/questionIntelligence';

export async function onRequestPost(context: { request: Request; env: any; params: any }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
    if (!isAdmin(user.email, user.role) && user.role !== "admin" && user.role !== "teacher") {
      return errorResponse('Forbidden: Admin access required', 403);
    }

    const body = await context.request.json() as any;
    if (!body.reportId || !body.resolution) {
      return errorResponse('Missing reportId or resolution parameter', 400);
    }

    const res = await resolveQuestionReport(
      context.env,
      body.reportId,
      user.uid || 'admin',
      body.resolution,
      body.note
    );

    return jsonResponse(res);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to resolve report', 500);
  }
}
