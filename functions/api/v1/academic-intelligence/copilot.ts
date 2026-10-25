/**
 * SHIKSHA SAHAYAK OS — PHASE X AI STUDY COPILOT API
 * Endpoint: /api/v1/academic-intelligence/copilot
 */

import { generateCopilotPrompt } from '../../../../functions/lib/academicIntelligenceEngine';
import { getAuthenticatedUser, verifyBetaAccess } from '../../../../functions/lib/auth';
import { executeAIRoute, AIResponse } from '../../../../functions/lib/aiProviderRouter';

export const onRequestPost: PagesFunction = async (context) => {
  const { request, env } = context;

  const user = await getAuthenticatedUser(request, env as any);
  const betaAuth = await verifyBetaAccess(user, env as any, 'aiCopilot');
  if (!betaAuth.allowed && betaAuth.response) {
    return betaAuth.response;
  }

  try {
    const body = await request.json() as any;
    const mode = body.mode || 'concept';
    const topic = body.topic || 'Operating System Concepts';
    const ctx = body.context || {};

    const promptText = generateCopilotPrompt(mode, topic, ctx);

    const result = await executeAIRoute(env as any, {
      capability: 'copilot',
      messages: [{ role: 'user', content: promptText }],
      systemInstruction: 'You are ShikshaSahayak Academic Copilot. Provide accurate GTU engineering guidance, step-by-step numerical solutions, and viva questions.',
      temperature: 0.7,
      maxTokens: 1500,
    }) as AIResponse;

    return new Response(JSON.stringify({
      success: true,
      mode,
      topic,
      context: ctx,
      prompt: promptText,
      explanation: result.text,
      provider: result.provider,
      model: result.model,
      suggestedFollowUps: [
        `Solve 7-mark GTU numerical on ${topic}`,
        `Top 5 Viva Questions for ${topic}`,
        `One-shot revision summary for ${topic}`
      ]
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};
