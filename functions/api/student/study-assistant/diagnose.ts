// ============================================================
// STUDENT API: AI WRONG ANSWER MISCONCEPTION DIAGNOSIS
// POST /api/student/study-assistant/diagnose
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
      selectedOption?: string;
    };

    if (!body.questionId || !body.selectedOption) {
      return new Response(JSON.stringify({ error: 'Missing required fields: questionId, selectedOption' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const diagnosisRes = await getStudyAssistanceAI(context.env, {
      questionId: body.questionId,
      assistanceType: 'WRONG_ANSWER_DIAGNOSIS',
      selectedOption: body.selectedOption,
    });

    return new Response(JSON.stringify({ success: true, ...diagnosisRes }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Error in /api/student/study-assistant/diagnose:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
