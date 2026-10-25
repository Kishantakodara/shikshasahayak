// GET /api/student/adaptive/mastery
import { getAuthenticatedUser } from '../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../lib/json';

export async function onRequestGet(context: { request: Request; env: WorkerBindings }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse('Unauthorized access', 401);

    const url = new URL(context.request.url);
    const subjectCode = url.searchParams.get('subjectCode') || undefined;

    let sql = `SELECT * FROM student_topic_mastery WHERE student_id = ?`;
    const params: any[] = [user.uid];

    if (subjectCode) {
      sql += ` AND subject_code = ?`;
      params.push(subjectCode);
    }

    sql += ` ORDER BY mastery_score ASC`;

    const { results } = await context.env.DB.prepare(sql).bind(...params).all<Record<string, unknown>>();

    return jsonResponse({ success: true, masteryRecords: results || [] });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch student mastery', 500);
  }
}
