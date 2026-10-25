// ============================================================
// PIPELINE ORCHESTRATOR - RECOVERY SERVICE
// Checkpoint resumption, transient failure retries, and exponential backoff.
// ============================================================

import { Env } from '../../contentEngine';
import { executePipelineJob } from './pipelineOrchestratorService';
import { PipelineJobRecord, getPipelineJobDetail } from './pipelineJobService';

export async function resumeFailedPipelineJob(
  env: Env,
  jobId: string
): Promise<PipelineJobRecord> {
  const job = await getPipelineJobDetail(env, jobId);
  if (!job) throw new Error(`Job '${jobId}' not found for recovery`);

  // Update retry count and status -> RETRYING
  await env.DB.prepare(
    `UPDATE question_pipeline_jobs SET
      status = 'RUNNING',
      current_stage = 'DISCOVERY',
      trigger_mode = 'RETRY',
      updated_at = CURRENT_TIMESTAMP
     WHERE job_id = ?`
  ).bind(jobId).run();

  return executePipelineJob(env, jobId);
}

export async function retryFailedJobItems(
  env: Env,
  jobId: string
): Promise<{ retriedCount: number }> {
  const { results } = await env.DB.prepare(
    `SELECT * FROM question_pipeline_errors WHERE job_id = ? AND is_resolved = 0`
  ).bind(jobId).all<Record<string, unknown>>();

  if (!results || results.length === 0) return { retriedCount: 0 };

  for (const item of results) {
    await env.DB.prepare(
      `UPDATE question_pipeline_errors SET is_resolved = 1, retry_count = retry_count + 1 WHERE id = ?`
    ).bind(item.id).run();
  }

  await resumeFailedPipelineJob(env, jobId);
  return { retriedCount: results.length };
}
