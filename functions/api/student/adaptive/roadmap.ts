// GET /api/student/adaptive/roadmap
import { getAuthenticatedUser } from '../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../lib/json';
import { getStudentSubjectRoadmap } from '../../../lib/questionIntelligence';

export async function onRequestGet(context: { request: Request; env: any }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse('Unauthorized access', 401);

    const url = new URL(context.request.url);
    const subjectCode = url.searchParams.get('subjectCode') || '3110014';

    const roadmap = await getStudentSubjectRoadmap(context.env, user.uid, subjectCode);
    return jsonResponse({ success: true, roadmap });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch student mastery roadmap', 500);
  }
}
