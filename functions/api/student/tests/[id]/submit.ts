import { jsonResponse, errorResponse } from '../../../../lib/json';
import { getAuthenticatedUser } from '../../../../lib/auth';
import { submitTestSession } from '../../../../lib/questionIntelligence';

/**
 * POST /api/student/tests/:id/submit
 * Finalizes test submission and calculates final score server-side.
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
    const studentId = user.uid;

    const result = await submitTestSession({ DB: db } as any, sessionId, studentId);

    return jsonResponse({
      success: true,
      result,
    });
  } catch (err: any) {
    if (err.message?.includes('Unauthorized')) {
      return errorResponse(err.message, 403);
    }
    return errorResponse(err.message || 'Failed to submit test session', 500);
  }
}
