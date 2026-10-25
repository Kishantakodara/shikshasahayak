// GET /api/admin/adaptive/demand-loop
import { getAuthenticatedUser, isAdmin } from '../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../lib/json';
import { getAdaptiveDemandLoopSummary } from '../../../lib/questionIntelligence';

export async function onRequestGet(context: { request: Request; env: any }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
    if (!isAdmin(user.email, user.role) && user.role !== "admin" && user.role !== "teacher") {
      return errorResponse('Forbidden: Admin access required', 403);
    }

    const demandLoop = await getAdaptiveDemandLoopSummary(context.env);
    return jsonResponse({ success: true, demandLoop });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch adaptive demand loop summary', 500);
  }
}
