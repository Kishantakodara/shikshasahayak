/**
 * SHIKSHA SAHAYAK OS — PHASE X SMART ANALYTICS API
 * Endpoint: /api/v1/academic-intelligence/smart-analytics
 */

import { calculateAcademicHealth } from '../../../../functions/lib/academicIntelligenceEngine';
import { getAuthenticatedUser, verifyBetaAccess } from '../../../../functions/lib/auth';
import { executeAIRoute, AIResponse } from '../../../../functions/lib/aiProviderRouter';

export const onRequestGet: PagesFunction = async (context) => {
  const { request, env } = context;

  const user = await getAuthenticatedUser(request, env as any);
  const betaAuth = await verifyBetaAccess(user, env as any, 'personalizedLearning');
  if (!betaAuth.allowed && betaAuth.response) {
    return betaAuth.response;
  }

  try {
    const url = new URL(request.url);
    const quizzes = parseInt(url.searchParams.get('quizzes') || '8');
    const accuracy = parseFloat(url.searchParams.get('accuracy') || '85.5');
    const attendance = parseFloat(url.searchParams.get('attendance') || '92.0');
    const getAiAdvice = url.searchParams.get('aiAdvice') === 'true';

    // 100% Deterministic analytics calculation engine
    const healthScores = calculateAcademicHealth(quizzes, accuracy, attendance);

    let aiInterpretation: string | null = null;
    if (getAiAdvice) {
      const aiResult = await executeAIRoute(env as any, {
        capability: 'smart_analytics',
        messages: [{ role: 'user', content: `Interpret student academic metrics: ${quizzes} quizzes completed, ${accuracy}% quiz accuracy, ${attendance}% classroom attendance. Provide 2-sentence actionable advice.` }],
        systemInstruction: 'You are ShikshaSahayak Academic Analytics Advisor.',
        temperature: 0.5,
        maxTokens: 300,
      }) as AIResponse;
      aiInterpretation = aiResult.text;
    }

    return new Response(JSON.stringify({
      success: true,
      healthScores,
      aiAdvice: aiInterpretation
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
