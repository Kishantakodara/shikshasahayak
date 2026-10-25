// ============================================================
// STUDENT API: AI STEP-BY-STEP DERIVATION & EXPLANATION
// POST /api/student/study-assistant/explain
// ============================================================

import { Env } from '../../../lib/contentEngine';
import { getStudyAssistanceAI } from '../../../lib/questionIntelligence/aiIntelligence';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const authHeader = context.request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized. Bearer token required.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = (await context.request.json().catch(() => ({}))) as {
      questionId?: string;
    };

    if (!body.questionId) {
      return new Response(JSON.stringify({ error: 'Missing required field: questionId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const explainRes = await getStudyAssistanceAI(context.env, {
      questionId: body.questionId,
      assistanceType: 'EXPLANATION',
    });

    return new Response(JSON.stringify({ success: true, ...explainRes }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Error in /api/student/study-assistant/explain:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
