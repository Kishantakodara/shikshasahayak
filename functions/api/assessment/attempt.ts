import { jsonResponse, errorResponse } from "../../lib/json";
import { submitAssessmentAttempt } from "../../lib/assessmentEngineService";
import { getAuthenticatedUser } from "../../lib/auth";
import { Env } from "../../lib/contentEngine";

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    const user = await getAuthenticatedUser(request, env as any);
    const body = (await request.json().catch(() => ({}))) as {
      userId?: string;
      quizId?: string;
      answers?: Record<string, number>;
      timeTakenSeconds?: number;
    };

    const finalUserId = user?.uid || body.userId;

    if (!finalUserId || !body.quizId || !body.answers) {
      return errorResponse("Missing required attempt parameters (userId, quizId, answers)", 400);
    }

    if (user && body.userId && body.userId !== user.uid && body.userId !== user.uid && user.role !== 'admin') {
      return errorResponse("Forbidden: Cannot submit assessment attempt for another user", 403);
    }

    const result = await submitAssessmentAttempt(
      env,
      finalUserId,
      body.quizId,
      body.answers,
      body.timeTakenSeconds || 0
    );

    if (!result) {
      return errorResponse("Failed to score assessment attempt", 500);
    }

    return jsonResponse(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
