// ============================================================
// GET /api/student/preparation-plan/:subjectCode
// Authenticated personalized preparation plan endpoint
// ============================================================

import { getAuthenticatedUser } from '../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../lib/json';
import { generatePersonalizedPreparationPlan } from '../../../lib/questionIntelligence';

export async function onRequestGet(context: {
  request: Request;
  env: any;
  params: { subjectCode: string };
}): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) {
      return errorResponse('Authentication required to view personalized study plan', 401);
    }

    const subjectCode = context.params.subjectCode;
    if (!subjectCode || !subjectCode.trim()) {
      return errorResponse('Subject code is required', 400);
    }

    const url = new URL(context.request.url);
    const semester = parseInt(url.searchParams.get('semester') || '1', 10);
    const session = url.searchParams.get('session') || 'W2024';

    const plan = await generatePersonalizedPreparationPlan(
      context.env,
      user.uid,
      subjectCode,
      isNaN(semester) ? 1 : semester,
      session
    );

    return jsonResponse({ success: true, plan });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to generate preparation plan', 500);
  }
}
