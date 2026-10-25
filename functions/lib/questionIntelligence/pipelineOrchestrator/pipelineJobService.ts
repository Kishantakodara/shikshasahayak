// ============================================================
// PIPELINE ORCHESTRATOR - JOB SERVICE
// Manages pipeline job creation, stage state transitions, item-level
// checkpointing, error logging, pause, resume, and cancellation.
// ============================================================

import { Env } from '../../contentEngine';

export interface CreatePipelineJobOptions {
  sourceType: 'GTU' | 'GATE' | 'AI_PRACTICE' | 'MIXED';
  exam?: string;
  session?: string;
  subject?: string;
  subjectCode?: string;
  branchId?: string;
  requestedScope?: 'FULL' | 'DISCOVERY_ONLY' | 'INGEST_ONLY' | 'TRANSFORM_ONLY' | 'VALIDATE_ONLY';
  createdBy?: string;
  metadata?: Record<string, unknown>;
}

export interface PipelineJobRecord {
  id: string;
  job_id: string;
  source_type: string;
  provider: string;
  exam: string;
  session?: string;
  subject?: string;
  subject_code?: string;
  branch_id?: string;
  requested_scope: string;
  current_stage: string;
  status: string;
  total_items: number;
  completed_items: number;
  failed_items: number;
  skipped_items: number;
  retry_count: number;
  max_retries: number;
  started_at: string;
  completed_at?: string;
  last_heartbeat: string;
  error_summary?: string;
  metadata_json?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

const VALID_STATUSES = new Set(['CREATED', 'RUNNING', 'PAUSED', 'COMPLETED', 'FAILED', 'CANCELLED']);
const VALID_STAGES = new Set([
  'DISCOVERY', 'DOWNLOAD', 'EXTRACTION', 'NORMALIZATION',
  'CLASSIFICATION', 'TRANSFORMATION', 'VALIDATION',
  'DUPLICATE_CHECK', 'QUEUE_STAGING', 'FINALIZED'
]);

function normalizeStatus(status?: string): string {
  if (!status) return 'RUNNING';
  const s = status.toUpperCase();
  if (VALID_STATUSES.has(s)) return s;
  if (s === 'QUEUED' || s === 'STAGED') return 'CREATED';
  return 'RUNNING';
}

function normalizeStage(stage?: string): string {
  if (!stage) return 'DISCOVERY';
  const st = stage.toUpperCase();
  if (VALID_STAGES.has(st)) return st;
  if (st === 'DISCOVERING' || st === 'RETRYING' || st === 'QUEUED') return 'DISCOVERY';
  if (st === 'FETCHING' || st === 'DOWNLOADING') return 'DOWNLOAD';
  if (st === 'EXTRACTING') return 'EXTRACTION';
  if (st === 'NORMALIZING') return 'NORMALIZATION';
  if (st === 'STAGING') return 'QUEUE_STAGING';
  if (st === 'COMPLETED' || st === 'FINISHED' || st === 'FAILED' || st === 'CANCELLED' || st === 'PAUSED') return 'FINALIZED';
  return 'DISCOVERY';
}

export async function createPipelineJob(
  env: Env,
  options: CreatePipelineJobOptions
): Promise<PipelineJobRecord> {
  const jobId = `JOB_${new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)}_${crypto.randomUUID().slice(0, 4)}`;

  await env.DB.prepare(
    `INSERT INTO question_pipeline_jobs (
      job_id, source_type, subject_code, requested_scope, trigger_mode,
      current_stage, status, started_at, updated_at
    ) VALUES (?, ?, ?, ?, 'MANUAL', 'DISCOVERY', 'CREATED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
  )
    .bind(
      jobId,
      options.sourceType || 'GTU',
      options.subjectCode || null,
      options.requestedScope || 'FULL'
    )
    .run();

  const record = await env.DB.prepare(`SELECT * FROM question_pipeline_jobs WHERE job_id = ?`)
    .bind(jobId)
    .first<any>();

  return formatJobRecord(record)!;
}

export function formatJobRecord(record: any): PipelineJobRecord | null {
  if (!record) return null;
  return {
    ...record,
    completed_items: record.completed_items ?? record.processed_items ?? 0,
    retry_count: record.retry_count ?? (record.trigger_mode === 'RETRY' || record.trigger_mode === 'RECOVERY' ? 1 : 0),
  };
}

export async function updateJobStage(
  env: Env,
  jobId: string,
  stage: string,
  status: string = 'RUNNING'
): Promise<void> {
  const validStage = normalizeStage(stage);
  const validStatus = normalizeStatus(status);

  await env.DB.prepare(
    `UPDATE question_pipeline_jobs SET
      current_stage = ?, status = ?, updated_at = CURRENT_TIMESTAMP
     WHERE job_id = ?`
  )
    .bind(validStage, validStatus, jobId)
    .run();
}

export async function updateJobProgress(
  env: Env,
  jobId: string,
  stats: { total?: number; completed?: number; failed?: number; skipped?: number }
): Promise<void> {
  await env.DB.prepare(
    `UPDATE question_pipeline_jobs SET
      total_items = COALESCE(?, total_items),
      processed_items = COALESCE(?, processed_items),
      failed_items = COALESCE(?, failed_items),
      updated_at = CURRENT_TIMESTAMP
     WHERE job_id = ?`
  )
    .bind(
      stats.total !== undefined ? stats.total : null,
      stats.completed !== undefined ? stats.completed : null,
      stats.failed !== undefined ? stats.failed : null,
      jobId
    )
    .run();
}

export async function checkpointJobItem(
  env: Env,
  jobId: string,
  itemId: string,
  itemType: 'PAPER' | 'QUESTION',
  stage: string,
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'SKIPPED',
  sourceUrl?: string,
  errorMessage?: string
): Promise<void> {
  const pjiId = `qpc_${crypto.randomUUID().slice(0, 10)}`;

  await env.DB.prepare(
    `INSERT INTO question_pipeline_checkpoints (
      id, job_id, stage_name, last_processed_item_id, items_completed, checkpoint_state_json, created_at
    ) VALUES (?, ?, ?, ?, 1, ?, CURRENT_TIMESTAMP)`
  )
    .bind(pjiId, jobId, normalizeStage(stage), itemId, JSON.stringify({ itemType, status, sourceUrl, errorMessage }))
    .run();
}

export const recordJobItem = checkpointJobItem;

const VALID_ERROR_CATEGORIES = new Set([
  'NETWORK', 'PARSE_FAILURE', 'AI_TRANSFORM_FAILURE',
  'VALIDATION_FAILURE', 'DUPLICATE_REJECT', 'PERMANENT', 'TRANSIENT'
]);

function normalizeErrorCategory(cat?: string): string {
  if (!cat) return 'PERMANENT';
  const c = cat.toUpperCase();
  if (VALID_ERROR_CATEGORIES.has(c)) return c;
  if (c === 'SYSTEM_ERROR' || c === 'PROVIDER_ERROR' || c === 'SOURCE_UNAVAILABLE') return 'NETWORK';
  if (c === 'VALIDATION') return 'VALIDATION_FAILURE';
  if (c === 'DUPLICATE') return 'DUPLICATE_REJECT';
  return 'PERMANENT';
}

export async function logJobError(
  env: Env,
  jobId: string,
  stage: string,
  errorType: 'TRANSIENT' | 'PERMANENT' | 'VALIDATION' | 'DUPLICATE' | 'SOURCE_UNAVAILABLE' | 'PROVIDER_ERROR' | 'SYSTEM_ERROR',
  errorMessage: string,
  itemId?: string
): Promise<void> {
  const pjeId = `qpe_${crypto.randomUUID().slice(0, 10)}`;
  const validCategory = normalizeErrorCategory(errorType);

  await env.DB.prepare(
    `INSERT INTO question_pipeline_errors (id, job_id, item_id, stage_name, error_category, error_message, created_at)
     VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
  )
    .bind(pjeId, jobId, itemId || null, normalizeStage(stage), validCategory, errorMessage)
    .run();

  await env.DB.prepare(
    `UPDATE question_pipeline_jobs SET failed_items = failed_items + 1, error_summary = ? WHERE job_id = ?`
  )
    .bind(errorMessage, jobId)
    .run();
}

export async function pausePipelineJob(env: Env, jobId: string): Promise<boolean> {
  const res = await env.DB.prepare(
    `UPDATE question_pipeline_jobs SET status = 'PAUSED', updated_at = CURRENT_TIMESTAMP WHERE job_id = ? AND status = 'RUNNING'`
  )
    .bind(jobId)
    .run();
  return res.success;
}

export async function resumePipelineJob(env: Env, jobId: string): Promise<boolean> {
  const res = await env.DB.prepare(
    `UPDATE question_pipeline_jobs SET status = 'RUNNING', updated_at = CURRENT_TIMESTAMP WHERE job_id = ? AND status = 'PAUSED'`
  )
    .bind(jobId)
    .run();
  return res.success;
}

export async function cancelPipelineJob(env: Env, jobId: string): Promise<boolean> {
  const res = await env.DB.prepare(
    `UPDATE question_pipeline_jobs SET status = 'CANCELLED', current_stage = 'FINALIZED', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE job_id = ?`
  )
    .bind(jobId)
    .run();
  return res.success;
}

export async function getPipelineJobDetail(env: Env, jobId: string): Promise<PipelineJobRecord | null> {
  const row = await env.DB.prepare(`SELECT * FROM question_pipeline_jobs WHERE job_id = ?`).bind(jobId).first<any>();
  return formatJobRecord(row);
}
