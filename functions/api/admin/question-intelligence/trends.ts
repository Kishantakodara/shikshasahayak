// ============================================================
// GET /api/admin/question-intelligence/trends
// Admin-only exam trends and topic frequencies endpoint
// ============================================================

import { getAuthenticatedUser, isAdmin } from '../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../lib/json';
import { analyzeSubjectExamTrends } from '../../../lib/questionIntelligence';

export async function onRequestGet(context: { request: Request; env: any }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(user.email, user.role) && user.role !== "admin") {
    return errorResponse('Forbidden: Admin access required', 403);
  }

    const url = new URL(context.request.url);
    const subjectCode = url.searchParams.get('subjectCode') || '3110014';

    const trends = await analyzeSubjectExamTrends(context.env, subjectCode);
    return jsonResponse({ success: true, subjectCode, trends });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch subject exam trends', 500);
  }
}
