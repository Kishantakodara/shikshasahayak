import { jsonResponse, errorResponse } from '../../../lib/json';
import { checkTestAvailability } from '../../../lib/questionIntelligence';
import type { TestGenerationConfig } from '../../../../src/types';

/**
 * POST /api/student/tests/check-availability
 * Checks estimated question availability for a proposed test selection before generation.
 */
export async function onRequestPost(context: { env: any; request: Request }) {
  const { env, request } = context;
  const db = env.DB || env.ASSESSMENT_DB;

  if (!db) {
    return errorResponse('Database binding not found', 500);
  }

  try {
    const config: TestGenerationConfig = await request.json();
    const result = await checkTestAvailability({ DB: db } as any, config);

    return jsonResponse({
      success: true,
      availability: result,
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to check test availability', 500);
  }
}
