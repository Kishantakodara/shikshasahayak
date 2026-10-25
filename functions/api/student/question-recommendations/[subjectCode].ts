// ============================================================
// GET /api/student/question-recommendations/:subjectCode
// Authenticated student question recommendation endpoint
// ============================================================

import { getAuthenticatedUser } from '../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../lib/json';
import { getIntelligentQuestionRecommendations } from '../../../lib/questionIntelligence';

export async function onRequestGet(context: {
  request: Request;
  env: any;
  params: { subjectCode: string };
}): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) {
      return errorResponse('Authentication required to receive question recommendations', 401);
    }

    const subjectCode = context.params.subjectCode;
    if (!subjectCode || !subjectCode.trim()) {
      return errorResponse('Subject code is required', 400);
    }

    const url = new URL(context.request.url);
    const mode = (url.searchParams.get('mode') || 'EXAM_PRIORITY') as any;
    const targetTopic = url.searchParams.get('topic') || undefined;
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const semester = parseInt(url.searchParams.get('semester') || '1', 10);

    const recommendations = await getIntelligentQuestionRecommendations(
      context.env,
      user.uid,
      {
        subjectCode,
        mode,
        targetTopic,
        limit: isNaN(limit) ? 10 : limit,
        semester: isNaN(semester) ? 1 : semester,
      }
    );

    return jsonResponse({ success: true, recommendations });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch question recommendations', 500);
  }
}
