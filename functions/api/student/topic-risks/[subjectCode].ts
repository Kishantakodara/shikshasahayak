// ============================================================
// GET /api/student/topic-risks/:subjectCode
// Authenticated student topic risk profile analysis
// ============================================================

import { getAuthenticatedUser } from '../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../lib/json';
import { calculateStudentTopicRisks } from '../../../lib/questionIntelligence';

export async function onRequestGet(context: {
  request: Request;
  env: any;
  params: { subjectCode: string };
}): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) {
      return errorResponse('Authentication required to view student topic risks', 401);
    }

    const subjectCode = context.params.subjectCode;
    if (!subjectCode || !subjectCode.trim()) {
      return errorResponse('Subject code is required', 400);
    }

    const topicRisks = await calculateStudentTopicRisks(context.env, user.uid, subjectCode);

    return jsonResponse({ success: true, topicRisks });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch student topic risks', 500);
  }
}
