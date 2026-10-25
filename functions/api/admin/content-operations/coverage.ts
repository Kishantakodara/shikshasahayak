// ============================================================
// ADMIN API: LIVE GTU CONTENT COVERAGE MATRIX
// GET /api/admin/content-operations/coverage
// ============================================================

import { Env } from '../../../lib/contentEngine';
import { getLiveContentCoverageSummary } from '../../../lib/questionIntelligence/contentOperations';
import { requireAdminOrTeacher } from '../../../lib/auth';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { user, errorResponse: authError } = await requireAdminOrTeacher(context.request, context.env);
    if (authError) return authError;

    const summary = await getLiveContentCoverageSummary(context.env);

    return new Response(JSON.stringify({ success: true, ...summary }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Error in /api/admin/content-operations/coverage:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
