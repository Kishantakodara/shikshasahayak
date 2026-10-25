// ============================================================
// PIPELINE ORCHESTRATOR - METRICS SERVICE
// Aggregates pipeline metrics, stage statistics, throughput, and error rates.
// ============================================================

import { Env } from '../../contentEngine';

export interface PipelineOverallMetrics {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  runningJobs: number;
  pausedJobs: number;
  totalQuestionsExtracted: number;
  totalAiTransformations: number;
  totalValidationPassed: number;
  totalDuplicatesDetected: number;
  totalStaged: number;
}

export async function getPipelineOverallMetrics(env: Env): Promise<PipelineOverallMetrics> {
  const jobsRes = await env.DB.prepare(
    `SELECT status, COUNT(*) as count FROM question_pipeline_jobs GROUP BY status`
  ).all<{ status: string; count: number }>();

  const counts: Record<string, number> = {};
  for (const r of jobsRes.results || []) {
    counts[r.status] = r.count;
  }

  const qStats = await env.DB.prepare(
    `SELECT
      COUNT(*) as total,
      SUM(CASE WHEN is_ai_generated = 1 THEN 1 ELSE 0 END) as ai_count,
      SUM(CASE WHEN verification_status = 'verified' THEN 1 ELSE 0 END) as verified_count
     FROM master_question_bank`
  ).first<{ total: number; ai_count: number; verified_count: number }>();

  return {
    totalJobs: (jobsRes.results || []).reduce((acc, curr) => acc + curr.count, 0),
    completedJobs: counts['COMPLETED'] || 0,
    failedJobs: counts['FAILED'] || 0,
    runningJobs: counts['RUNNING'] || 0,
    pausedJobs: counts['PAUSED'] || 0,
    totalQuestionsExtracted: qStats?.total || 0,
    totalAiTransformations: qStats?.ai_count || 0,
    totalValidationPassed: qStats?.verified_count || 0,
    totalDuplicatesDetected: 0,
    totalStaged: qStats?.total || 0,
  };
}

export async function getPipelineJobItems(
  env: Env,
  jobId: string
): Promise<Record<string, unknown>[]> {
  const { results } = await env.DB.prepare(
    `SELECT * FROM question_pipeline_checkpoints WHERE job_id = ? ORDER BY created_at DESC`
  ).bind(jobId).all<Record<string, unknown>>();

  return (results || []).map(r => {
    let parsedState: any = {};
    if (r.checkpoint_state_json) {
      try { parsedState = JSON.parse(String(r.checkpoint_state_json)); } catch {}
    }
    return {
      ...r,
      item_id: r.last_processed_item_id,
      item_type: parsedState.itemType || 'QUESTION',
      status: parsedState.status || 'SUCCESS',
      source_url: parsedState.sourceUrl,
      error_message: parsedState.errorMessage,
    };
  });
}

export async function getPipelineJobErrors(
  env: Env,
  jobId: string
): Promise<Record<string, unknown>[]> {
  const { results } = await env.DB.prepare(
    `SELECT * FROM question_pipeline_errors WHERE job_id = ? ORDER BY created_at DESC`
  ).bind(jobId).all<Record<string, unknown>>();

  return (results || []).map(r => ({
    ...r,
    error_type: r.error_category,
  }));
}

export async function listPipelineJobs(
  env: Env,
  limit: number = 20,
  offset: number = 0
): Promise<{ jobs: Record<string, unknown>[]; total: number }> {
  const { results } = await env.DB.prepare(
    `SELECT * FROM question_pipeline_jobs ORDER BY started_at DESC LIMIT ? OFFSET ?`
  ).bind(limit, offset).all<Record<string, unknown>>();

  const countRes = await env.DB.prepare(`SELECT COUNT(*) as total FROM question_pipeline_jobs`).first<{ total: number }>();

  return {
    jobs: results || [],
    total: countRes?.total || 0,
  };
}
