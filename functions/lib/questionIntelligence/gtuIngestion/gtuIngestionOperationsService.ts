// ============================================================
// QUESTION INTELLIGENCE ENGINE - GTU INGESTION OPERATIONS SERVICE
// Scalable, idempotent, resumable batch runner for GTU First-Year
// Question Bank expansion, coverage metrics, and operations dashboard.
// ============================================================

import { Env } from '../../contentEngine';
import {
  GTU_FIRST_YEAR_SUBJECTS,
  getOfficialGtuPaperUrl,
  parseGtuSession,
  GtuPaperMetadata,
} from './gtuDiscoveryService';
import {
  processGtuPaperIngestion,
  INGESTION_LIMITS,
  ExtractedQuestionBlock,
} from './gtuExtractorService';
import { enqueueQuestion } from '../ingestionQueueService';

export interface IngestionPlanOptions {
  subjectCodes?: string[];
  sessionCodes?: string[];
  courseCode?: string;
  maxPapersPerRun?: number;
}

export interface IngestionPlannedPaper {
  paperId: string;
  subjectCode: string;
  subjectName: string;
  semester: number;
  sessionCode: string;
  examYear: number;
  examSession: 'WINTER' | 'SUMMER';
  courseCode: string;
  downloadUrl: string;
  isFirstYearCommon: boolean;
  applicableBranches: string[];
}

export interface IngestionPlan {
  planId: string;
  createdAt: string;
  targetSubjectsCount: number;
  targetSessionsCount: number;
  totalPlannedPapersCount: number;
  papers: IngestionPlannedPaper[];
}

export interface PaperIngestionExecutionResult {
  paperId: string;
  subjectCode: string;
  sessionCode: string;
  status: 'COMPLETED' | 'FAILED' | 'SKIPPED_ALREADY_COMPLETED';
  questionsExtracted: number;
  mcqCount: number;
  msqCount: number;
  natCount: number;
  descriptiveCount: number;
  duplicateCount: number;
  queuedCount: number;
  error?: string;
  isRetryable: boolean;
}

export interface IngestionJobExecutionReport {
  jobId: string;
  startedAt: string;
  finishedAt: string;
  totalPlannedPapers: number;
  attemptedPapersCount: number;
  completedPapersCount: number;
  failedPapersCount: number;
  skippedPapersCount: number;
  totalQuestionsExtracted: number;
  totalMcqs: number;
  totalMsqs: number;
  totalNats: number;
  totalDescriptive: number;
  totalDuplicatesDetected: number;
  totalQueuedQuestions: number;
  paperResults: PaperIngestionExecutionResult[];
}

export interface SubjectCoverageMetric {
  subjectCode: string;
  subjectName: string;
  semester: number;
  papersAttempted: number;
  papersCompleted: number;
  questionsTotal: number;
  mcqCount: number;
  msqCount: number;
  natCount: number;
  descriptiveCount: number;
  verifiedCount: number;
  pendingCount: number;
  rejectedCount: number;
  duplicateCount: number;
}

export interface SessionCoverageMetric {
  sessionCode: string;
  examYear: number;
  examSession: string;
  papersDiscovered: number;
  papersCompleted: number;
  papersFailed: number;
  questionsTotal: number;
  verifiedCount: number;
  pendingCount: number;
}

export interface QuestionTypeBreakdown {
  mcq: number;
  msq: number;
  nat: number;
  descriptive: number;
  total: number;
}

export interface ModerationPipelineMetrics {
  stagedQueueCount: number;
  pendingReviewCount: number;
  verifiedCount: number;
  rejectedCount: number;
  archivedCount: number;
  totalInMasterBank: number;
}

/**
  Generates a structured, deterministic Ingestion Plan for GTU subjects and sessions.
 */
