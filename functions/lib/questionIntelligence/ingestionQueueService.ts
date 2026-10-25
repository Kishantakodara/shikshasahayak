// ============================================================
// QUESTION INTELLIGENCE ENGINE - INGESTION QUEUE SERVICE
// Staging & extraction pipeline service for processing candidate
// questions from GTU PDFs, GATE ZIPs, AI Generators, or Manual Imports.
// ============================================================

import {
  IngestionSource,
  IngestionProcessingStatus,
  QuestionIngestionQueueItem,
  MasterQuestion,
} from '../../../src/types';
import { Env } from '../contentEngine';
import { createQuestion } from './questionService';
import { validateQuestionPayload, validateMasterQuestionPayload, containsPlaceholderOptions } from './validationService';
import { INGESTION_LIMITS } from './gtuIngestion/gtuExtractorService';

export interface EnqueueQuestionPayload {
  source: IngestionSource;
  rawPayloadJson: string;
  extractedQuestionText?: string;
  detectedType?: 'MCQ' | 'MSQ' | 'NAT' | null;
  confidenceScore?: number;
}

export interface IngestionQueueFilters {
  source?: IngestionSource;
  status?: IngestionProcessingStatus;
}

/**
  Pushes a raw extracted question payload into the ingestion staging queue.
  Prevents duplicate queue entries for identical extracted question text and source.
 */
export async function enqueueQuestion(
  env: Env,
  payload: EnqueueQuestionPayload
): Promise<QuestionIngestionQueueItem> {
  const now = new Date().toISOString();

  // Deduplicate queue insertion by matching text & source if already staged/pending/processing
  if (payload.extractedQuestionText) {
    const existing = await env.DB.prepare(
      `SELECT id, source, raw_payload_json, extracted_question_text, detected_type, confidence_score, processing_status, created_at, updated_at
       FROM question_ingestion_queue
       WHERE source = ? AND extracted_question_text = ? AND processing_status IN ('staged', 'processing', 'pending')`
    )
      .bind(payload.source, payload.extractedQuestionText)
      .first<Record<string, unknown>>();

    if (existing) {
      return {
        id: String(existing.id),
        source: String(existing.source) as IngestionSource,
        rawPayloadJson: String(existing.raw_payload_json),
        extractedQuestionText: existing.extracted_question_text ? String(existing.extracted_question_text) : undefined,
        detectedType: existing.detected_type ? (String(existing.detected_type) as any) : undefined,
        confidenceScore: Number(existing.confidence_score || 0),
        processingStatus: String(existing.processing_status) as IngestionProcessingStatus,
        createdAt: String(existing.created_at),
        updatedAt: String(existing.updated_at),
      };
    }
  }

  const queueId = `qiq_${crypto.randomUUID().slice(0, 12)}`;

  await env.DB.prepare(
    `INSERT INTO question_ingestion_queue (
      id, source, raw_payload_json, extracted_question_text,
      detected_type, confidence_score, processing_status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'staged', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
  )
    .bind(
      queueId,
      payload.source,
      payload.rawPayloadJson,
      payload.extractedQuestionText || null,
      payload.detectedType || null,
      payload.confidenceScore || 0.0
    )
    .run();

  return {
    id: queueId,
    source: payload.source,
    rawPayloadJson: payload.rawPayloadJson,
    extractedQuestionText: payload.extractedQuestionText,
    detectedType: payload.detectedType,
    confidenceScore: payload.confidenceScore || 0.0,
    processingStatus: 'staged',
    createdAt: now,
    updatedAt: now,
  };
}

/**
  Fetches queued extraction candidates filtered by source or status with pagination and batch size limits.
 */
export async function getQueuedQuestions(
  env: Env,
  filters?: IngestionQueueFilters,
  pagination?: { limit?: number; offset?: number }
): Promise<{ items: QuestionIngestionQueueItem[]; total: number }> {
  try {
    let sql = `SELECT id, source, raw_payload_json, extracted_question_text,
                      detected_type, confidence_score, processing_status, error_log,
                      created_at, updated_at
               FROM question_ingestion_queue WHERE 1=1`;
    let countSql = `SELECT COUNT(*) AS total FROM question_ingestion_queue WHERE 1=1`;
    const params: any[] = [];

    if (filters?.source) {
      sql += ` AND source = ?`;
      countSql += ` AND source = ?`;
      params.push(filters.source);
    }
    if (filters?.status) {
      sql += ` AND processing_status = ?`;
      countSql += ` AND processing_status = ?`;
      params.push(filters.status);
    }

    const countRow = await env.DB.prepare(countSql).bind(...params).first<{ total: number }>();
    const total = countRow?.total || 0;

    const limit = Math.min(pagination?.limit || 20, INGESTION_LIMITS.MAX_QUEUE_ITEMS_PER_WORKER);
    const offset = pagination?.offset || 0;

    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const queryParams = [...params, limit, offset];

    const { results } = await env.DB.prepare(sql).bind(...queryParams).all<Record<string, unknown>>();

    const items: QuestionIngestionQueueItem[] = (results || []).map(r => ({
      id: String(r.id),
      source: String(r.source) as IngestionSource,
      rawPayloadJson: String(r.raw_payload_json),
      extractedQuestionText: r.extracted_question_text ? String(r.extracted_question_text) : undefined,
      detectedType: r.detected_type ? (String(r.detected_type) as any) : undefined,
      confidenceScore: Number(r.confidence_score || 0),
      processingStatus: String(r.processing_status) as IngestionProcessingStatus,
      errorLog: r.error_log ? String(r.error_log) : undefined,
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    }));

    return { items, total };
  } catch (error) {
    console.error('Error in getQueuedQuestions:', error);
    return { items: [], total: 0 };
  }
}

/**
  Updates processing status and error log of a queue item.
 */
export async function updateQueueStatus(
  env: Env,
  queueId: string,
  status: IngestionProcessingStatus,
  errorLog?: string
): Promise<boolean> {
  try {
    await env.DB.prepare(
      `UPDATE question_ingestion_queue
       SET processing_status = ?, error_log = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
      .bind(status, errorLog || null, queueId)
      .run();

    return true;
  } catch (error) {
    console.error('Error in updateQueueStatus:', error);
    return false;
  }
}

