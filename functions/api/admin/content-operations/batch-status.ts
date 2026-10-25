// ============================================================
// ADMIN API: BATCH INGESTION JOB STATUS
// GET /api/admin/content-operations/batch-status
// ============================================================

import { Env } from '../../../lib/contentEngine';
import { requireAdminOrTeacher } from '../../../lib/auth';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { user, errorResponse: authError } = await requireAdminOrTeacher(context.request, context.env);
    if (authError) return authError;

    const url = new URL(context.request.url);
    const jobId = url.searchParams.get('jobId');

    if (jobId) {
      const job = await context.env.DB.prepare(
        `SELECT * FROM question_pipeline_jobs WHERE job_id = ?`
      ).bind(jobId).first();

      return new Response(JSON.stringify({ success: true, job }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const recentJobs = await context.env.DB.prepare(
      `SELECT * FROM question_pipeline_jobs ORDER BY started_at DESC LIMIT 10`
    ).all();

    return new Response(JSON.stringify({ success: true, jobs: recentJobs.results || [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Error in /api/admin/content-operations/batch-status:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
