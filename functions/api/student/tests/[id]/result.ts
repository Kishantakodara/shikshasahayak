import { jsonResponse, errorResponse } from '../../../../lib/json';
import { getAuthenticatedUser } from '../../../../lib/auth';
import { getTestResult } from '../../../../lib/questionIntelligence';

/**
 * GET /api/student/tests/:id/result
 * Fetches full post-test review and performance analytics.
 */
export async function onRequestGet(context: { env: any; request: Request; params: { id: string } }) {
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
    const isPrivileged = user && (user.role === 'admin' || user.role === 'teacher');
    const requestedStudentId = new URL(request.url).searchParams.get('studentId');
    const studentId = (isPrivileged && requestedStudentId) ? requestedStudentId : user.uid;

    const result = await getTestResult({ DB: db } as any, sessionId, studentId);

    return jsonResponse({
      success: true,
      result,
    });
  } catch (err: any) {
    if (err.message?.includes('Unauthorized')) {
      return errorResponse(err.message, 403);
    }
    if (err.message?.includes('not found')) {
      return errorResponse(err.message, 404);
    }
    return errorResponse(err.message || 'Failed to fetch test result', 500);
  }
}
