// ============================================================
// GET /api/student/exam-readiness/:subjectCode
// Authenticated student exam readiness report
// ============================================================

import { getAuthenticatedUser } from '../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../lib/json';
import { calculateStudentExamReadiness } from '../../../lib/questionIntelligence';

export async function onRequestGet(context: {
  request: Request;
  env: any;
  params: { subjectCode: string };
}): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) {
      return errorResponse('Authentication required to view personalized exam readiness', 401);
    }

    const subjectCode = context.params.subjectCode;
    if (!subjectCode || !subjectCode.trim()) {
      return errorResponse('Subject code is required', 400);
    }

    const url = new URL(context.request.url);
    const semester = parseInt(url.searchParams.get('semester') || '1', 10);

    const readiness = await calculateStudentExamReadiness(
      context.env,
      user.uid,
      subjectCode,
      isNaN(semester) ? 1 : semester
    );

    return jsonResponse({ success: true, readiness });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch student exam readiness', 500);
  }
}