export function generateGtuIngestionPlan(options: IngestionPlanOptions = {}): IngestionPlan {
  const planId = `GIP_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`;
  const targetSubjects: Array<{ code: string; name: string; semester: number; isFirstYearCommon: boolean; applicableBranches: string[] }> = options.subjectCodes && options.subjectCodes.length > 0
    ? options.subjectCodes.map(code => {
        const found = GTU_FIRST_YEAR_SUBJECTS.find(s => s.code === code);
        return found || {
          code,
          name: `GTU Subject ${code}`,
          shortName: code,
          semester: 1,
          isFirstYearCommon: false,
          applicableBranches: ['branch_07'],
        };
      })
    : GTU_FIRST_YEAR_SUBJECTS;

  const targetSessions = options.sessionCodes && options.sessionCodes.length > 0
    ? options.sessionCodes
    : ['W2024', 'S2024', 'W2023', 'S2023', 'W2022'];

  const courseCode = options.courseCode || 'BE';
  const papers: IngestionPlannedPaper[] = [];

  for (const subj of targetSubjects) {
    for (const sessCode of targetSessions) {
      const parsedSess = parseGtuSession(sessCode);
      if (!parsedSess) continue;

      const paperId = `gtu_paper_${sessCode}_${courseCode}_${subj.code}`;
      const downloadUrl = getOfficialGtuPaperUrl(sessCode, subj.code, courseCode);

      papers.push({
        paperId,
        subjectCode: subj.code,
        subjectName: subj.name,
        semester: subj.semester,
        sessionCode: sessCode,
        examYear: parsedSess.examYear,
        examSession: parsedSess.examSession,
        courseCode,
        downloadUrl,
        isFirstYearCommon: subj.isFirstYearCommon,
        applicableBranches: subj.applicableBranches,
      });
    }
  }

  const clampedPapers = options.maxPapersPerRun && options.maxPapersPerRun > 0
    ? papers.slice(0, options.maxPapersPerRun)
    : papers;

  return {
    planId,
    createdAt: new Date().toISOString(),
    targetSubjectsCount: targetSubjects.length,
    targetSessionsCount: targetSessions.length,
    totalPlannedPapersCount: clampedPapers.length,
    papers: clampedPapers,
  };
}

/**
  Executes a planned batch ingestion with per-paper failure isolation,
  idempotency checking, deduplication, and staging queue integration.
 */
