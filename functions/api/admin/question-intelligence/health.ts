// ============================================================
// GET /api/admin/question-intelligence/health
// Admin-only question bank health snapshot endpoint
// ============================================================

import { getAuthenticatedUser, isAdmin } from '../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../lib/json';
import { calculateQuestionBankHealth } from '../../../lib/questionIntelligence';

export async function onRequestGet(context: { request: Request; env: any }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(user.email, user.role) && user.role !== "admin") {
    return errorResponse('Forbidden: Admin access required', 403);
  }

    const health = await calculateQuestionBankHealth(context.env);
    return jsonResponse({ success: true, health });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to calculate question bank health', 500);
  }
}
