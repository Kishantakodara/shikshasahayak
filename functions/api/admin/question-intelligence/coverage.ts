// ============================================================
// GET /api/admin/question-intelligence/coverage
// Admin-only comprehensive question bank coverage endpoint
// ============================================================

import { getAuthenticatedUser, isAdmin } from '../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../lib/json';
import { calculateQuestionBankCoverage } from '../../../lib/questionIntelligence';

export async function onRequestGet(context: { request: Request; env: any }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(user.email, user.role) && user.role !== "admin") {
    return errorResponse('Forbidden: Admin access required', 403);
  }

    const coverage = await calculateQuestionBankCoverage(context.env);
    return jsonResponse({ success: true, coverage });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch question bank coverage', 500);
  }
}
