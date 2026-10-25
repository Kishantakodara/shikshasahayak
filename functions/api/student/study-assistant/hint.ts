// ============================================================
// STUDENT API: AI SOCRATIC HINT GENERATION
// POST /api/student/study-assistant/hint
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
      studentLevel?: 'beginner' | 'intermediate' | 'advanced';
    };

    if (!body.questionId) {
      return new Response(JSON.stringify({ error: 'Missing required field: questionId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const hintRes = await getStudyAssistanceAI(context.env, {
      questionId: body.questionId,
      assistanceType: 'HINT',
      studentLevel: body.studentLevel,
    });

    return new Response(JSON.stringify({ success: true, ...hintRes }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Error in /api/student/study-assistant/hint:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
