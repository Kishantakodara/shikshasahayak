// ============================================================
// SHIKSHA SAHAYAK OS API: /api/ai/assistant
// SECURITY: Requires authentication & AI Beta Access
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getAuthenticatedUser, checkAIBetaAccess } from "../../lib/auth";
import { executeAIRoute, AIResponse } from "../../lib/aiProviderRouter";

const MAX_QUESTION_LENGTH = 500;
const MAX_SUBJECT_LENGTH = 100;

export async function onRequestPost(context: { request: Request; env: any }) {
  const { request, env } = context;

  // ── Auth Guard & Beta Enforcement ───────────────────────
  const user = await getAuthenticatedUser(request, env);
  if (!user) return errorResponse("Unauthorized", 401);

  const hasBeta = await checkAIBetaAccess(user, env);
  if (!hasBeta) return errorResponse("Forbidden: AI Beta access required", 403);
  // ────────────────────────────────────────────────────────

  try {
    const body = (await request.json()) as {
      topicOrQuestion: string;
      contextSubject?: string;
    };

    if (!body || !body.topicOrQuestion) {
      return errorResponse("Missing required parameter: topicOrQuestion", 400);
    }

    const question = String(body.topicOrQuestion).trim().slice(0, MAX_QUESTION_LENGTH);
    const subject = String(body.contextSubject || "general").trim().slice(0, MAX_SUBJECT_LENGTH);

    if (question.length === 0) {
      return errorResponse("topicOrQuestion cannot be empty", 400);
    }

    // Call Central AI Provider Router (OpenRouter Primary)
    const result = await executeAIRoute(env, {
      capability: 'assistant',
      messages: [
        { role: 'user', content: `Explain the following topic for GTU engineering students in subject "${subject}": ${question}` }
      ],
      systemInstruction: 'You are ShikshaSahayak AI Assistant. Provide structured, step-by-step engineering explanations with formulas, key points, and exam tips.',
      temperature: 0.7,
      maxTokens: 1500,
    }) as AIResponse;

    return jsonResponse({
      success: true,
      explanation: result.text,
      provider: result.provider,
      model: result.model,
    });
  } catch (error: any) {
    return errorResponse(error.message || "Internal Server Error", 500);
  }
}
