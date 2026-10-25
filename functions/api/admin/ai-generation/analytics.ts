// ============================================================
// ADMIN API: AI GENERATION & PERSONALIZATION ANALYTICS
// GET /api/admin/ai-generation/analytics
// ============================================================

import { Env } from '../../../lib/contentEngine';
import { requireAdminOrTeacher } from '../../../lib/auth';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { errorResponse: authError } = await requireAdminOrTeacher(context.request, context.env);
    if (authError) {
      return authError;
    }

    // 1. Fetch total AI generated, staged, and quarantined counts
    const batchSummary = await context.env.DB.prepare(
      `SELECT COUNT(*) as total_batches,
              COALESCE(SUM(requested_count), 0) as total_requested,
              COALESCE(SUM(generated_count), 0) as total_generated,
              COALESCE(SUM(staged_count), 0) as total_staged,
              COALESCE(SUM(quarantined_count), 0) as total_quarantined,
              COALESCE(AVG(latency_ms), 0) as avg_latency_ms
       FROM ai_generation_batches`
    ).first<Record<string, number>>();

    // 2. Fetch cache hit and assistance stats
    const assistanceSummary = await context.env.DB.prepare(
      `SELECT assistance_type, COUNT(*) as total_cached
       FROM ai_study_assistance_cache
       GROUP BY assistance_type`
    ).all<{ assistance_type: string; total_cached: number }>();

    // 3. Fetch master bank AI vs PYQ composition
    const masterComposition = await context.env.DB.prepare(
      `SELECT is_ai_generated, COUNT(*) as total_count
       FROM master_question_bank
       GROUP BY is_ai_generated`
    ).all<{ is_ai_generated: number; total_count: number }>();

    return new Response(
      JSON.stringify({
        success: true,
        batchSummary: batchSummary || {},
        assistanceSummary: assistanceSummary.results || [],
        masterComposition: masterComposition.results || [],
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('Error in /api/admin/ai-generation/analytics:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
