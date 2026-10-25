// GET /api/admin/gtu/stats
import { getAuthenticatedUser, isAdmin } from '../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../lib/json';

export async function onRequestGet(context: { request: Request; env: any }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
    if (!isAdmin(user.email, user.role) && user.role !== "admin" && user.role !== "teacher") {
      return errorResponse('Forbidden: Admin access required', 403);
    }

    const counts = await context.env.DB.prepare(
      `SELECT pipeline_status, COUNT(*) as count FROM gtu_paper_ingestion_tracker GROUP BY pipeline_status`
    ).all();

    const runs = await context.env.DB.prepare(
      `SELECT * FROM gtu_discovery_runs ORDER BY started_at DESC LIMIT 10`
    ).all();

    return jsonResponse({ success: true, statusCounts: counts.results, recentRuns: runs.results });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch GTU discovery stats', 500);
  }
}