export async function executeGtuIngestionPlan(
  env: Env,
  plan: IngestionPlan,
  options: { maxPapersPerRun?: number } = {}
): Promise<IngestionJobExecutionReport> {
  const jobId = `GJOB_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`;
  const startedAt = new Date().toISOString();

  const maxPapers = Math.min(
    options.maxPapersPerRun || INGESTION_LIMITS.MAX_PAPERS_PER_INGESTION_RUN,
    INGESTION_LIMITS.MAX_PAPERS_PER_INGESTION_RUN
  );

  const papersToProcess = plan.papers.slice(0, maxPapers);
  const paperResults: PaperIngestionExecutionResult[] = [];

  let attemptedPapersCount = 0;
  let completedPapersCount = 0;
  let failedPapersCount = 0;
  let skippedPapersCount = 0;
  let totalQuestionsExtracted = 0;
  let totalMcqs = 0;
  let totalMsqs = 0;
  let totalNats = 0;
  let totalDescriptive = 0;
  let totalDuplicatesDetected = 0;
  let totalQueuedQuestions = 0;

  for (const paper of papersToProcess) {
    if (totalQuestionsExtracted >= INGESTION_LIMITS.MAX_QUESTIONS_PER_BATCH) {
      break;
    }

    attemptedPapersCount++;

    // 1. Idempotency check via tracker
    try {
      const existingTracker = await env.DB.prepare(
        `SELECT pipeline_status, retry_count, max_retry_count FROM gtu_paper_ingestion_tracker WHERE paper_id = ?`
      )
        .bind(paper.paperId)
        .first<{ pipeline_status: string; retry_count: number; max_retry_count: number }>();

      if (existingTracker && (existingTracker.pipeline_status === 'COMPLETED' || existingTracker.pipeline_status === 'ALREADY_PROCESSED')) {
        skippedPapersCount++;
        paperResults.push({
          paperId: paper.paperId,
          subjectCode: paper.subjectCode,
          sessionCode: paper.sessionCode,
          status: 'SKIPPED_ALREADY_COMPLETED',
          questionsExtracted: 0,
          mcqCount: 0,
          msqCount: 0,
          natCount: 0,
          descriptiveCount: 0,
          duplicateCount: 0,
          queuedCount: 0,
          isRetryable: false,
        });
        continue;
      }
    } catch {
      // If tracker table read fails gracefully continue
    }

    // 2. Paper Metadata Struct
    const paperMeta: GtuPaperMetadata = {
      paperId: paper.paperId,
      subjectCode: paper.subjectCode,
      subjectName: paper.subjectName,
      semester: paper.semester,
      examName: 'GTU',
      examYear: paper.examYear,
      examSession: paper.examSession,
      sessionCode: paper.sessionCode,
      courseCode: paper.courseCode,
      downloadUrl: paper.downloadUrl,
    };

    // 3. Process Extraction
    try {
      const result = await processGtuPaperIngestion(env, paperMeta);

      if (result.success && result.extractedBlocks.length >= 0) {
        completedPapersCount++;
        const extractedCount = result.extractedBlocks.length;
        totalQuestionsExtracted += extractedCount;

        let pMcq = 0;
        let pMsq = 0;
        let pNat = 0;
        let pDesc = 0;
        let pDup = 0;
        let pQueued = 0;

        for (const block of result.extractedBlocks) {
          if (block.detectedType === 'MCQ') { pMcq++; totalMcqs++; }
          else if (block.detectedType === 'MSQ') { pMsq++; totalMsqs++; }
          else if (block.detectedType === 'NAT') { pNat++; totalNats++; }
          else { pDesc++; totalDescriptive++; }

          if (block.isDuplicateCandidate) {
            pDup++;
            totalDuplicatesDetected++;
          }

          // Enqueue staged question item
          try {
            const rawPayload = JSON.stringify({
              subjectCode: paper.subjectCode,
              subjectName: paper.subjectName,
              semester: paper.semester,
              paperId: paper.paperId,
              sourceUrl: paper.downloadUrl,
              examYear: paper.examYear,
              examSession: paper.examSession,
              questionNo: block.questionNo,
              subQuestionNo: block.subQuestionNo,
              options: block.options,
              detectedType: block.detectedType,
              confidenceScore: block.confidenceScore,
            });

            await enqueueQuestion(env, {
              source: 'GTU_PDF',
              rawPayloadJson: rawPayload,
              extractedQuestionText: block.cleanedText,
              detectedType: block.detectedType,
              confidenceScore: block.confidenceScore,
            });
            pQueued++;
            totalQueuedQuestions++;
          } catch {
            // Queue error containment
          }
        }

        // Update Ingestion Tracker
        try {
          const trackerId = `gpit_${crypto.randomUUID().slice(0, 12)}`;
          await env.DB.prepare(
            `INSERT INTO gtu_paper_ingestion_tracker (
              id, paper_id, source_url, session, year, course, subject_code, subject_name,
              pipeline_status, first_discovered_at, last_checked_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT(paper_id) DO UPDATE SET
              pipeline_status = 'COMPLETED', last_checked_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP`
          )
            .bind(
              trackerId,
              paper.paperId,
              paper.downloadUrl,
              paper.sessionCode,
              paper.examYear,
              paper.courseCode,
              paper.subjectCode,
              paper.subjectName
            )
            .run();
        } catch {
          /* empty */
        }

        paperResults.push({
          paperId: paper.paperId,
          subjectCode: paper.subjectCode,
          sessionCode: paper.sessionCode,
          status: 'COMPLETED',
          questionsExtracted: extractedCount,
          mcqCount: pMcq,
          msqCount: pMsq,
          natCount: pNat,
          descriptiveCount: pDesc,
          duplicateCount: pDup,
          queuedCount: pQueued,
          isRetryable: false,
        });
      } else {
        failedPapersCount++;
        const errorMsg = result.error || 'Paper extraction failed';
        const is404 = errorMsg.includes('404') || errorMsg.includes('Not Found');
        const isRetryable = !is404 && !errorMsg.includes('magic bytes');

        try {
          const trackerId = `gpit_${crypto.randomUUID().slice(0, 12)}`;
          await env.DB.prepare(
            `INSERT INTO gtu_paper_ingestion_tracker (
              id, paper_id, source_url, session, year, course, subject_code, subject_name,
              pipeline_status, last_error, retry_count, first_discovered_at, last_checked_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'EXTRACTION_FAILED', ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT(paper_id) DO UPDATE SET
              pipeline_status = 'EXTRACTION_FAILED', last_error = excluded.last_error,
              retry_count = retry_count + 1, last_checked_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP`
          )
            .bind(
              trackerId,
              paper.paperId,
              paper.downloadUrl,
              paper.sessionCode,
              paper.examYear,
              paper.courseCode,
              paper.subjectCode,
              paper.subjectName,
              errorMsg
            )
            .run();
        } catch {
          /* empty */
        }

        paperResults.push({
          paperId: paper.paperId,
          subjectCode: paper.subjectCode,
          sessionCode: paper.sessionCode,
          status: 'FAILED',
          questionsExtracted: 0,
          mcqCount: 0,
          msqCount: 0,
          natCount: 0,
          descriptiveCount: 0,
          duplicateCount: 0,
          queuedCount: 0,
          error: errorMsg,
          isRetryable,
        });
      }
    } catch (err: any) {
      failedPapersCount++;
      paperResults.push({
        paperId: paper.paperId,
        subjectCode: paper.subjectCode,
        sessionCode: paper.sessionCode,
        status: 'FAILED',
        questionsExtracted: 0,
        mcqCount: 0,
        msqCount: 0,
        natCount: 0,
        descriptiveCount: 0,
        duplicateCount: 0,
        queuedCount: 0,
        error: err.message || 'Unhandled exception in paper ingestion',
        isRetryable: true,
      });
    }
  }

  return {
    jobId,
    startedAt,
    finishedAt: new Date().toISOString(),
    totalPlannedPapers: plan.totalPlannedPapersCount,
    attemptedPapersCount,
    completedPapersCount,
    failedPapersCount,
    skippedPapersCount,
    totalQuestionsExtracted,
    totalMcqs,
    totalMsqs,
    totalNats,
    totalDescriptive,
    totalDuplicatesDetected,
    totalQueuedQuestions,
    paperResults,
  };
}

