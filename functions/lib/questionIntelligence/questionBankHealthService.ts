// ============================================================
// QUESTION INTELLIGENCE ENGINE - QUESTION BANK HEALTH SERVICE
// Overall system health indicator, coverage score, quality aggregation,
// and health snapshot persistence.
// ============================================================

import { Env } from '../contentEngine';
import { calculateQuestionBankCoverage } from './coverage/questionCoverageService';

export interface QuestionBankHealthReport {
  snapshotId: string;
  totalQuestions: number;
  verifiedQuestions: number;
  stagedQuestions: number;
  rejectedQuestions: number;
  archivedQuestions: number;
  duplicateClusters: number;
  overallHealthScore: number; // 0 to 100
  coverageScore: number; // 0 to 100
  qualityScore: number; // 0 to 100
  moderationBacklog: number;
  failureRate: number;
  retryBacklog: number;
  timestamp: string;
}

/**
  Calculates comprehensive Question Bank Health metrics from real database state.
 */
export async function calculateQuestionBankHealth(env: Env): Promise<QuestionBankHealthReport> {
  const coverage = await calculateQuestionBankCoverage(env);

  const total = coverage.totalQuestions;
  const verified = coverage.verifiedQuestions;
  const staged = coverage.stagedQuestions;
  const rejected = coverage.rejectedQuestions;
  const archived = coverage.archivedQuestions;
  const duplicateClusters = coverage.duplicateClustersCount;
  const failureRate = coverage.ingestionFailureRate;
  const retryBacklog = coverage.retryBacklogCount;
  const moderationBacklog = coverage.moderationBacklogCount;

  // 1. Coverage Score (0-100)
  const coverageScore = coverage.overallCoveragePercentage;

  // 2. Aggregate Quality Score (sample from master_question_bank)
  let qualityScore = 85.0;
  try {
    const qCountRow = await env.DB.prepare(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN explanation IS NOT NULL AND LENGTH(TRIM(explanation)) > 10 THEN 1 ELSE 0 END) as with_exp,
        SUM(CASE WHEN topic_name IS NOT NULL AND LENGTH(TRIM(topic_name)) > 0 THEN 1 ELSE 0 END) as with_top
       FROM master_question_bank WHERE verification_status = 'verified'`
    ).first<{ total: number; with_exp: number; with_top: number }>();

    if (qCountRow && Number(qCountRow.total) > 0) {
      const tot = Number(qCountRow.total);
      const expRatio = Number(qCountRow.with_exp) / tot;
      const topRatio = Number(qCountRow.with_top) / tot;
      qualityScore = Number(((expRatio * 50 + topRatio * 50)).toFixed(1));
    }
  } catch {
    /* empty */
  }

  // 3. Overall Health Score (Weighted blend of verification, failure rate, and quality)
  let healthScore = 70.0;
  if (total > 0) {
    const verRate = verified / total;
    const failPenalty = Math.min(25, failureRate * 0.5);
    healthScore = Math.max(10, Math.min(100, Math.round(verRate * 50 + (qualityScore * 0.4) - failPenalty + 10)));
  }

  const snapshotId = `QBHS_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`;
  const now = new Date().toISOString();

  // Save snapshot to D1
  try {
    await env.DB.prepare(
      `INSERT INTO question_bank_health_snapshots (
        id, snapshot_id, total_questions, verified_questions, staged_questions,
        rejected_questions, archived_questions, duplicate_clusters, overall_health_score,
        coverage_score, quality_score, moderation_backlog, failure_rate, retry_backlog,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
    )
      .bind(
        `qbhs_${crypto.randomUUID().slice(0, 12)}`,
        snapshotId,
        total,
        verified,
        staged,
        rejected,
        archived,
        duplicateClusters,
        healthScore,
        coverageScore,
        qualityScore,
        moderationBacklog,
        failureRate,
        retryBacklog
      )
      .run();
  } catch {
    /* empty */
  }

  return {
    snapshotId,
    totalQuestions: total,
    verifiedQuestions: verified,
    stagedQuestions: staged,
    rejectedQuestions: rejected,
    archivedQuestions: archived,
    duplicateClusters,
    overallHealthScore: healthScore,
    coverageScore,
    qualityScore,
    moderationBacklog,
    failureRate,
    retryBacklog,
    timestamp: now,
  };
}
