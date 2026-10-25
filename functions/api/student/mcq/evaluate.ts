// ============================================================
// STUDENT MCQ EVALUATION API: POST /api/student/mcq/evaluate
// Evaluates student MCQ answer on server, enforces strict security
// (never trusts frontend correctness), records attempt, updates topic progress.
// ============================================================

import { jsonResponse, errorResponse } from '../../../lib/json';
import { getAuthenticatedUser } from '../../../lib/auth';
import { Env } from '../../../lib/contentEngine';
import { evaluateStudentMcqAnswer } from '../../../lib/questionIntelligence/mcqPracticeService';

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  if (!env.DB) {
    return errorResponse('Database binding not found', 500);
  }

  try {
    const authUser = await getAuthenticatedUser(request, env);
    const body = (await request.json()) as {
      questionId: string;
      selectedOptionId: string;
      studentId?: string;
      timeTakenSeconds?: number;
      practiceMode?: 'RANDOM' | 'TOPIC_WISE' | 'PYQ_WISE' | 'CUSTOM';
    };

    if (!body.questionId) {
      return errorResponse('Question ID is required', 400);
    }
    if (body.selectedOptionId === undefined || body.selectedOptionId === null) {
      return errorResponse('Selected option is required', 400);
    }

    const studentId = authUser?.uid || body.studentId || undefined;
    const timeTaken = typeof body.timeTakenSeconds === 'number' ? Math.max(0, body.timeTakenSeconds) : 0;
    const practiceMode = body.practiceMode || 'RANDOM';

    const evaluation = await evaluateStudentMcqAnswer(
      env,
      body.questionId,
      body.selectedOptionId,
      studentId,
      timeTaken,
      practiceMode
    );

    return jsonResponse({
      success: true,
      evaluation,
    });
  } catch (error: unknown) {
    console.error('Error in /api/student/mcq/evaluate:', error);
    const message = error instanceof Error ? error.message : 'Failed to evaluate MCQ answer';
    return errorResponse(message, 500);
  }
}