/**
  Calculates comprehensive Subject Coverage metrics across all first-year subjects.
 */
export async function getSubjectCoverageMetrics(env: Env): Promise<SubjectCoverageMetric[]> {
  const metrics: SubjectCoverageMetric[] = [];

  for (const subj of GTU_FIRST_YEAR_SUBJECTS) {
    // 1. Papers attempted / completed
    let papersAttempted = 0;
    let papersCompleted = 0;

    try {
      const pRows = await env.DB.prepare(
        `SELECT pipeline_status, COUNT(*) as count
         FROM gtu_paper_ingestion_tracker
         WHERE subject_code = ?
         GROUP BY pipeline_status`
      )
        .bind(subj.code)
        .all<{ pipeline_status: string; count: number }>();

      if (pRows.results) {
        for (const row of pRows.results) {
          papersAttempted += Number(row.count || 0);
          if (row.pipeline_status === 'COMPLETED') {
            papersCompleted += Number(row.count || 0);
          }
        }
      }
    } catch {
      /* empty */
    }

    // 2. Questions in Master Bank
    let questionsTotal = 0;
    let mcqCount = 0;
    let msqCount = 0;
    let natCount = 0;
    let descriptiveCount = 0;
    let verifiedCount = 0;
    let pendingCount = 0;
    let rejectedCount = 0;
    let duplicateCount = 0;

    try {
      const qRows = await env.DB.prepare(
        `SELECT question_type, verification_status, COUNT(*) as count
         FROM master_question_bank
         WHERE subject_code = ?
         GROUP BY question_type, verification_status`
      )
        .bind(subj.code)
        .all<{ question_type: string; verification_status: string; count: number }>();

      if (qRows.results) {
        for (const r of qRows.results) {
          const cnt = Number(r.count || 0);
          questionsTotal += cnt;

          const qType = String(r.question_type || '').toUpperCase();
          if (qType === 'MCQ' || qType === 'SINGLE_CORRECT') mcqCount += cnt;
          else if (qType === 'MSQ' || qType === 'MULTIPLE_CORRECT') msqCount += cnt;
          else if (qType === 'NAT' || qType === 'NUMERICAL') natCount += cnt;
          else descriptiveCount += cnt;

          const vStat = String(r.verification_status || 'unverified').toLowerCase();
          if (vStat === 'verified') verifiedCount += cnt;
          else if (vStat === 'rejected') rejectedCount += cnt;
          else pendingCount += cnt;
        }
      }

      // Check duplicates count
      const dupRow = await env.DB.prepare(
        `SELECT COUNT(*) as dup_count FROM master_question_bank WHERE subject_code = ? AND verification_status = 'rejected' AND explanation LIKE '%duplicate%'`
      )
        .bind(subj.code)
        .first<{ dup_count: number }>();

      if (dupRow) duplicateCount = Number(dupRow.dup_count || 0);
    } catch {
      /* empty */
    }

    metrics.push({
      subjectCode: subj.code,
      subjectName: subj.name,
      semester: subj.semester,
      papersAttempted,
      papersCompleted,
      questionsTotal,
      mcqCount,
      msqCount,
      natCount,
      descriptiveCount,
      verifiedCount,
      pendingCount,
      rejectedCount,
      duplicateCount,
    });
  }

  return metrics;
}

