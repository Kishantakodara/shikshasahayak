// GET /api/admin/questions/queue
import { getAuthenticatedUser, isAdmin } from '../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../lib/json';
import { getIngestionQueue } from '../../../lib/questionIntelligence';

export async function onRequestGet(context: { request: Request; env: any }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
    if (!isAdmin(user.email, user.role) && user.role !== "admin" && user.role !== "teacher") {
      return errorResponse('Forbidden: Admin access required', 403);
    }

    const url = new URL(context.request.url);
    const filter = {
      status: url.searchParams.get('status') || undefined,
      source: url.searchParams.get('source') || undefined,
      exam: url.searchParams.get('exam') || undefined,
      year: url.searchParams.has('year') ? Number(url.searchParams.get('year')) : undefined,
      branchId: url.searchParams.get('branchId') || undefined,
      subjectCode: url.searchParams.get('subjectCode') || undefined,
      topicName: url.searchParams.get('topicName') || undefined,
      questionType: url.searchParams.get('questionType') || undefined,
      difficulty: url.searchParams.get('difficulty') || undefined,
      isAiGenerated: url.searchParams.has('isAiGenerated') ? url.searchParams.get('isAiGenerated') === 'true' : undefined,
      isOriginalPyq: url.searchParams.has('isOriginalPyq') ? url.searchParams.get('isOriginalPyq') === 'true' : undefined,
      search: url.searchParams.get('search') || undefined,
      page: url.searchParams.has('page') ? Number(url.searchParams.get('page')) : 1,
      pageSize: url.searchParams.has('pageSize') ? Number(url.searchParams.get('pageSize')) : 20,
    };

    const res = await getIngestionQueue(context.env, filter);
    return jsonResponse(res);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch ingestion queue', 500);
  }
}