/**
  Approves a queued candidate question payload, converts it into a MasterQuestion record,
  maps target branches, and sets queue status = 'approved'.
  Enforces full validation-before-publish before creating the question.
 */
export async function approveQueuedQuestion(
  env: Env,
  queueId: string,
  verifierId: string,
  targetBranchIds?: string[]
): Promise<{ success: boolean; questionId?: string; error?: string }> {
  try {
    const queueRow = await env.DB.prepare(
      `SELECT id, source, raw_payload_json FROM question_ingestion_queue WHERE id = ?`
    )
      .bind(queueId)
      .first<{ id: string; source: string; raw_payload_json: string }>();

    if (!queueRow) {
      return { success: false, error: `Queue item '${queueId}' not found` };
    }

    let parsedPayload: Partial<MasterQuestion>;
    try {
      parsedPayload = JSON.parse(queueRow.raw_payload_json);
    } catch {
      await updateQueueStatus(env, queueId, 'failed', 'Invalid JSON payload in queue item');
      return { success: false, error: 'Invalid JSON payload in queue item' };
    }

    // Run structural and payload validation
    const valResult = validateMasterQuestionPayload(parsedPayload);
    if (!valResult.isValid) {
      const errDetail = `Validation failed: ${valResult.errors.join('; ')}`;
      await updateQueueStatus(env, queueId, 'failed', errDetail);
      return { success: false, error: errDetail };
    }

    if (parsedPayload.mcqData?.options && containsPlaceholderOptions(parsedPayload.mcqData.options)) {
      const errDetail = 'Rejected approval: Contains placeholder/dummy options';
      await updateQueueStatus(env, queueId, 'failed', errDetail);
      return { success: false, error: errDetail };
    }

    // Set verification metadata
    parsedPayload.verificationStatus = 'verified';
    parsedPayload.verifiedBy = verifierId;
    parsedPayload.verifiedAt = new Date().toISOString();

    const createdQuestion = await createQuestion(env, parsedPayload, targetBranchIds);
    await updateQueueStatus(env, queueId, 'approved');

    return {
      success: true,
      questionId: createdQuestion.id,
    };
  } catch (error: any) {
    console.error('Error in approveQueuedQuestion:', error);
    await updateQueueStatus(env, queueId, 'failed', String(error?.message || error));
    return { success: false, error: String(error?.message || error) };
  }
}

/**
  Rejects a queued candidate question with a reason.
 */
export async function rejectQueuedQuestion(
  env: Env,
  queueId: string,
  verifierId: string,
  reason?: string
): Promise<boolean> {
  const log = reason ? `Rejected by ${verifierId}: ${reason}` : `Rejected by ${verifierId}`;
  return updateQueueStatus(env, queueId, 'rejected', log);
}

/**
  Marks a queue item as failed with error details.
 */
export async function markQueueFailed(
  env: Env,
  queueId: string,
  errorMsg: string
): Promise<boolean> {
  return updateQueueStatus(env, queueId, 'failed', errorMsg);
}
