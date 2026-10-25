// POST /api/student/adaptive/evaluate-answer
import { getAuthenticatedUser } from '../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../lib/json';
import { submitQuestionAnswer, recalculateStudentTopicMastery } from '../../../lib/questionIntelligence';

export async function onRequestPost(context: { request: Request; env: WorkerBindings }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse('Unauthorized access', 401);

    const body = await context.request.json() as any;
    if (!body.sessionId || !body.questionId || body.answer === undefined) {
      return errorResponse('Missing required params (sessionId, questionId, answer)', 400);
    }

    const evalRes = await submitQuestionAnswer(
      context.env,
      body.sessionId,
      user.uid,
      body.questionId,
      body.answer,
      body.timeTakenSeconds || 0
    );

    // Fetch topic metadata to compute mastery delta
    const qMeta = await context.env.DB.prepare(`SELECT subject_code, topic_name FROM master_question_bank WHERE id = ?`)
      .bind(body.questionId)
      .first<{ subject_code: string; topic_name: string }>();

    let masteryFeedback: {
      subjectCode: string;
      topicName: string;
      newMasteryScore: number;
      masteryLevel: string;
      recommendedAction: string;
    } | null = null;
    if (qMeta && qMeta.subject_code && qMeta.topic_name) {
      const updatedMastery = await recalculateStudentTopicMastery(
        context.env,
        user.uid,
        qMeta.subject_code,
        qMeta.topic_name
      );
      masteryFeedback = {
        subjectCode: qMeta.subject_code,
        topicName: qMeta.topic_name,
        newMasteryScore: updatedMastery.masteryScore,
        masteryLevel: updatedMastery.masteryLevel,
        recommendedAction: evalRes.isCorrect
          ? `Great job! Your mastery on ${qMeta.topic_name} increased to ${updatedMastery.masteryScore}%.`
          : `${qMeta.topic_name} accuracy needs attention. Practice 2 more questions to rebuild mastery.`,
      };
    }

    return jsonResponse({ ...evalRes, masteryFeedback });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to evaluate adaptive answer', 500);
  }
}
