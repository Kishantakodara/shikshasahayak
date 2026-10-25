// ============================================================
// GET /api/admin/question-intelligence/audit
// Immutable Question Audit Trail Log Events
// ============================================================

import { getAuthenticatedUser, isAdmin } from '../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../lib/json';

export async function onRequestGet(context: { request: Request; env: WorkerBindings }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
    if (!isAdmin(user.email, user.role) && user.role !== "admin" && user.role !== "reviewer") {
      return errorResponse('Forbidden: Admin or Reviewer access required', 403);
    }

    const url = new URL(context.request.url);
    const questionId = url.searchParams.get('questionId') || undefined;
    const action = url.searchParams.get('action') || undefined;
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '25', 10)));

    let sql = `
      SELECT id, question_id, actor_id, actor_role, action, reason, details_json, created_at
      FROM question_audit_logs
      WHERE 1=1
    `;
    const params: any[] = [];

    if (questionId) {
      sql += ` AND question_id = ?`;
      params.push(questionId.trim());
    }

    if (action) {
      sql += ` AND action = ?`;
      params.push(action.trim());
    }

    sql += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);

    const rows = await context.env.DB.prepare(sql).bind(...params).all<Record<string, unknown>>();

    const events = (rows.results || []).map(r => {
      let details: any = null;
      if (r.details_json) {
        try {
          details = JSON.parse(String(r.details_json));
        } catch {
          details = null;
        }
      }
      return {
        id: r.id,
        questionId: r.question_id,
        actorId: r.actor_id,
        actorRole: r.actor_role,
        action: r.action,
        reason: r.reason,
        details,
        createdAt: r.created_at,
      };
    });

    return jsonResponse({
      success: true,
      count: events.length,
      events,
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch question audit log', 500);
  }
}
