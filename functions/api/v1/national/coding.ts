/**
 * SHIKSHA SAHAYAK OS — PRODUCTION CODING PLATFORM API
 * Endpoint: /api/v1/national/coding
 */

import { evaluateCodeSubmission, getCodingLeaderboard } from '../../../../functions/lib/codingPlatformService';
import { getCodingChallenge } from '../../../../functions/lib/nationalScaleEcosystem';
import { getAuthenticatedUser, verifyBetaAccess } from '../../../../functions/lib/auth';

export const onRequestGet: PagesFunction = async (context) => {
  const { request, env } = context;
  const user = await getAuthenticatedUser(request, env as any);
  const betaAuth = await verifyBetaAccess(user, env as any, 'codingPlatform');
  if (!betaAuth.allowed && betaAuth.response) {
    return betaAuth.response;
  }
  try {
    const url = new URL(context.request.url);
    const mode = url.searchParams.get('mode') || 'challenge';
    const id = url.searchParams.get('id') || 'dsa_01';

    if (mode === 'leaderboard') {
      const leaderboard = getCodingLeaderboard();
      return new Response(JSON.stringify({ success: true, leaderboard }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const challenge = getCodingChallenge(id);
    return new Response(JSON.stringify({ success: true, challenge }), {
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

export const onRequestPost: PagesFunction = async (context) => {
  const { request, env } = context;
  const user = await getAuthenticatedUser(request, env as any);
  const betaAuth = await verifyBetaAccess(user, env as any, 'codingPlatform');
  if (!betaAuth.allowed && betaAuth.response) {
    return betaAuth.response;
  }
  try {
    const body = await context.request.json() as any;
    const userId = body.userId || 'guest_user';
    const userName = body.userName || 'Student Coder';
    const problemId = body.problemId || 'dsa_01';
    const language = body.language || 'cpp';
    const code = body.code || '#include <iostream>\nusing namespace std;\nint main() { cout << "0 1"; return 0; }';
    const testCases = body.testCases || [
      { input: '2 7 11 15\n9', expectedOutput: '0 1' },
      { input: '3 2 4\n6', expectedOutput: '1 2' }
    ];

    const submission = evaluateCodeSubmission(userId, userName, problemId, language, code, testCases);

    return new Response(JSON.stringify({ success: true, submission }), {
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
