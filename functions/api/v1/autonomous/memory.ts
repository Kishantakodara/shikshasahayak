/**
 * SHIKSHA SAHAYAK OS — PHASE Y AI ACADEMIC MEMORY API
 * Endpoint: /api/v1/autonomous/memory
 */

import { getOrCreateAcademicMemory } from '../../../../functions/lib/autonomousLearningEcosystem';
import { getAuthenticatedUser, checkAIBetaAccess } from '../../../../functions/lib/auth';
import { executeAIRoute, AIResponse } from '../../../../functions/lib/aiProviderRouter';

export const onRequestGet: PagesFunction = async (context) => {
  const { request, env } = context;

  const user = await getAuthenticatedUser(request, env as any);
  if (!user) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  const hasBeta = await checkAIBetaAccess(user, env as any);
  if (!hasBeta) {
    return new Response(JSON.stringify({ success: false, error: "Forbidden: AI Beta access required" }), {
      status: 403,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const memory = getOrCreateAcademicMemory(user.uid);
    const url = new URL(request.url);
    const summarize = url.searchParams.get('summarize') === 'true';

    let summaryText: string | null = null;
    if (summarize && memory.weakTopics.length > 0) {
      const aiResult = await executeAIRoute(env as any, {
        capability: 'memory',
        messages: [{ role: 'user', content: `Compress and summarize learning memory for student weak topics: ${memory.weakTopics.join(', ')}.` }],
        systemInstruction: 'You are ShikshaSahayak Academic Memory Compressor.',
        temperature: 0.3,
        maxTokens: 250,
      }) as AIResponse;
      summaryText = aiResult.text;
    }

    return new Response(JSON.stringify({
      success: true,
      memory,
      compressedSummary: summaryText
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};
