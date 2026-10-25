import { jsonResponse, errorResponse } from '../../../lib/json';
import { getAuthenticatedUser } from '../../../lib/auth';
import { generateTestSession } from '../../../lib/questionIntelligence';
import type { TestGenerationConfig } from '../../../../src/types';

/**
 * POST /api/student/tests/generate
 * Generates a dynamic test/quiz session from verified questions.
 */
export async function onRequestPost(context: { env: any; request: Request }) {
  const { env, request } = context;
  const db = env.DB || env.ASSESSMENT_DB;

  if (!db) {
    return errorResponse('Database binding not found', 500);
  }

  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user) return errorResponse('Unauthorized - Student authentication required', 401);
    const body: TestGenerationConfig = await request.json();

    const config: TestGenerationConfig = {
      ...body,
      studentId: user.uid,
    };

    if (!config.testType || !config.questionCount || !config.durationMinutes) {
      return errorResponse('Missing required parameters: testType, questionCount, durationMinutes', 400);
    }

    const sessionOrError = await generateTestSession({ DB: db } as any, config);

    if ('success' in sessionOrError && sessionOrError.success === false) {
      return jsonResponse(sessionOrError, 400);
    }

    return jsonResponse({
      success: true,
      session: sessionOrError,
      testSession: sessionOrError,
    }, 201);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to generate test session', 500);
  }
}
