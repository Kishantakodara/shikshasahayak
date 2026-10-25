// ============================================================
// ADMIN API: AI BATCH QUESTION GENERATION
// POST /api/admin/ai-generation/generate-batch
// ============================================================

import { Env } from '../../../lib/contentEngine';
import { generateQuestionBatchAI, AIGenerationBatchRequest } from '../../../lib/questionIntelligence/aiIntelligence';
import { requireAdminOrTeacher } from '../../../lib/auth';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { user, errorResponse: authError } = await requireAdminOrTeacher(context.request, context.env);
    if (authError) return authError;

    const body = (await context.request.json().catch(() => ({}))) as AIGenerationBatchRequest;

    if (!body.subjectCode || !body.subjectName || !body.topicName || !body.questionType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: subjectCode, subjectName, topicName, questionType' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const result = await generateQuestionBatchAI(context.env, body);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Error in /api/admin/ai-generation/generate-batch:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
