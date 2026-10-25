// POST /api/student/adaptive/start-session
import { getAuthenticatedUser } from '../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../lib/json';
import { startAdaptivePracticeSession } from '../../../lib/questionIntelligence';

export async function onRequestPost(context: { request: Request; env: any }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse('Unauthorized access', 401);

    const body = await context.request.json().catch(() => ({})) as any;

    const session = await startAdaptivePracticeSession(context.env, {
      studentId: user.uid,
      mode: body.mode || 'BALANCED_PRACTICE',
      subjectCode: body.subjectCode,
      topicName: body.topicName,
      questionCount: body.questionCount || 10,
    });

    return jsonResponse({ success: true, session });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to start adaptive practice session', 500);
  }
}
