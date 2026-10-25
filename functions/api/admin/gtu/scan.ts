// POST /api/admin/gtu/scan
import { getAuthenticatedUser, isAdmin } from '../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../lib/json';
import { scanGtuAvailability } from '../../../lib/questionIntelligence';

export async function onRequestPost(context: { request: Request; env: any }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
    if (!isAdmin(user.email, user.role) && user.role !== "admin" && user.role !== "teacher") {
      return errorResponse('Forbidden: Admin access required', 403);
    }

    const options = await context.request.json().catch(() => ({})) as any;
    const summary = await scanGtuAvailability(context.env, { ...options, triggerMode: 'MANUAL' });
    return jsonResponse({ success: true, summary });
  } catch (err: any) {
    return errorResponse(err.message || 'GTU availability scan failed', 500);
  }
}
