/**
 * SHIKSHA SAHAYAK OS — PHASE X PERSONALIZED LEARNING PLAN API
 * Endpoint: /api/v1/academic-intelligence/personalized-plan
 */

import { generatePersonalizedStudyPlan } from '../../../../functions/lib/academicIntelligenceEngine';
import { getAuthenticatedUser, verifyBetaAccess } from '../../../../functions/lib/auth';
import { executeAIRoute, AIResponse } from '../../../../functions/lib/aiProviderRouter';

export const onRequestPost: PagesFunction = async (context) => {
  const { request, env } = context;

  const user = await getAuthenticatedUser(request, env as any);
  if (!user) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized: Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  const betaAuth = await verifyBetaAccess(user, env as any, 'personalizedLearning');
  if (!betaAuth.allowed && betaAuth.response) {
    return betaAuth.response;
  }

  try {
    const body = (await request.json()) as any;
    const planType = body.planType || 'daily';
    const weakTopics = body.weakTopics || ['Fourier Series', 'Tree Traversal'];
    const strongTopics = body.strongTopics || ['Arrays', 'SQL Basics'];

    // Rule-based deterministic study plan foundation
    const deterministicPlan = generatePersonalizedStudyPlan(user.uid, planType, weakTopics, strongTopics);

    let llmInterpretation: string | null = null;
    if (body.includeLLMAdvice) {
      const aiResult = await executeAIRoute(env as any, {
        capability: 'personalized_plan',
        messages: [{ role: 'user', content: `Provide customized revision guidance for student weak topics: ${weakTopics.join(', ')} and strong topics: ${strongTopics.join(', ')}.` }],
        systemInstruction: 'You are ShikshaSahayak Adaptive Learning Planner.',
        temperature: 0.7,
        maxTokens: 1200,
      }) as AIResponse;
      llmInterpretation = aiResult.text;
    }

    return new Response(JSON.stringify({
      success: true,
      plan: deterministicPlan,
      llmAdvice: llmInterpretation
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
