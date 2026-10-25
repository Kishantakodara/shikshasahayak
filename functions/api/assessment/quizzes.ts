import { jsonResponse, errorResponse } from "../../lib/json";
import { getAssessmentQuizzes, getQuizQuestions } from "../../lib/assessmentEngineService";
import { getAuthenticatedUser } from "../../lib/auth";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);

  const quizId = url.searchParams.get("quizId");
  if (quizId) {
    try {
      const user = await getAuthenticatedUser(request, env as any);
      const isTeacherOrAdmin = user && (user.role === 'admin' || user.role === 'teacher');
      const questions = await getQuizQuestions(env, quizId, Boolean(isTeacherOrAdmin));
      return jsonResponse({ quizId, questions }, {
        headers: { "Cache-Control": "private, no-cache" },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Internal Server Error";
      return errorResponse(message, 500);
    }
  }

  const branchId = url.searchParams.get("branchId") || undefined;
  const semesterParam = url.searchParams.get("semester");
  const semester = semesterParam ? Number(semesterParam) : undefined;
  const subjectId = url.searchParams.get("subjectId") || undefined;

  try {
    const quizzes = await getAssessmentQuizzes(env, { branchId, semester, subjectId });
    return jsonResponse(quizzes, {
      headers: { "Cache-Control": "public, max-age=120, s-maxage=600" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
