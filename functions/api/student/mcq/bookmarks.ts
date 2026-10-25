// ============================================================
// STUDENT MCQ BOOKMARKS API: GET /api/student/mcq/bookmarks
// Fetches all bookmarked MCQ questions for the authenticated student.
// ============================================================

import { jsonResponse, errorResponse } from '../../../lib/json';
import { getAuthenticatedUser } from '../../../lib/auth';
import { Env } from '../../../lib/contentEngine';
import { getStudentMcqBookmarks } from '../../../lib/questionIntelligence/mcqPracticeService';

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (!env.DB) {
    return errorResponse('Database binding not found', 500);
  }

  try {
    const authUser = await getAuthenticatedUser(request, env);
    const studentId = authUser?.uid || url.searchParams.get('studentId') || 'guest_student';

    const questions = await getStudentMcqBookmarks(env, studentId);

    return jsonResponse({
      success: true,
      bookmarks: questions,
      total: questions.length,
    });
  } catch (error: unknown) {
    console.error('Error in /api/student/mcq/bookmarks:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch bookmarked questions';
    return errorResponse(message, 500);
  }
}
