// ============================================================
// ADMIN API: TRIGGER RESUMABLE GTU BATCH INGESTION
// POST /api/admin/content-operations/batch-ingest
// ============================================================

import { Env } from '../../../lib/contentEngine';
import { runResumableBatchIngestion, BatchIngestionJobParams } from '../../../lib/questionIntelligence/contentOperations';
import { requireAdminOrTeacher } from '../../../lib/auth';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { user, errorResponse: authError } = await requireAdminOrTeacher(context.request, context.env);
    if (authError) return authError;

    const body = (await context.request.json().catch(() => ({}))) as BatchIngestionJobParams;

    if (!body.targetSubjectCodes || !Array.isArray(body.targetSubjectCodes) || body.targetSubjectCodes.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid targetSubjectCodes array' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const result = await runResumableBatchIngestion(context.env, body);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Error in /api/admin/content-operations/batch-ingest:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
