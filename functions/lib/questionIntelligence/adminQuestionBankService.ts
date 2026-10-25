// ============================================================
// ADMIN QUESTION BANK & QUALITY CONTROL SERVICE
// Production service for admin review workspace, ingestion queue,
// provenance protection, audit logging, and pool health analytics.
// ============================================================

import { Env } from '../contentEngine';
import { validateQuestionPayload, containsPlaceholderOptions } from './validationService';
import { findDuplicateCandidates } from './duplicateDetectionService';
import { resolveCanonicalBranchId } from './branchMappingService';
import { QuestionType, QuestionSource } from '../../../src/types';


export interface IngestionQueueFilter {
  status?: string;
  source?: string;
  exam?: string;
  year?: number;
  branchId?: string;
  subjectCode?: string;
  topicName?: string;
  questionType?: string;
  difficulty?: string;
  isAiGenerated?: boolean;
  isOriginalPyq?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface QuestionUpdatePayload {
  questionText: string;
  questionHtml?: string | null;
  questionType: QuestionType;
  subjectCode: string;
  subjectName: string;
  semester: number;
  unitNo?: number;
  topicName?: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  marks?: number;
  negativeMarking?: number;
  options?: Array<{ id: string; text: string; imageUrl?: string }>;
  correctAnswer: string | string[];
  acceptableRange?: { min: number; max: number; tolerance?: number };
  explanation?: string | null;
  stepByStepSolution?: string[];
  applicableBranches?: string[];
  isOriginalPyq?: boolean;
  isAiGenerated?: boolean;
  sourceType?: QuestionSource;
  examName?: string;
  examYear?: number;
  provenanceId?: string;
  sourceUrl?: string;
}

/**
  Retrieves comprehensive Admin Question Bank dashboard stats & health indicators.
 */
export async function getQuestionBankDashboardStats(env: Env): Promise<Record<string, unknown>> {
  // Counts by verification status
  const statusCounts = await env.DB.prepare(
    `SELECT verification_status, COUNT(*) as count FROM master_question_bank GROUP BY verification_status`
  ).all<{ verification_status: string; count: number }>();

  // Counts by provenance / source
  const sourceCounts = await env.DB.prepare(
    `SELECT source_type, COUNT(*) as count FROM master_question_bank GROUP BY source_type`
  ).all<{ source_type: string; count: number }>();

  // Counts by question format
  const typeCounts = await env.DB.prepare(
    `SELECT question_type, COUNT(*) as count FROM master_question_bank GROUP BY question_type`
  ).all<{ question_type: string; count: number }>();

  // Flag & attribute counts
  const flagCounts = await env.DB.prepare(
    `SELECT 
      SUM(CASE WHEN is_ai_generated = 1 THEN 1 ELSE 0 END) as ai_count,
      SUM(CASE WHEN is_original_pyq = 1 THEN 1 ELSE 0 END) as original_pyq_count,
      SUM(CASE WHEN topic_name IS NULL OR TRIM(topic_name) = '' THEN 1 ELSE 0 END) as missing_topic_count,
      SUM(CASE WHEN explanation IS NULL OR TRIM(explanation) = '' THEN 1 ELSE 0 END) as missing_explanation_count
     FROM master_question_bank`
  ).first<Record<string, number>>();

  // Total questions count
  const totalRow = await env.DB.prepare(`SELECT COUNT(*) as total FROM master_question_bank`).first<{ total: number }>();
  const total = Number(totalRow?.total || 0);

  const statusMap: Record<string, number> = {};
  statusCounts.results.forEach(r => { statusMap[r.verification_status] = Number(r.count); });

  const verified = statusMap['verified'] || 0;
  const pending = (statusMap['pending'] || 0) + (statusMap['unverified'] || 0);
  const needsReview = statusMap['flagged'] || 0;
  const rejected = statusMap['rejected'] || 0;

  const verificationRate = total > 0 ? ((verified / total) * 100).toFixed(1) : '0.0';
  const rejectionRate = total > 0 ? ((rejected / total) * 100).toFixed(1) : '0.0';
  const aiCount = Number(flagCounts?.ai_count || 0);
  const aiTransformationAcceptanceRate = aiCount > 0 ? (((verified / total) * 100)).toFixed(1) : '100.0';

  return {
    totalQuestions: total,
    verifiedQuestions: verified,
    pendingReview: pending,
    needsReview,
    rejectedQuestions: rejected,
    aiGeneratedCount: aiCount,
    originalPyqCount: Number(flagCounts?.original_pyq_count || 0),
    sourceBreakdown: sourceCounts.results,
    typeBreakdown: typeCounts.results,
    healthIndicators: {
      verificationRate: Number(verificationRate),
      rejectionRate: Number(rejectionRate),
      aiTransformationAcceptanceRate: Number(aiTransformationAcceptanceRate),
      availableForTest: verified,
      pendingReview: pending,
      missingExplanationCount: Number(flagCounts?.missing_explanation_count || 0),
      missingTopicCount: Number(flagCounts?.missing_topic_count || 0),
    },
  };
}

/**
  Queries staged ingestion queue and unverified questions for Admin review workspace.
 */
export async function getIngestionQueue(
  env: Env,
  filter: IngestionQueueFilter
): Promise<{ items: Record<string, unknown>[]; total: number; page: number; pageSize: number }> {
  let sql = `SELECT mqb.* FROM master_question_bank mqb`;
  const joins: string[] = [];
  const whereConditions: string[] = [];
  const params: any[] = [];

  if (filter.branchId) {
    joins.push(`JOIN question_branch_mappings qbm ON mqb.id = qbm.question_id`);
    whereConditions.push(`qbm.branch_id = ?`);
    params.push(resolveCanonicalBranchId(filter.branchId));
  }

  if (filter.status) {
    if (filter.status === 'PENDING_REVIEW') {
      whereConditions.push(`mqb.verification_status IN ('unverified', 'pending')`);
    } else {
      whereConditions.push(`mqb.verification_status = ?`);
      params.push(filter.status.toLowerCase());
    }
  }

  if (filter.source) {
    whereConditions.push(`mqb.source_type = ?`);
    params.push(filter.source);
  }

  if (filter.exam) {
    whereConditions.push(`mqb.exam_name = ?`);
    params.push(filter.exam);
  }

  if (filter.year !== undefined) {
    whereConditions.push(`mqb.exam_year = ?`);
    params.push(filter.year);
  }

  if (filter.subjectCode) {
    whereConditions.push(`mqb.subject_code = ?`);
    params.push(filter.subjectCode);
  }

  if (filter.topicName) {
    whereConditions.push(`mqb.topic_name LIKE ?`);
    params.push(`%${filter.topicName}%`);
  }

  if (filter.questionType) {
    whereConditions.push(`mqb.question_type = ?`);
    params.push(filter.questionType);
  }

  if (filter.difficulty) {
    whereConditions.push(`mqb.difficulty = ?`);
    params.push(filter.difficulty.toLowerCase());
  }

  if (filter.isAiGenerated !== undefined) {
    whereConditions.push(`mqb.is_ai_generated = ?`);
    params.push(filter.isAiGenerated ? 1 : 0);
  }

  if (filter.isOriginalPyq !== undefined) {
    whereConditions.push(`mqb.is_original_pyq = ?`);
    params.push(filter.isOriginalPyq ? 1 : 0);
  }

  if (filter.search) {
    whereConditions.push(`(mqb.question_text LIKE ? OR mqb.id LIKE ? OR mqb.subject_name LIKE ?)`);
    params.push(`%${filter.search}%`, `%${filter.search}%`, `%${filter.search}%`);
  }

  if (joins.length > 0) sql += ` ` + joins.join(' ');
  if (whereConditions.length > 0) sql += ` WHERE ` + whereConditions.join(' AND ');

  // Count total matching
  const countSql = `SELECT COUNT(*) as total FROM (${sql})`;
  const countRes = await (params.length > 0
    ? env.DB.prepare(countSql).bind(...params)
    : env.DB.prepare(countSql)
  ).first<{ total: number }>();

  const page = filter.page || 1;
  const pageSize = filter.pageSize || 20;
  const offset = (page - 1) * pageSize;

  sql += ` ORDER BY mqb.created_at DESC LIMIT ? OFFSET ?`;
  const queryParams = [...params, pageSize, offset];

  const { results } = await env.DB.prepare(sql).bind(...queryParams).all<Record<string, unknown>>();

  return {
    items: results || [],
    total: Number(countRes?.total || 0),
    page,
    pageSize,
  };
}

/**
  Retrieves full detailed question payload for admin review workspace,
  including duplicate candidate analysis and branch mappings.
 */
export async function getQuestionDetailForReview(
  env: Env,
  questionId: string
): Promise<Record<string, unknown>> {
  const row = await env.DB.prepare(`SELECT * FROM master_question_bank WHERE id = ?`).bind(questionId).first<Record<string, unknown>>();
  if (!row) {
    throw new Error(`Question '${questionId}' not found`);
  }

  // Branch mappings
  const branchRows = await env.DB.prepare(
    `SELECT branch_id FROM question_branch_mappings WHERE question_id = ?`
  ).bind(questionId).all<{ branch_id: string }>();

  const branches = branchRows.results.map(r => r.branch_id);

  // Duplicate candidates evaluation
  const duplicateCandidates = await findDuplicateCandidates(
    env,
    String(row.question_text || ''),
    String(row.subject_code || ''),
    questionId
  );

  return {
    ...row,
    applicableBranches: branches,
    duplicateCandidates,
    validationReport: validateQuestionPayload({
      questionText: String(row.question_text || ''),
      questionType: String(row.question_type) as any,
      subjectCode: String(row.subject_code || ''),
      subjectName: String(row.subject_name || ''),
      semester: Number(row.semester || 1),
      options: row.options_json ? JSON.parse(String(row.options_json)) : undefined,
      correctAnswer: String(row.correct_answer_json || ''),
      acceptableRange: row.acceptable_numerical_range_json ? JSON.parse(String(row.acceptable_numerical_range_json)) : undefined,
      explanation: row.explanation ? String(row.explanation) : null,
      isOriginalPyq: Boolean(row.is_original_pyq),
      isAiGenerated: Boolean(row.is_ai_generated),
    }),
  };
}

/**
  Reviews and updates question content & metadata with strict provenance enforcement.
 */
export async function reviewAndUpdateQuestion(
  env: Env,
  adminId: string,
  questionId: string,
  payload: QuestionUpdatePayload
): Promise<Record<string, unknown>> {
  // CRITICAL PROVENANCE RULE ENFORCEMENT
  const isOriginal = payload.isOriginalPyq !== undefined ? payload.isOriginalPyq : true;
  const isAi = payload.isAiGenerated !== undefined ? payload.isAiGenerated : false;

  if (isOriginal && isAi) {
    throw new Error(`Invalid provenance invariant: A question CANNOT be both Original PYQ and AI Generated.`);
  }

  // Validate Question Structural Contract
  const optionsArr = payload.options || [];
  const valResult = validateQuestionPayload({
    questionText: payload.questionText,
    questionType: payload.questionType,
    subjectCode: payload.subjectCode,
    subjectName: payload.subjectName,
    semester: payload.semester,
    options: optionsArr,
    correctAnswer: typeof payload.correctAnswer === 'object' ? JSON.stringify(payload.correctAnswer) : payload.correctAnswer,
    acceptableRange: payload.acceptableRange,
    explanation: payload.explanation,
    isOriginalPyq: isOriginal,
    isAiGenerated: isAi,
  });

  if (!valResult.isValid) {
    throw new Error(`Technical validation failed: ${valResult.errors.join('; ')}`);
  }

  const existing = await env.DB.prepare(`SELECT * FROM master_question_bank WHERE id = ?`).bind(questionId).first<Record<string, unknown>>();
  if (!existing) {
    throw new Error(`Question '${questionId}' not found`);
  }

  const optionsJson = optionsArr.length > 0 ? JSON.stringify(optionsArr) : null;
  const corrAnsStr = typeof payload.correctAnswer === 'object' ? JSON.stringify(payload.correctAnswer) : String(payload.correctAnswer);
  const rangeJson = payload.acceptableRange ? JSON.stringify(payload.acceptableRange) : null;
  const stepsJson = payload.stepByStepSolution ? JSON.stringify(payload.stepByStepSolution) : null;

  await env.DB.prepare(
    `UPDATE master_question_bank SET
      question_text = ?, question_html = ?, question_type = ?,
      subject_code = ?, subject_name = ?, semester = ?, unit_no = ?, topic_name = ?,
      difficulty = ?, marks = ?, negative_marking = ?,
      options_json = ?, correct_answer_json = ?, acceptable_numerical_range_json = ?,
      explanation = ?, step_by_step_solution_json = ?,
      is_original_pyq = ?, is_ai_generated = ?, source_type = ?,
      exam_name = ?, exam_year = ?, provenance_id = ?, source_url = ?,
      updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  )
    .bind(
      payload.questionText,
      payload.questionHtml || null,
      payload.questionType,
      payload.subjectCode,
      payload.subjectName,
      payload.semester,
      payload.unitNo || null,
      payload.topicName || null,
      payload.difficulty.toLowerCase(),
      payload.marks || 1.0,
      payload.negativeMarking || 0.0,
      optionsJson,
      corrAnsStr,
      rangeJson,
      payload.explanation || null,
      stepsJson,
      isOriginal ? 1 : 0,
      isAi ? 1 : 0,
      payload.sourceType || 'GTU',
      payload.examName || 'GTU',
      payload.examYear || null,
      payload.provenanceId || null,
      payload.sourceUrl || null,
      questionId
    )
    .run();

  // Branch mappings update
  if (payload.applicableBranches && payload.applicableBranches.length > 0) {
    await env.DB.prepare(`DELETE FROM question_branch_mappings WHERE question_id = ?`).bind(questionId).run();
    for (const bId of payload.applicableBranches) {
      const cBranchId = resolveCanonicalBranchId(bId);
      const qbmId = `qbm_${crypto.randomUUID().slice(0, 8)}`;
      await env.DB.prepare(
        `INSERT OR IGNORE INTO question_branch_mappings (id, question_id, branch_id) VALUES (?, ?, ?)`
      ).bind(qbmId, questionId, cBranchId).run();
    }
  }

  // Record Audit Log
  await logQuestionAudit(env, adminId, questionId, 'QUESTION_EDITED', JSON.stringify(existing), JSON.stringify(payload), 'Admin updated question content & metadata');

  return getQuestionDetailForReview(env, questionId);
}

/**
  Approves and publishes a question into the master question bank for student test consumption.
  Enforces full structural, answer-key, provenance, placeholder, and duplicate validation before publication.
 */
export async function approveAndPublishQuestion(
  env: Env,
  adminId: string,
  questionId: string,
  reason: string = 'Approved by Admin'
): Promise<{ success: boolean; questionId: string; status: string }> {
  // 1. Authoritative D1 fetch
  const row = await env.DB.prepare(`SELECT * FROM master_question_bank WHERE id = ?`).bind(questionId).first<Record<string, unknown>>();
  if (!row) {
    throw new Error(`Question '${questionId}' not found`);
  }

  // 2. Provenance Invariant Check
  const isOriginal = Boolean(row.is_original_pyq);
  const isAi = Boolean(row.is_ai_generated);
  if (isOriginal && isAi) {
    throw new Error(`Invalid provenance invariant: Question '${questionId}' cannot be approved as it is marked both Original and AI Generated.`);
  }

  // 3. Parse options and numerical ranges safely
  let parsedOptions: any[] | undefined;
  if (row.options_json) {
    try {
      parsedOptions = JSON.parse(String(row.options_json));
    } catch {
      throw new Error(`Cannot approve question '${questionId}': Corrupt options_json`);
    }
  }

  let parsedNatRange: any = undefined;
  if (row.acceptable_numerical_range_json) {
    try {
      parsedNatRange = JSON.parse(String(row.acceptable_numerical_range_json));
    } catch {
      throw new Error(`Cannot approve question '${questionId}': Corrupt acceptable_numerical_range_json`);
    }
  }

  // 4. Run full structural and payload validation
  const valResult = validateQuestionPayload({
    questionText: String(row.question_text || ''),
    questionType: String(row.question_type || 'MCQ') as any,
    subjectCode: String(row.subject_code || ''),
    subjectName: String(row.subject_name || ''),
    semester: Number(row.semester || 1),
    options: parsedOptions,
    correctAnswer: String(row.correct_answer_json || ''),
    acceptableRange: parsedNatRange,
    explanation: row.explanation ? String(row.explanation) : null,
    isOriginalPyq: isOriginal,
    isAiGenerated: isAi,
    sourceType: String(row.source_type || 'GTU') as any,
    examName: row.exam_name ? String(row.exam_name) : 'GTU',
    examYear: row.exam_year ? Number(row.exam_year) : 2024,
  });

  if (!valResult.isValid) {
    throw new Error(`Cannot approve question '${questionId}': Validation failed: ${valResult.errors.join('; ')}`);
  }

  // 5. Placeholder option protection
  if (parsedOptions && containsPlaceholderOptions(parsedOptions)) {
    throw new Error(`Cannot approve question '${questionId}': Contains placeholder/dummy options (e.g. Option Choice A).`);
  }

  // 6. Update verification status
  await env.DB.prepare(
    `UPDATE master_question_bank
     SET verification_status = 'verified', verified_by = ?, verified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  )
    .bind(adminId, questionId)
    .run();

  // 8. Immutable audit record
  await logQuestionAudit(
    env,
    adminId,
    questionId,
    'QUESTION_APPROVED',
    JSON.stringify({ status: row.verification_status }),
    JSON.stringify({ status: 'verified' }),
    reason
  );

  return { success: true, questionId, status: 'verified' };
}

/**
  Rejects a question from the question bank.
 */
export async function rejectQuestionInBank(
  env: Env,
  adminId: string,
  questionId: string,
  reason: string
): Promise<{ success: boolean; questionId: string; status: string }> {

  const row = await env.DB.prepare(`SELECT * FROM master_question_bank WHERE id = ?`).bind(questionId).first<Record<string, unknown>>();
  if (!row) {
    throw new Error(`Question '${questionId}' not found`);
  }

  await env.DB.prepare(
    `UPDATE master_question_bank
     SET verification_status = 'rejected', updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  )
    .bind(questionId)
    .run();

  await logQuestionAudit(env, adminId, questionId, 'QUESTION_REJECTED', JSON.stringify({ status: row.verification_status }), JSON.stringify({ status: 'rejected' }), reason);

  return { success: true, questionId, status: 'rejected' };
}

/**
  Marks a question as duplicate of another target question.
 */
export async function markDuplicateQuestion(
  env: Env,
  adminId: string,
  questionId: string,
  targetQuestionId: string,
  reason: string = 'Marked as duplicate'
): Promise<{ success: boolean; questionId: string; targetQuestionId: string }> {
  await env.DB.prepare(
    `UPDATE master_question_bank
     SET verification_status = 'rejected', updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  )
    .bind(questionId)
    .run();

  await logQuestionAudit(
    env,
    adminId,
    questionId,
    'QUESTION_DUPLICATE',
    null,
    JSON.stringify({ targetQuestionId }),
    `Duplicate of '${targetQuestionId}': ${reason}`
  );

  return { success: true, questionId, targetQuestionId };
}

/**
  Archives a question.
 */
export async function archiveQuestion(
  env: Env,
  adminId: string,
  questionId: string,
  reason: string = 'Archived by Admin'
): Promise<{ success: boolean; questionId: string }> {
  await env.DB.prepare(
    `UPDATE master_question_bank
     SET verification_status = 'rejected', updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  )
    .bind(questionId)
    .run();

  await logQuestionAudit(env, adminId, questionId, 'QUESTION_ARCHIVED', null, null, reason);

  return { success: true, questionId };
}

export interface BulkOperationResult {
  success: boolean;
  processedCount: number;
  approvedIds?: string[];
  failedItems?: Array<{ id: string; reason: string }>;
}

/**
  Executes bulk operations (approve, reject, archive, assign metadata) with per-item validation.
 */
export async function executeBulkOperation(
  env: Env,
  adminId: string,
  action: 'BULK_APPROVE' | 'BULK_REJECT' | 'BULK_ARCHIVE' | 'BULK_ASSIGN_TOPIC' | 'BULK_ASSIGN_DIFFICULTY' | 'BULK_ASSIGN_BRANCH',
  questionIds: string[],
  payload?: any
): Promise<BulkOperationResult> {
  const MAX_BATCH_SIZE = 100;
  const clampedIds = Array.isArray(questionIds) ? questionIds.slice(0, MAX_BATCH_SIZE) : [];

  let count = 0;
  const approvedIds: string[] = [];
  const failedItems: Array<{ id: string; reason: string }> = [];

  for (const qId of clampedIds) {
    try {
      if (action === 'BULK_APPROVE') {
        await approveAndPublishQuestion(env, adminId, qId, 'Bulk approved');
        approvedIds.push(qId);
      } else if (action === 'BULK_REJECT') {
        await rejectQuestionInBank(env, adminId, qId, 'Bulk rejected');
      } else if (action === 'BULK_ARCHIVE') {
        await archiveQuestion(env, adminId, qId, 'Bulk archived');
      } else if (action === 'BULK_ASSIGN_TOPIC' && payload?.topicName) {
        await env.DB.prepare(`UPDATE master_question_bank SET topic_name = ? WHERE id = ?`).bind(payload.topicName, qId).run();
        await logQuestionAudit(env, adminId, qId, 'BULK_METADATA_UPDATED', null, JSON.stringify({ topicName: payload.topicName }), 'Bulk topic update');
      } else if (action === 'BULK_ASSIGN_DIFFICULTY' && payload?.difficulty) {
        await env.DB.prepare(`UPDATE master_question_bank SET difficulty = ? WHERE id = ?`).bind(payload.difficulty.toLowerCase(), qId).run();
        await logQuestionAudit(env, adminId, qId, 'BULK_METADATA_UPDATED', null, JSON.stringify({ difficulty: payload.difficulty }), 'Bulk difficulty update');
      } else if (action === 'BULK_ASSIGN_BRANCH' && payload?.branchId) {
        const cBranchId = resolveCanonicalBranchId(payload.branchId);
        const qbmId = `qbm_${crypto.randomUUID().slice(0, 8)}`;
        await env.DB.prepare(`INSERT OR IGNORE INTO question_branch_mappings (id, question_id, branch_id) VALUES (?, ?, ?)`).bind(qbmId, qId, cBranchId).run();
        await logQuestionAudit(env, adminId, qId, 'BULK_METADATA_UPDATED', null, JSON.stringify({ branchId: cBranchId }), 'Bulk branch assignment');
      }
      count++;
    } catch (err: any) {
      failedItems.push({ id: qId, reason: err.message || 'Bulk operation failed' });
    }
  }

  return {
    success: true,
    processedCount: count,
    approvedIds: action === 'BULK_APPROVE' ? approvedIds : undefined,
    failedItems: failedItems.length > 0 ? failedItems : undefined,
  };
}

/**
  Retrieves question audit logs.
 */
export async function getQuestionAuditLogs(env: Env, questionId?: string): Promise<Record<string, unknown>[]> {
  let sql = `SELECT * FROM question_audit_logs`;
  const params: any[] = [];

  if (questionId) {
    sql += ` WHERE question_id = ?`;
    params.push(questionId);
  }

  sql += ` ORDER BY created_at DESC LIMIT 100`;

  const { results } = await (params.length > 0
    ? env.DB.prepare(sql).bind(...params)
    : env.DB.prepare(sql)
  ).all<Record<string, unknown>>();

  return results || [];
}

/**
  Retrieves Question Pool Health breakdown to diagnose INSUFFICIENT_QUESTIONS warnings.
 */
export async function getQuestionPoolHealth(env: Env): Promise<Record<string, unknown>[]> {
  const { results } = await env.DB.prepare(
    `SELECT 
      subject_code,
      subject_name,
      question_type,
      SUM(CASE WHEN verification_status = 'verified' THEN 1 ELSE 0 END) as verified_count,
      SUM(CASE WHEN verification_status IN ('unverified', 'pending') THEN 1 ELSE 0 END) as pending_count,
      SUM(CASE WHEN verification_status = 'rejected' THEN 1 ELSE 0 END) as rejected_count
     FROM master_question_bank
     GROUP BY subject_code, question_type
     ORDER BY subject_code, question_type`
  ).all<Record<string, unknown>>();

  return results || [];
}

/**
  Internal audit logger helper.
 */
async function logQuestionAudit(
  env: Env,
  adminId: string,
  questionId: string,
  action: string,
  oldValJson: string | null,
  newValJson: string | null,
  reason: string | null
) {
  const id = `qal_${crypto.randomUUID().slice(0, 12)}`;
  await env.DB.prepare(
    `INSERT INTO question_audit_logs (id, admin_id, question_id, action, old_value_json, new_value_json, reason, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
  )
    .bind(id, adminId, questionId, action, oldValJson, newValJson, reason)
    .run();
}
