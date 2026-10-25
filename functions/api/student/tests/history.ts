import { jsonResponse, errorResponse } from '../../../lib/json';
import { getAuthenticatedUser } from '../../../lib/auth';
import { getStudentTestHistory } from '../../../lib/questionIntelligence';

/**
 * GET /api/student/tests/history
 * Retrieves test session history for the authenticated student.
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
    const isPrivileged = user && (user.role === 'admin' || user.role === 'teacher');
    const requestedStudentId = url.searchParams.get('studentId');
    const studentId = (isPrivileged && requestedStudentId) ? requestedStudentId : user.uid;
    const sourceMode = url.searchParams.get('sourceMode') || undefined;
    const testType = url.searchParams.get('testType') || undefined;
    const limit = url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : 20;

    const history = await getStudentTestHistory({ DB: db } as any, studentId, {
      sourceMode,
      testType,
      limit,
    });

    return jsonResponse({
      success: true,
      history,
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch test history', 500);
  }
}
