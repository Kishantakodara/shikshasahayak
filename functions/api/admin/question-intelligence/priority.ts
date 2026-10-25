// ============================================================
// GET /api/admin/question-intelligence/priority
// Admin-only moderation prioritization queue metrics endpoint
// ============================================================

import { getAuthenticatedUser, isAdmin } from '../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../lib/json';
import { calculateModerationPriority } from '../../../lib/questionIntelligence';

export async function onRequestGet(context: { request: Request; env: WorkerBindings }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(user.email, user.role) && user.role !== "admin") {
    return errorResponse('Forbidden: Admin access required', 403);
  }

    const url = new URL(context.request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);

    const rows = await context.env.DB.prepare(
      `SELECT id, question_text, question_type, subject_code, subject_name, options_json, explanation, is_original_pyq, is_ai_generated
       FROM master_question_bank
       WHERE verification_status = 'unverified'
       LIMIT ?`
    )
      .bind(isNaN(limit) ? 50 : limit)
      .all<Record<string, unknown>>();

    const prioritized = (rows.results || []).map(r => {
      const prio = calculateModerationPriority({
        id: String(r.id),
        questionText: String(r.question_text || ''),
        questionType: String(r.question_type || 'MCQ') as any,
        subjectCode: String(r.subject_code || ''),
        subjectName: String(r.subject_name || ''),
        isOriginalPyq: Number(r.is_original_pyq) === 1,
        isAiGenerated: Number(r.is_ai_generated) === 1,
        explanation: r.explanation ? String(r.explanation) : undefined,
      });
      return {
        questionId: r.id,
        questionText: r.question_text,
        subjectCode: r.subject_code,
        priority: prio,
      };
    }).sort((a, b) => b.priority.priorityScore - a.priority.priorityScore);

    return jsonResponse({ success: true, count: prioritized.length, items: prioritized });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to calculate moderation priority queue', 500);
  }
}