/**
  Calculates Session Coverage metrics across supported GTU exam sessions.
 */
export async function getSessionCoverageMetrics(env: Env): Promise<SessionCoverageMetric[]> {
  const sessions = ['W2024', 'S2024', 'W2023', 'S2023', 'W2022'];
  const metrics: SessionCoverageMetric[] = [];

  for (const sessCode of sessions) {
    const parsed = parseGtuSession(sessCode);
    if (!parsed) continue;

    let papersDiscovered = 0;
    let papersCompleted = 0;
    let papersFailed = 0;

    try {
      const pRows = await env.DB.prepare(
        `SELECT pipeline_status, COUNT(*) as count
         FROM gtu_paper_ingestion_tracker
         WHERE session = ?
         GROUP BY pipeline_status`
      )
        .bind(sessCode)
        .all<{ pipeline_status: string; count: number }>();

      if (pRows.results) {
        for (const row of pRows.results) {
          const cnt = Number(row.count || 0);
          papersDiscovered += cnt;
          if (row.pipeline_status === 'COMPLETED') papersCompleted += cnt;
          else if (row.pipeline_status.includes('FAILED')) papersFailed += cnt;
        }
      }
    } catch {
      /* empty */
    }

    let questionsTotal = 0;
    let verifiedCount = 0;
    let pendingCount = 0;

    try {
      const qRows = await env.DB.prepare(
        `SELECT verification_status, COUNT(*) as count
         FROM master_question_bank
         WHERE exam_session = ? AND exam_year = ?
         GROUP BY verification_status`
      )
        .bind(parsed.examSession, parsed.examYear)
        .all<{ verification_status: string; count: number }>();

      if (qRows.results) {
        for (const r of qRows.results) {
          const cnt = Number(r.count || 0);
          questionsTotal += cnt;
          if (r.verification_status === 'verified') verifiedCount += cnt;
          else pendingCount += cnt;
        }
      }
    } catch {
      /* empty */
    }

    metrics.push({
      sessionCode: sessCode,
      examYear: parsed.examYear,
      examSession: parsed.examSession,
      papersDiscovered,
      papersCompleted,
      papersFailed,
      questionsTotal,
      verifiedCount,
      pendingCount,
    });
  }

  return metrics;
}

/**
  Calculates overall Question Type Breakdown in the master database.
 */
export async function getQuestionTypeBreakdown(env: Env): Promise<QuestionTypeBreakdown> {
  let mcq = 0;
  let msq = 0;
  let nat = 0;
  let descriptive = 0;

  try {
    const rows = await env.DB.prepare(
      `SELECT question_type, COUNT(*) as count FROM master_question_bank GROUP BY question_type`
    ).all<{ question_type: string; count: number }>();

    if (rows.results) {
      for (const r of rows.results) {
        const cnt = Number(r.count || 0);
        const qType = String(r.question_type || '').toUpperCase();
        if (qType === 'MCQ' || qType === 'SINGLE_CORRECT') mcq += cnt;
        else if (qType === 'MSQ' || qType === 'MULTIPLE_CORRECT') msq += cnt;
        else if (qType === 'NAT' || qType === 'NUMERICAL') nat += cnt;
        else descriptive += cnt;
      }
    }
  } catch {
    /* empty */
  }

  return {
    mcq,
    msq,
    nat,
    descriptive,
    total: mcq + msq + nat + descriptive,
  };
}

