// ============================================================
// STUDENT MCQ BOOKMARK API: POST /api/student/mcq/bookmark
// Toggles bookmark status for a student on a specific MCQ question.
// ============================================================

import { jsonResponse, errorResponse } from '../../../lib/json';
import { getAuthenticatedUser } from '../../../lib/auth';
import { Env } from '../../../lib/contentEngine';
import { toggleMcqBookmark } from '../../../lib/questionIntelligence/mcqPracticeService';

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  if (!env.DB) {
    return errorResponse('Database binding not found', 500);
  }

  try {
    const authUser = await getAuthenticatedUser(request, env);
    const body = (await request.json()) as {
      questionId: string;
      notes?: string;
      studentId?: string;
    };

    if (!body.questionId) {
      return errorResponse('Question ID is required', 400);
    }

    const studentId = authUser?.uid || body.studentId || 'guest_student';

    const result = await toggleMcqBookmark(env, studentId, body.questionId, body.notes);

    return jsonResponse({
      success: true,
      isBookmarked: result.isBookmarked,
      questionId: body.questionId,
    });
  } catch (error: unknown) {
    console.error('Error in /api/student/mcq/bookmark:', error);
    const message = error instanceof Error ? error.message : 'Failed to toggle MCQ bookmark';
    return errorResponse(message, 500);
  }
}
