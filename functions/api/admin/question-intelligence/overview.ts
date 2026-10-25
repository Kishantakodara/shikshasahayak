// ============================================================
// GET /api/admin/question-intelligence/overview
// Executive Health Overview & Operational Intelligence Snapshot
// ============================================================

import { getAuthenticatedUser, isAdmin } from '../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../lib/json';
import { calculateQuestionBankHealth, calculateQuestionBankCoverage } from '../../../lib/questionIntelligence';

export async function onRequestGet(context: { request: Request; env: WorkerBindings }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
    if (!isAdmin(user.email, user.role) && user.role !== "admin" && user.role !== "reviewer") {
      return errorResponse('Forbidden: Admin or Reviewer access required', 403);
    }

    const [health, coverage] = await Promise.all([
      calculateQuestionBankHealth(context.env),
      calculateQuestionBankCoverage(context.env),
    ]);

    // Query real counts from master_question_bank
    const countsRow = await context.env.DB.prepare(
      `SELECT 
        COUNT(*) as total_questions,
        SUM(CASE WHEN verification_status = 'verified' THEN 1 ELSE 0 END) as verified_questions,
        SUM(CASE WHEN verification_status = 'unverified' THEN 1 ELSE 0 END) as staged_questions,
        SUM(CASE WHEN verification_status = 'rejected' THEN 1 ELSE 0 END) as rejected_questions,
        SUM(CASE WHEN verification_status = 'archived' THEN 1 ELSE 0 END) as archived_questions,
        SUM(CASE WHEN is_original_pyq = 1 THEN 1 ELSE 0 END) as original_pyq_count,
        SUM(CASE WHEN is_ai_generated = 1 THEN 1 ELSE 0 END) as ai_generated_count
       FROM master_question_bank`
    ).first<{
      total_questions: number;
      verified_questions: number;
      staged_questions: number;
      rejected_questions: number;
      archived_questions: number;
      original_pyq_count: number;
      ai_generated_count: number;
    }>();

    // Query duplicate cluster count (linked questions in master_question_bank)
    let clusterCount = 0;
    try {
      const clusterRow = await context.env.DB.prepare(
        `SELECT COUNT(*) as cluster_count FROM master_question_bank WHERE parent_question_id IS NOT NULL`
      ).first<{ cluster_count: number }>();
      clusterCount = Number(clusterRow?.cluster_count || 0);
    } catch {
      clusterCount = 0;
    }

    // Query unmapped questions count (missing canonical_subject_id or unit_no)
    let unmappedCount = 0;
    try {
      const unmappedRow = await context.env.DB.prepare(
        `SELECT COUNT(*) as unmapped_count 
         FROM master_question_bank
         WHERE canonical_subject_id IS NULL OR unit_no IS NULL`
      ).first<{ unmapped_count: number }>();
      unmappedCount = Number(unmappedRow?.unmapped_count || 0);
    } catch {
      unmappedCount = 0;
    }

    // Query failed ingestion jobs
    let failedIngestionCount = 0;
    try {
      const failedRow = await context.env.DB.prepare(
        `SELECT COUNT(*) as failed_count FROM question_pipeline_jobs WHERE status = 'FAILED'`
      ).first<{ failed_count: number }>();
      failedIngestionCount = Number(failedRow?.failed_count || 0);
    } catch {
      failedIngestionCount = 0;
    }

    // Query distinct subjects and sessions covered
    const coverageRow = await context.env.DB.prepare(
      `SELECT 
        COUNT(DISTINCT subject_code) as subjects_covered,
        COUNT(DISTINCT exam_session || exam_year) as sessions_covered
       FROM master_question_bank
       WHERE verification_status = 'verified'`
    ).first<{ subjects_covered: number; sessions_covered: number }>();

    // Generate real-time data quality warnings
    const warnings: Array<{
      id: string;
      level: 'CRITICAL' | 'HIGH' | 'NORMAL';
      category: string;
      title: string;
      description: string;
      actionUrl?: string;
    }> = [];

    if (Number(countsRow?.staged_questions || 0) > 50) {
      warnings.push({
        id: 'warn_backlog',
        level: 'HIGH',
        category: 'MODERATION',
        title: 'High Moderation Backlog',
        description: `${countsRow?.staged_questions} staged questions are awaiting moderation review.`,
        actionUrl: '/admin/question-intelligence?tab=moderation',
      });
    }

    if (unmappedCount > 0) {
      warnings.push({
        id: 'warn_unmapped',
        level: 'NORMAL',
        category: 'CURRICULUM',
        title: 'Unmapped Curriculum Topics',
        description: `${unmappedCount} questions lack verified curriculum unit/topic mappings.`,
        actionUrl: '/admin/question-intelligence?tab=curriculum',
      });
    }

    if (failedIngestionCount > 0) {
      warnings.push({
        id: 'warn_failed_ingestion',
        level: 'HIGH',
        category: 'INGESTION',
        title: 'Failed GTU Ingestion Jobs',
        description: `${failedIngestionCount} paper extraction jobs encountered errors and require inspection/retry.`,
        actionUrl: '/admin/question-intelligence?tab=operations',
      });
    }

    const totalQ = Number(countsRow?.total_questions || 0);
    const verifiedQ = Number(countsRow?.verified_questions || 0);
    const healthStatus = totalQ === 0
      ? 'INSUFFICIENT_DATA'
      : (health.overallHealthScore >= 75 ? 'HEALTHY' : (health.overallHealthScore >= 50 ? 'WARNING' : 'CRITICAL'));

    return jsonResponse({
      success: true,
      snapshot: {
        healthStatus,
        overallHealthScore: health.overallHealthScore,
        coverageScore: coverage.overallCoveragePercentage,
        qualityScore: health.qualityScore,
        totalQuestions: totalQ,
        verifiedQuestions: verifiedQ,
        stagedQuestions: Number(countsRow?.staged_questions || 0),
        rejectedQuestions: Number(countsRow?.rejected_questions || 0),
        archivedQuestions: Number(countsRow?.archived_questions || 0),
        originalPyqCount: Number(countsRow?.original_pyq_count || 0),
        aiGeneratedCount: Number(countsRow?.ai_generated_count || 0),
        duplicateClusterCount: clusterCount,
        unmappedQuestionCount: unmappedCount,
        failedIngestionCount,
        subjectsCovered: Number(coverageRow?.subjects_covered || 0),
        sessionsCovered: Number(coverageRow?.sessions_covered || 0),
        warnings,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch question intelligence overview', 500);
  }
}
