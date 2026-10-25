/**
 * SHIKSHA SAHAYAK OS — PHASE Y EXAM PREDICTION ENGINE API
 * Endpoint: /api/v1/autonomous/exam-prediction
 */

import { predictExamOutcomes } from '../../../../functions/lib/autonomousLearningEcosystem';
import { getAuthenticatedUser, verifyBetaAccess } from '../../../../functions/lib/auth';

export const onRequestGet: PagesFunction = async (context) => {
  const { request, env } = context;

  const user = await getAuthenticatedUser(request, env as any);
  const betaAuth = await verifyBetaAccess(user, env as any, 'examPrediction');
  if (!betaAuth.allowed && betaAuth.response) {
    return betaAuth.response;
  }

  try {
    const url = new URL(request.url);
    const subject = url.searchParams.get('subject') || 'Operating Systems';

    // Deterministic GTU frequency & prediction calculation engine
    const prediction = predictExamOutcomes(subject);

    return new Response(JSON.stringify({ success: true, prediction }), {
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
