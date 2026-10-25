// ============================================================
// STUDENT MCQ PRACTICE API: GET /api/student/mcq/practice
// Retrieves verified MCQ practice questions with academic context & safe fallbacks.
// Strips correct answers and explanations pre-submission to prevent answer leakage.
// ============================================================

import { jsonResponse, errorResponse } from '../../../lib/json';
import { getAuthenticatedUser } from '../../../lib/auth';
import { Env } from '../../../lib/contentEngine';
import { getMcqPracticeQuestions } from '../../../lib/questionIntelligence/mcqPracticeService';
import { McqPracticeFilterParams } from '../../../../src/types';

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (!env.DB) {
    return errorResponse('Database binding not found', 500);
  }

  try {
    const authUser = await getAuthenticatedUser(request, env);
    const studentId = authUser?.uid || url.searchParams.get('studentId') || undefined;

    const branchId = url.searchParams.get('branchId') || undefined;
    const semesterStr = url.searchParams.get('semester');
    const semester = semesterStr !== null && semesterStr !== undefined && semesterStr !== '' ? Number(semesterStr) : undefined;
    const subjectCode = url.searchParams.get('subjectCode') || undefined;
    const subjectName = url.searchParams.get('subjectName') || undefined;
    const canonicalSubjectId = url.searchParams.get('canonicalSubjectId') || undefined;
    const topicName = url.searchParams.get('topicName') || undefined;
    const difficulty = url.searchParams.get('difficulty') as any || undefined;
    const sourceMode = url.searchParams.get('sourceMode') as any || undefined;
    const mode = (url.searchParams.get('mode') as any) || 'RANDOM';
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') || 10)));
    const page = Math.max(1, Number(url.searchParams.get('page') || 1));
    const isBookmarkedOnly = url.searchParams.get('isBookmarkedOnly') === 'true';
    const unattemptedOnly = url.searchParams.get('unattemptedOnly') === 'true';

    const params: McqPracticeFilterParams = {
      studentId,
      branchId,
      semester,
      subjectCode,
      subjectName,
      canonicalSubjectId,
      topicName,
      difficulty,
      sourceMode,
      mode,
      limit,
      page,
      isBookmarkedOnly,
      unattemptedOnly,
    };

    // 1. Primary Query: exact branch + semester + subject filter
    let result = await getMcqPracticeQuestions(env, params);

    // 2. Safe Fallback Level 1: If 0 questions with branch mapping, try subjectCode + semester without branch constraint
    if (result.questions.length === 0 && branchId && subjectCode) {
      result = await getMcqPracticeQuestions(env, {
        ...params,
        branchId: undefined,
      });
    }

    // 3. Safe Fallback Level 2: If 0 questions, try matching by subjectCode alone
    if (result.questions.length === 0 && subjectCode) {
      result = await getMcqPracticeQuestions(env, {
        ...params,
        branchId: undefined,
        semester: undefined,
      });
    }

    // 4. Safe Fallback Level 3: If 0 questions and subject name provided, search by subjectName
    if (result.questions.length === 0 && subjectName) {
      result = await getMcqPracticeQuestions(env, {
        ...params,
        branchId: undefined,
        semester: undefined,
        subjectCode: undefined,
      });
    }

    return jsonResponse({
      success: true,
      questions: result.questions,
      total: result.total,
      limit,
      page,
    });
  } catch (error: unknown) {
    console.error('Error in /api/student/mcq/practice:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch practice questions';
    return errorResponse(message, 500);
  }
}
