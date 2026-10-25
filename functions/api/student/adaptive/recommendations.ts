// GET /api/student/adaptive/recommendations
import { getAuthenticatedUser } from '../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../lib/json';

export async function onRequestGet(context: { request: Request; env: WorkerBindings }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse('Unauthorized access', 401);

    // Fetch weakest topic for student
    const weakest = await context.env.DB.prepare(
      `SELECT * FROM student_topic_mastery WHERE student_id = ? ORDER BY mastery_score ASC LIMIT 1`
    ).bind(user.uid).first<Record<string, unknown>>();

    let rec = {
      recommendedMode: 'BALANCED_PRACTICE',
      subjectCode: weakest?.subject_code || '3110014',
      subjectName: weakest?.subject_name || 'Mathematics - 1',
      topicName: weakest?.topic_name || 'Calculus',
      reason: weakest
        ? `Your accuracy on ${weakest.topic_name} is currently ${weakest.accuracy_percentage}%. Practice recommended.`
        : 'Start a balanced practice session to build your initial mastery roadmap.',
      targetQuestionCount: 10,
    };

    return jsonResponse({ success: true, recommendation: rec });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch adaptive recommendations', 500);
  }
}
