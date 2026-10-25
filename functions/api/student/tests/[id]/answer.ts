import { jsonResponse, errorResponse } from '../../../../lib/json';
import { getAuthenticatedUser } from '../../../../lib/auth';
import { submitQuestionAnswer } from '../../../../lib/questionIntelligence';

/**
 * POST /api/student/tests/:id/answer
 * Evaluates and logs a student's answer for a test session question.
 */
export async function onRequestPost(context: { env: any; request: Request; params: { id: string } }) {
  const { env, request, params } = context;
  const db = env.DB || env.ASSESSMENT_DB;

  if (!db) {
    return errorResponse('Database binding not found', 500);
  }

  const sessionId = params.id;
  if (!sessionId) {
    return errorResponse('Missing test session ID', 400);
  }

  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user) return errorResponse('Unauthorized - Student authentication required', 401);
    const body = (await request.json().catch(() => ({}))) as {
      questionId?: string;
      answer?: string | number | string[];
      timeTakenSeconds?: number;
    };

    const { questionId, answer, timeTakenSeconds } = body;
    if (!questionId || answer === undefined) {
      return errorResponse('Missing questionId or answer parameter', 400);
    }

    const studentId = user.uid;

    const result = await submitQuestionAnswer(
      { DB: db } as any,
      sessionId,
      studentId,
      questionId,
      Array.isArray(answer) ? JSON.stringify(answer) : String(answer),
      Number(timeTakenSeconds || 0)
    );

    return jsonResponse({
      success: true,
      evaluated: result,
    });
  } catch (err: any) {
    if (err.message?.includes('Unauthorized') || err.message?.includes('Cannot modify')) {
      return errorResponse(err.message, 403);
    }
    return errorResponse(err.message || 'Failed to submit question answer', 500);
  }
}
