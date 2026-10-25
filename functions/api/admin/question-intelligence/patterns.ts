// ============================================================
// GET /api/admin/question-intelligence/patterns
// Historical GTU Exam Pattern Intelligence & Trend Analytics
// ============================================================

import { getAuthenticatedUser, isAdmin } from '../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../lib/json';
import { analyzeSubjectExamTrends, generateExamPatternReport } from '../../../lib/questionIntelligence';

export async function onRequestGet(context: { request: Request; env: any }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
    if (!isAdmin(user.email, user.role) && user.role !== "admin" && user.role !== "reviewer") {
      return errorResponse('Forbidden: Admin or Reviewer access required', 403);
    }

    const url = new URL(context.request.url);
    const subjectCode = url.searchParams.get('subjectCode') || '3110014';

    const [trends, patternReport] = await Promise.all([
      analyzeSubjectExamTrends(context.env, subjectCode),
      generateExamPatternReport(context.env, subjectCode),
    ]);

    return jsonResponse({
      success: true,
      subjectCode,
      trends,
      patternReport,
      disclaimer: 'Exam patterns represent historical GTU decision support analysis and do not guarantee future examination content.',
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch exam pattern intelligence', 500);
  }
}
