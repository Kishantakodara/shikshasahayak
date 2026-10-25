// ============================================================
// ADMIN API: AI PYQ TRANSFORMATION
// POST /api/admin/ai-generation/transform-pyq
// ============================================================

import { Env } from '../../../lib/contentEngine';
import { transformPyqWithAI, PyqTransformationRequest } from '../../../lib/questionIntelligence/aiIntelligence';
import { requireAdminOrTeacher } from '../../../lib/auth';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { errorResponse: authError } = await requireAdminOrTeacher(context.request, context.env);
    if (authError) {
      return authError;
    }

    const body = (await context.request.json().catch(() => ({}))) as PyqTransformationRequest;

    if (!body.parentQuestionId || !body.transformationType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: parentQuestionId, transformationType' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const result = await transformPyqWithAI(context.env, body);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Error in /api/admin/ai-generation/transform-pyq:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
