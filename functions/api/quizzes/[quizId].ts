import { jsonResponse, errorResponse } from "../../lib/json";
import { getAuthenticatedUser } from "../../lib/auth";

export async function onRequestGet(context: { 
  env: { ASSESSMENT_DB: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string }; 
  params: { quizId: string }; 
  request: Request 
}) {
  const { env, params, request } = context;
  const db = (env as any).DB || env.ASSESSMENT_DB;
  const { quizId } = params;

  try {
    if (!quizId) {
      return errorResponse("Quiz ID is required", 400);
    }

    const quiz: any = await db.prepare(
      `SELECT * FROM quizzes WHERE id = ? LIMIT 1`
    ).bind(quizId).first();

    if (!quiz) {
      return errorResponse("Quiz not found", 404);
    }

    const user = await getAuthenticatedUser(request, env);
    const isTeacherOrAdmin = user && (user.role === 'admin' || user.role === 'teacher');

    const { results: questions } = await db.prepare(
      `SELECT id, question, options, correct_answer, explanation FROM questions WHERE quiz_id = ? ORDER BY id ASC`
    ).bind(quizId).all();

    // Map questions to parse the options JSON string - strip correct answers for students
    const mappedQuestions = questions.map((q: any) => {
      let parsedOptions: any[] = [];
      try {
        parsedOptions = typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || []);
      } catch {
        parsedOptions = [];
      }

      return {
        id: q.id,
        question: q.question,
        options: parsedOptions,
        // Only expose correct answer and explanation to teachers/admins
        ...(isTeacherOrAdmin ? {
          correct_answer: q.correct_answer,
          correctAnswer: q.correct_answer,
          explanation: q.explanation
        } : {})
      };
    });

    return jsonResponse({
      ...quiz,
      questions: mappedQuestions
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}
