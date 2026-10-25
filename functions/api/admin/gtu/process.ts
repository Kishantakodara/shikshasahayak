// POST /api/admin/gtu/process
import { getAuthenticatedUser, isAdmin } from '../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../lib/json';
import { processDiscoveredPapers } from '../../../lib/questionIntelligence';

export async function onRequestPost(context: { request: Request; env: any }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
    if (!isAdmin(user.email, user.role) && user.role !== "admin" && user.role !== "teacher") {
      return errorResponse('Forbidden: Admin access required', 403);
    }

    const body = await context.request.json().catch(() => ({})) as any;
    const batchSize = body.batchSize || 5;
    const res = await processDiscoveredPapers(context.env, batchSize);
    return jsonResponse({ success: true, ...res });
  } catch (err: any) {
    return errorResponse(err.message || 'GTU paper processing failed', 500);
  }
}
