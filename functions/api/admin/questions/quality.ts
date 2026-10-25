// GET /api/admin/questions/quality
import { getAuthenticatedUser, isAdmin } from '../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../lib/json';

export async function onRequestGet(context: { request: Request; env: WorkerBindings }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
    if (!isAdmin(user.email, user.role) && user.role !== "admin" && user.role !== "teacher") {
      return errorResponse('Forbidden: Admin access required', 403);
    }

    const { results } = await context.env.DB.prepare(
      `SELECT qqm.*, q.question_text, q.subject_code, q.subject_name, q.question_type, q.difficulty, q.source_type
       FROM question_quality_metrics qqm
       JOIN master_question_bank q ON qqm.question_id = q.id
       ORDER BY qqm.review_priority_score DESC LIMIT 50`
    ).all<Record<string, unknown>>();

    return jsonResponse({ success: true, qualityRecords: results || [] });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch question quality list', 500);
  }
}
