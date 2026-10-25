/**
 * SHIKSHA SAHAYAK OS — PHASE Y SPACED REPETITION SM-2 SCHEDULER API
 * Endpoint: /api/v1/autonomous/spaced-repetition
 */

import { calculateNextRevision } from '../../../../functions/lib/autonomousLearningEcosystem';
import { getAuthenticatedUser, verifyBetaAccess } from '../../../../functions/lib/auth';

export const onRequestPost: PagesFunction = async (context) => {
  const { request, env } = context;

  const user = await getAuthenticatedUser(request, env as any);
  const betaAuth = await verifyBetaAccess(user, env as any, 'spacedRepetition');
  if (!betaAuth.allowed && betaAuth.response) {
    return betaAuth.response;
  }

  try {
    const body = (await request.json()) as any;
    const item = body.item || {
      id: 'sr_1',
      topic: 'Process Scheduling',
      intervalDays: 1,
      repetitionCount: 1,
      easeFactor: 2.5,
      nextReviewDate: new Date().toISOString().split('T')[0],
      status: 'due' as const
    };
    const rating = (body.rating !== undefined ? body.rating : 4) as 0 | 1 | 2 | 3 | 4 | 5;

    // 100% Deterministic SuperMemo-2 Spaced Repetition Algorithm
    const nextItem = calculateNextRevision(item, rating);

    return new Response(JSON.stringify({ success: true, updatedItem: nextItem }), {
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
