import { jsonResponse, errorResponse } from '../../../lib/json';
import { getAuthenticatedUser } from '../../../lib/auth';
import { getStudentWeakTopics } from '../../../lib/questionIntelligence';

/**
 * GET /api/student/tests/weak-topics
 * Returns student weak topics (< 60% accuracy) with targeted test generation configs.
 */
export async function onRequestGet(context: { env: any; request: Request }) {
  const { env, request } = context;
  const db = env.DB || env.ASSESSMENT_DB;

  if (!db) {
    return errorResponse('Database binding not found', 500);
  }

  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user) return errorResponse('Unauthorized - Student authentication required', 401);
    const url = new URL(request.url);
    const studentId = user.uid;
    const branchId = url.searchParams.get('branchId') || undefined;

    const weakTopics = await getStudentWeakTopics({ DB: db } as any, studentId, branchId);

    return jsonResponse({
      success: true,
      weakTopics,
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch weak topics', 500);
  }
}
