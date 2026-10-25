// ============================================================
// SHIKSHA SAHAYAK OS API: /api/ai/planner
// SECURITY: Authenticated user with AI Beta Access
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getAuthenticatedUser, checkAIBetaAccess } from "../../lib/auth";
import { executeAIRoute, AIResponse } from "../../lib/aiProviderRouter";

export async function onRequestPost(context: { request: Request; env: any }) {
  const { request, env } = context;

  const user = await getAuthenticatedUser(request, env);
  if (!user) return errorResponse("Unauthorized", 401);

  const hasBeta = await checkAIBetaAccess(user, env);
  if (!hasBeta) return errorResponse("Forbidden: AI Beta access required", 403);

  try {
    const body = (await request.json()) as {
      subjectId: string;
      weakTopics?: string[];
    };

    if (!body || !body.subjectId) {
      return errorResponse("Missing subjectId", 400);
    }

    const subjectId = String(body.subjectId).slice(0, 100);
    const weakTopics = body.weakTopics || ["Normalization", "Query Optimization"];

    const prompt = `Create a 4-week structured study schedule for GTU Engineering subject "${subjectId}". Focus areas for remediation: ${weakTopics.join(', ')}. Include daily tasks, key revision milestones, and PYQ practice targets.`;

    const result = await executeAIRoute(env, {
      capability: 'planner',
      messages: [{ role: 'user', content: prompt }],
      systemInstruction: 'You are ShikshaSahayak Study Planner AI. Create realistic, highly effective GTU semester revision schedules.',
      temperature: 0.7,
      maxTokens: 1800,
    }) as AIResponse;

    return jsonResponse({
      success: true,
      subjectId,
      studyPlan: result.text,
      provider: result.provider,
      model: result.model,
    });
  } catch (error: any) {
    return errorResponse(error.message || "Internal Server Error", 500);
  }
}
