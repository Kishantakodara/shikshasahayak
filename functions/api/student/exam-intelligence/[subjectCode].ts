// ============================================================
// GET /api/student/exam-intelligence/:subjectCode
// Authenticated student exam intelligence dashboard endpoint
// ============================================================

import { getAuthenticatedUser } from '../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../lib/json';
import { getStudentExamDashboardData, getSubjectExamIntelligenceOverview } from '../../../lib/questionIntelligence';

export async function onRequestGet(context: {
  request: Request;
  env: any;
  params: { subjectCode: string };
}): Promise<Response> {
  try {
    const subjectCode = context.params.subjectCode;
    if (!subjectCode || !subjectCode.trim()) {
      return errorResponse('Subject code is required', 400);
    }

    const user = await getAuthenticatedUser(context.request, context.env);

    // If authenticated student, return personalized dashboard
    if (user) {
      const dashboard = await getStudentExamDashboardData(
        context.env,
        user.uid,
        subjectCode
      );
      return jsonResponse({ success: true, dashboard });
    }

    // Otherwise, return public subject-wide intelligence overview
    const overview = await getSubjectExamIntelligenceOverview(context.env, subjectCode);
    return jsonResponse({ success: true, overview });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch exam intelligence', 500);
  }
}
