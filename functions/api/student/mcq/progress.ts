// ============================================================
// STUDENT MCQ PROGRESS API: GET /api/student/mcq/progress
// Fetches student MCQ practice stats, accuracy, and topic breakdown.
// ============================================================

import { jsonResponse, errorResponse } from '../../../lib/json';
import { getAuthenticatedUser } from '../../../lib/auth';
import { Env } from '../../../lib/contentEngine';
import { getStudentMcqProgressSummary } from '../../../lib/questionIntelligence/mcqPracticeService';

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (!env.DB) {
    return errorResponse('Database binding not found', 500);
  }

  try {
    const authUser = await getAuthenticatedUser(request, env);
    const studentId = authUser?.uid || url.searchParams.get('studentId') || 'guest_student';

    const branchId = url.searchParams.get('branchId') || undefined;
    const subjectCode = url.searchParams.get('subjectCode') || undefined;

    const progress = await getStudentMcqProgressSummary(env, studentId, branchId, subjectCode);

    return jsonResponse({
      success: true,
      progress,
    });
  } catch (error: unknown) {
    console.error('Error in /api/student/mcq/progress:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch MCQ progress';
    return errorResponse(message, 500);
  }
}
