// ============================================================
// SHIKSHA SAHAYAK OS API: /api/ai/quiz-generator
// SECURITY: Requires teacher or admin role & AI Beta Access
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getAuthenticatedUser, checkAIBetaAccess } from "../../lib/auth";
import { executeAIRoute, AIResponse } from "../../lib/aiProviderRouter";

const MAX_TOPIC_LENGTH = 200;
const MAX_SUBJECT_LENGTH = 100;
const MAX_QUESTIONS = 20;
const MIN_QUESTIONS = 1;

export async function onRequestPost(context: { request: Request; env: any }) {
  const { request, env } = context;

  // ── Auth Guard — teacher or admin only ──────────────────
  const user = await getAuthenticatedUser(request, env);
  if (!user) return errorResponse("Unauthorized", 401);
  if (user.role !== "teacher" && user.role !== "educator" && user.role !== "admin") {
    return errorResponse("Forbidden: teacher or admin role required", 403);
  }

  const hasBeta = await checkAIBetaAccess(user, env);
  if (!hasBeta) return errorResponse("Forbidden: AI Beta access required", 403);
  // ────────────────────────────────────────────────────────

  try {
    const body = (await request.json()) as {
      subjectId: string;
      topicName: string;
      questionCount?: number;
    };

    if (!body || !body.subjectId || !body.topicName) {
      return errorResponse("Missing required parameters: subjectId or topicName", 400);
    }

    const subjectId = String(body.subjectId).trim().slice(0, MAX_SUBJECT_LENGTH);
    const topicName = String(body.topicName).trim().slice(0, MAX_TOPIC_LENGTH);
    const questionCount = Math.min(
      Math.max(Number(body.questionCount) || 3, MIN_QUESTIONS),
      MAX_QUESTIONS
    );

    if (topicName.length === 0) return errorResponse("topicName cannot be empty", 400);

    const prompt = `Generate ${questionCount} GTU-style engineering practice questions (MCQs with 4 options and correct answer index) for subject "${subjectId}" on topic "${topicName}". Return JSON array.`;

    // Primary Provider: Groq (GROQ_API_KEY)
    const result = await executeAIRoute(env, {
      capability: 'quiz_generator',
      messages: [{ role: 'user', content: prompt }],
      systemInstruction: 'You are ShikshaSahayak Quiz Generator AI powered by Groq. Always output clean JSON format without markdown wrapping.',
      temperature: 0.5,
      maxTokens: 2000,
    }) as AIResponse;

    return jsonResponse({
      success: true,
      subjectId,
      topicName,
      questionCount,
      generatedContent: result.text,
      provider: result.provider,
      model: result.model,
    });
  } catch (error: any) {
    return errorResponse(error.message || "Internal Server Error", 500);
  }
}
