// ============================================================
// ADMIN API: GET /api/admin/question-intelligence/content-overview
// Operational Content & Extraction Pipeline Metrics (Real SSoT Data)
// ============================================================

import { getAuthenticatedUser, isAdmin } from '../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../lib/json';

export async function onRequestGet(context: { request: Request; env: any }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
    if (!isAdmin(user.email, user.role) && user.role !== "admin" && user.role !== "teacher") {
      return errorResponse('Forbidden: Admin access required', 403);
    }

    const db = context.env.DB;
    if (!db) {
      return errorResponse('Database binding not configured', 500);
    }

    // 1. Ingestion Queue Metrics
    let queueStats = {
      totalSourcesSubmitted: 0,
      sourcesAwaitingExtraction: 0,
      questionsExtracted: 0,
      questionsRequiringReview: 0,
      questionsApproved: 0,
      failedOrBlockedJobs: 0,
    };

    try {
      const qRow = await db.prepare(
        `SELECT
          COUNT(*) as total_queue_items,
          SUM(CASE WHEN processing_status IN ('staged', 'pending') THEN 1 ELSE 0 END) as awaiting_extraction,
          SUM(CASE WHEN processing_status = 'needs_review' THEN 1 ELSE 0 END) as requiring_review,
          SUM(CASE WHEN processing_status = 'approved' THEN 1 ELSE 0 END) as approved_count,
          SUM(CASE WHEN processing_status IN ('failed', 'rejected') THEN 1 ELSE 0 END) as failed_jobs
         FROM question_ingestion_queue`
      ).first<Record<string, number>>();

      if (qRow) {
        queueStats.totalSourcesSubmitted = Number(qRow.total_queue_items || 0);
        queueStats.sourcesAwaitingExtraction = Number(qRow.awaiting_extraction || 0);
        queueStats.questionsExtracted = Number(qRow.total_queue_items || 0);
        queueStats.questionsRequiringReview = Number(qRow.requiring_review || 0);
        queueStats.questionsApproved = Number(qRow.approved_count || 0);
        queueStats.failedOrBlockedJobs = Number(qRow.failed_jobs || 0);
      }
    } catch (e) {
      console.warn('Queue metrics fallback query:', e);
    }

    // 2. Master Question Bank Published & Duplicate Metrics
    let bankStats = {
      questionsPublished: 0,
      duplicateQuestionsDetected: 0,
      gateQuestionsCount: 0,
      gtuQuestionsCount: 0,
      mcqCount: 0,
      msqCount: 0,
      natCount: 0,
    };

    try {
      const bRow = await db.prepare(
        `SELECT
          COUNT(*) as total_in_bank,
          SUM(CASE WHEN verification_status = 'verified' THEN 1 ELSE 0 END) as verified_count,
          SUM(CASE WHEN parent_question_id IS NOT NULL THEN 1 ELSE 0 END) as duplicate_count,
          SUM(CASE WHEN exam_name LIKE '%GATE%' OR source_type = 'GATE' THEN 1 ELSE 0 END) as gate_count,
          SUM(CASE WHEN exam_name LIKE '%GTU%' OR source_type = 'GTU' THEN 1 ELSE 0 END) as gtu_count,
          SUM(CASE WHEN question_type IN ('MCQ', 'SINGLE_CORRECT') THEN 1 ELSE 0 END) as mcq_count,
          SUM(CASE WHEN question_type IN ('MSQ', 'MULTIPLE_CORRECT') THEN 1 ELSE 0 END) as msq_count,
          SUM(CASE WHEN question_type IN ('NAT', 'NUMERICAL') THEN 1 ELSE 0 END) as nat_count
         FROM master_question_bank`
      ).first<Record<string, number>>();

      if (bRow) {
        bankStats.questionsPublished = Number(bRow.verified_count || 0);
        bankStats.duplicateQuestionsDetected = Number(bRow.duplicate_count || 0);
        bankStats.gateQuestionsCount = Number(bRow.gate_count || 0);
        bankStats.gtuQuestionsCount = Number(bRow.gtu_count || 0);
        bankStats.mcqCount = Number(bRow.mcq_count || 0);
        bankStats.msqCount = Number(bRow.msq_count || 0);
        bankStats.natCount = Number(bRow.nat_count || 0);
      }
    } catch (e) {
      console.warn('Bank metrics fallback query:', e);
    }

    // 3. Duplicate clusters count
    try {
      const clusterRow = await db.prepare(
        `SELECT COUNT(*) as clusters FROM question_duplicate_clusters`
      ).first<{ clusters: number }>();
      if (clusterRow && clusterRow.clusters > 0) {
        bankStats.duplicateQuestionsDetected = Math.max(bankStats.duplicateQuestionsDetected, Number(clusterRow.clusters));
      }
    } catch {}

    return jsonResponse({
      success: true,
      data: {
        totalSourcesSubmitted: queueStats.totalSourcesSubmitted,
        sourcesAwaitingExtraction: queueStats.sourcesAwaitingExtraction,
        questionsExtracted: queueStats.questionsExtracted + bankStats.questionsPublished,
        questionsRequiringReview: queueStats.questionsRequiringReview,
        questionsApproved: queueStats.questionsApproved,
        questionsPublished: bankStats.questionsPublished,
        duplicateQuestionsDetected: bankStats.duplicateQuestionsDetected,
        failedOrBlockedJobs: queueStats.failedOrBlockedJobs,
        breakdown: {
          gateQuestionsCount: bankStats.gateQuestionsCount,
          gtuQuestionsCount: bankStats.gtuQuestionsCount,
          mcqCount: bankStats.mcqCount,
          msqCount: bankStats.msqCount,
          natCount: bankStats.natCount,
        },
      },
    });
  } catch (err: any) {
    console.error('Error in /api/admin/question-intelligence/content-overview:', err);
    return errorResponse(err.message || 'Internal Server Error', 500);
  }
}
