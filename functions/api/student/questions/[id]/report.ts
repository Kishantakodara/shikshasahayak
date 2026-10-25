// POST /api/student/questions/:id/report
import { getAuthenticatedUser } from '../../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../../lib/json';
import { submitStudentReport } from '../../../../lib/questionIntelligence';

export async function onRequestPost(context: { request: Request; env: any; params: any }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse('Unauthorized access', 401);

    const questionId = context.params.id;
    const body = await context.request.json() as any;

    if (!body.reportType) return errorResponse('Missing reportType', 400);

    const res = await submitStudentReport(context.env, {
      questionId,
      studentId: user.uid,
      reportType: body.reportType,
      message: body.message,
    });

    if (res.isDuplicate) {
      return jsonResponse({ success: false, error: 'You have already submitted a report for this issue.' }, 409);
    }

    return jsonResponse({ success: true, reportId: res.reportId });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to submit question report', 500);
  }
}
