// GET /api/admin/adaptive/analytics
import { getAuthenticatedUser, isAdmin } from '../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../lib/json';

export async function onRequestGet(context: { request: Request; env: WorkerBindings }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
    if (!isAdmin(user.email, user.role) && user.role !== "admin" && user.role !== "teacher") {
      return errorResponse('Forbidden: Admin access required', 403);
    }

    const activeStudents = (await context.env.DB.prepare(
      `SELECT COUNT(DISTINCT student_id) as cnt FROM student_topic_mastery`
    ).first<{ cnt: number }>())?.cnt || 0;

    const weakTopics = await context.env.DB.prepare(
      `SELECT subject_code, subject_name, topic_name, COUNT(DISTINCT student_id) as student_count, AVG(mastery_score) as avg_mastery
       FROM student_topic_mastery
       WHERE mastery_level IN ('LOW_CONFIDENCE', 'DEVELOPING')
       GROUP BY subject_code, topic_name
       ORDER BY student_count DESC LIMIT 10`
    ).all<Record<string, unknown>>();

    const masteredTopics = await context.env.DB.prepare(
      `SELECT subject_code, topic_name, COUNT(DISTINCT student_id) as student_count
       FROM student_topic_mastery
       WHERE mastery_level = 'MASTERED'
       GROUP BY subject_code, topic_name
       ORDER BY student_count DESC LIMIT 10`
    ).all<Record<string, unknown>>();

    return jsonResponse({
      success: true,
      analytics: {
        activeStudents,
        topWeakTopics: weakTopics.results || [],
        topMasteredTopics: masteredTopics.results || [],
      },
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch admin adaptive analytics', 500);
  }
}