/**
  Calculates Moderation Pipeline breakdown metrics across all question states.
 */
export async function getModerationPipelineMetrics(env: Env): Promise<ModerationPipelineMetrics> {
  let stagedQueueCount = 0;
  let pendingReviewCount = 0;
  let verifiedCount = 0;
  let rejectedCount = 0;
  let archivedCount = 0;
  let totalInMasterBank = 0;

  try {
    const qRow = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM question_ingestion_queue WHERE processing_status = 'staged'`
    ).first<{ count: number }>();
    if (qRow) stagedQueueCount = Number(qRow.count || 0);
  } catch {
    /* empty */
  }

  try {
    const mRows = await env.DB.prepare(
      `SELECT verification_status, COUNT(*) as count FROM master_question_bank GROUP BY verification_status`
    ).all<{ verification_status: string; count: number }>();

    if (mRows.results) {
      for (const r of mRows.results) {
        const cnt = Number(r.count || 0);
        totalInMasterBank += cnt;
        const st = String(r.verification_status || '').toLowerCase();
        if (st === 'verified') verifiedCount += cnt;
        else if (st === 'rejected') rejectedCount += cnt;
        else if (st === 'archived') archivedCount += cnt;
        else pendingReviewCount += cnt;
      }
    }
  } catch {
    /* empty */
  }

  return {
    stagedQueueCount,
    pendingReviewCount,
    verifiedCount,
    rejectedCount,
    archivedCount,
    totalInMasterBank,
  };
}

/**
  Retries eligible failed paper ingestion runs with bounded retries.
 */
export async function retryFailedIngestionPapers(
  env: Env,
  options: { maxPapersToRetry?: number } = {}
): Promise<{ retriedCount: number; recoveredCount: number; failedCount: number }> {
  const maxRetries = Math.min(
    options.maxPapersToRetry || INGESTION_LIMITS.MAX_PAPERS_PER_INGESTION_RUN,
    INGESTION_LIMITS.MAX_PAPERS_PER_INGESTION_RUN
  );

  let retriedCount = 0;
  let recoveredCount = 0;
  let failedCount = 0;

  try {
    const failedRows = await env.DB.prepare(
      `SELECT paper_id, source_url, session, year, course, subject_code, subject_name, retry_count, max_retry_count
       FROM gtu_paper_ingestion_tracker
       WHERE pipeline_status = 'EXTRACTION_FAILED' AND retry_count < max_retry_count
       ORDER BY last_checked_at ASC
       LIMIT ?`
    )
      .bind(maxRetries)
      .all<{
        paper_id: string;
        source_url: string;
        session: string;
        year: number;
        course: string;
        subject_code: string;
        subject_name: string;
        retry_count: number;
        max_retry_count: number;
      }>();

    if (!failedRows.results || failedRows.results.length === 0) {
      return { retriedCount: 0, recoveredCount: 0, failedCount: 0 };
    }

    for (const row of failedRows.results) {
      retriedCount++;
      const parsedSess = parseGtuSession(row.session);

      const paperMeta: GtuPaperMetadata = {
        paperId: row.paper_id,
        subjectCode: row.subject_code,
        subjectName: row.subject_name,
        semester: 1,
        examName: 'GTU',
        examYear: row.year || parsedSess?.examYear || 2024,
        examSession: parsedSess?.examSession || 'WINTER',
        sessionCode: row.session,
        courseCode: row.course || 'BE',
        downloadUrl: row.source_url,
      };

      const res = await processGtuPaperIngestion(env, paperMeta);
      if (res.success) {
        recoveredCount++;
        await env.DB.prepare(
          `UPDATE gtu_paper_ingestion_tracker SET
            pipeline_status = 'COMPLETED', last_error = NULL, last_checked_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
           WHERE paper_id = ?`
        ).bind(row.paper_id).run();
      } else {
        failedCount++;
        await env.DB.prepare(
          `UPDATE gtu_paper_ingestion_tracker SET
            retry_count = retry_count + 1, last_error = ?, last_checked_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
           WHERE paper_id = ?`
        ).bind(res.error || 'Retry failed', row.paper_id).run();
      }
    }
  } catch {
    /* empty */
  }

  return {
    retriedCount,
    recoveredCount,
    failedCount,
  };
}
