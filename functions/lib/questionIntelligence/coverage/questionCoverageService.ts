// ============================================================
// QUESTION INTELLIGENCE ENGINE - QUESTION COVERAGE SERVICE
// Centralized, deterministic coverage engine across GTU curriculum,
// historical sessions, branches, and moderation lifecycles.
// ============================================================

import { Env } from '../../contentEngine';
import { GTU_FIRST_YEAR_SUBJECTS, parseGtuSession } from '../gtuIngestion/gtuDiscoveryService';
import {
  SubjectCoverageDetail,
  SessionCoverageDetail,
  SemesterCoverageDetail,
  BranchCoverageDetail,
  QuestionBankCoverageSummary,
} from './coverageTypes';

const FIRST_YEAR_SESSIONS = ['W2024', 'S2024', 'W2023', 'S2023', 'W2022'];

const BRANCH_NAMES: Record<string, string> = {
  branch_07: 'Computer Engineering',
  branch_31: 'Computer Science & Engineering',
  branch_16: 'Information Technology',
  branch_11: 'Electronics & Communication',
  branch_10: 'Electronics Engineering',
  branch_09: 'Electrical Engineering',
  branch_19: 'Mechanical Engineering',
  branch_06: 'Civil Engineering',
  branch_34: 'Robotics & Automation',
  branch_32: 'AI & Data Science',
  branch_05: 'Chemical Engineering',
  branch_17: 'Instrumentation & Control',
  branch_02: 'Automobile Engineering',
};

/**
  Calculates comprehensive, deterministic Question Bank coverage metrics.
 */
export async function calculateQuestionBankCoverage(env: Env): Promise<QuestionBankCoverageSummary> {
  const subjectCoverage: SubjectCoverageDetail[] = [];
  let totalDiscoveredPapers = 0;
  let totalCompletedPapers = 0;
  let totalFailedPapers = 0;
  let totalQuestions = 0;
  let verifiedQuestions = 0;
  let stagedQuestions = 0;
  let pendingQuestions = 0;
  let rejectedQuestions = 0;
  let archivedQuestions = 0;
  let retryBacklogCount = 0;

  // 1. Calculate Staged questions in ingestion queue
  try {
    const queueRow = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM question_ingestion_queue WHERE processing_status = 'staged'`
    ).first<{ count: number }>();
    stagedQuestions = Number(queueRow?.count || 0);
  } catch {
    /* empty */
  }

  // 2. Retry backlog in paper tracker
  try {
    const retryRow = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM gtu_paper_ingestion_tracker WHERE pipeline_status = 'EXTRACTION_FAILED' AND retry_count < max_retry_count`
    ).first<{ count: number }>();
    retryBacklogCount = Number(retryRow?.count || 0);
  } catch {
    /* empty */
  }

  // 3. Subject-wise coverage
  for (const subj of GTU_FIRST_YEAR_SUBJECTS) {
    let papersDiscovered = 0;
    let papersCompleted = 0;
    let papersFailed = 0;

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
          const cnt = Number(row.count || 0);
          papersDiscovered += cnt;
          if (row.pipeline_status === 'COMPLETED') papersCompleted += cnt;
          else if (row.pipeline_status.includes('FAILED')) papersFailed += cnt;
        }
      }
    } catch {
      /* empty */
    }

    totalDiscoveredPapers += papersDiscovered;
    totalCompletedPapers += papersCompleted;
    totalFailedPapers += papersFailed;

    let subQuestionsTotal = 0;
    let mcqCount = 0;
    let msqCount = 0;
    let natCount = 0;
    let descriptiveCount = 0;
    let subVerified = 0;
    let subPending = 0;
    let subRejected = 0;
    let subArchived = 0;
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
          subQuestionsTotal += cnt;

          const qType = String(r.question_type || '').toUpperCase();
          if (qType === 'MCQ' || qType === 'SINGLE_CORRECT') mcqCount += cnt;
          else if (qType === 'MSQ' || qType === 'MULTIPLE_CORRECT') msqCount += cnt;
          else if (qType === 'NAT' || qType === 'NUMERICAL') natCount += cnt;
          else descriptiveCount += cnt;

          const vStat = String(r.verification_status || 'unverified').toLowerCase();
          if (vStat === 'verified') subVerified += cnt;
          else if (vStat === 'rejected') subRejected += cnt;
          else if (vStat === 'archived') subArchived += cnt;
          else subPending += cnt;
        }
      }

      // Check duplicates count
      const dupRow = await env.DB.prepare(
        `SELECT COUNT(*) as cnt FROM master_question_bank WHERE subject_code = ? AND verification_status = 'rejected' AND explanation LIKE '%duplicate%'`
      )
        .bind(subj.code)
        .first<{ cnt: number }>();
      duplicateCount = Number(dupRow?.cnt || 0);
    } catch {
      /* empty */
    }

    totalQuestions += subQuestionsTotal;
    verifiedQuestions += subVerified;
    pendingQuestions += subPending;
    rejectedQuestions += subRejected;
    archivedQuestions += subArchived;

    const coveragePercentage = subQuestionsTotal > 0 ? Number(((subVerified / subQuestionsTotal) * 100).toFixed(1)) : 0;

    subjectCoverage.push({
      subjectCode: subj.code,
      subjectName: subj.name,
      shortName: subj.shortName,
      semester: subj.semester,
      isFirstYearCommon: subj.isFirstYearCommon,
      applicableBranches: subj.applicableBranches,
      papersDiscovered,
      papersCompleted,
      papersFailed,
      questionsTotal: subQuestionsTotal,
      mcqCount,
      msqCount,
      natCount,
      descriptiveCount,
      verifiedCount: subVerified,
      stagedCount: 0,
      pendingCount: subPending,
      rejectedCount: subRejected,
      archivedCount: subArchived,
      duplicateCount,
      coveragePercentage,
    });
  }

  // 4. Session-wise coverage
  const sessionCoverage: SessionCoverageDetail[] = [];
  for (const sessCode of FIRST_YEAR_SESSIONS) {
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

    let sessQuestionsTotal = 0;
    let sessVerified = 0;
    let sessPending = 0;
    let sessRejected = 0;

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
          sessQuestionsTotal += cnt;
          const st = String(r.verification_status || '').toLowerCase();
          if (st === 'verified') sessVerified += cnt;
          else if (st === 'rejected') sessRejected += cnt;
          else sessPending += cnt;
        }
      }
    } catch {
      /* empty */
    }

    const failureRate = papersDiscovered > 0 ? Number(((papersFailed / papersDiscovered) * 100).toFixed(1)) : 0;

    sessionCoverage.push({
      sessionCode: sessCode,
      examYear: parsed.examYear,
      examSession: parsed.examSession,
      papersDiscovered,
      papersCompleted,
      papersFailed,
      questionsTotal: sessQuestionsTotal,
      verifiedCount: sessVerified,
      pendingCount: sessPending,
      rejectedCount: sessRejected,
      failureRate,
    });
  }

  // 5. Semester-wise coverage
  const semesterCoverage: SemesterCoverageDetail[] = [1, 2].map(sem => {
    const subjs = subjectCoverage.filter(s => s.semester === sem);
    const semTotalQ = subjs.reduce((acc, s) => acc + s.questionsTotal, 0);
    const semVerQ = subjs.reduce((acc, s) => acc + s.verifiedCount, 0);
    const semPendQ = subjs.reduce((acc, s) => acc + s.pendingCount, 0);
    return {
      semester: sem,
      subjectsCount: subjs.length,
      totalQuestions: semTotalQ,
      verifiedQuestions: semVerQ,
      pendingQuestions: semPendQ,
      coveragePercentage: semTotalQ > 0 ? Number(((semVerQ / semTotalQ) * 100).toFixed(1)) : 0,
    };
  });

  // 6. Branch-wise coverage
  const branchCoverage: BranchCoverageDetail[] = Object.entries(BRANCH_NAMES).map(([branchId, branchName]) => {
    const applicableSubjs = subjectCoverage.filter(s => s.applicableBranches.includes(branchId));
    const bTotalQ = applicableSubjs.reduce((acc, s) => acc + s.questionsTotal, 0);
    const bVerQ = applicableSubjs.reduce((acc, s) => acc + s.verifiedCount, 0);
    return {
      branchId,
      branchName,
      mappedSubjectsCount: applicableSubjs.length,
      totalQuestions: bTotalQ,
      verifiedQuestions: bVerQ,
    };
  });

  // 7. Duplicate clusters count
  let duplicateClustersCount = 0;
  try {
    const clusterRow = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM question_duplicate_clusters`
    ).first<{ count: number }>();
    duplicateClustersCount = Number(clusterRow?.count || 0);
  } catch {
    /* empty */
  }

  const overallCoveragePercentage = totalQuestions > 0 ? Number(((verifiedQuestions / totalQuestions) * 100).toFixed(1)) : 0;
  const ingestionFailureRate = totalDiscoveredPapers > 0 ? Number(((totalFailedPapers / totalDiscoveredPapers) * 100).toFixed(1)) : 0;
  const moderationBacklogCount = stagedQuestions + pendingQuestions;

  return {
    totalFirstYearSubjects: GTU_FIRST_YEAR_SUBJECTS.length,
    totalHistoricalSessions: FIRST_YEAR_SESSIONS.length,
    totalDiscoveredPapers,
    totalCompletedPapers,
    totalFailedPapers,
    totalQuestions,
    verifiedQuestions,
    stagedQuestions,
    pendingQuestions,
    rejectedQuestions,
    archivedQuestions,
    duplicateClustersCount,
    overallCoveragePercentage,
    moderationBacklogCount,
    ingestionFailureRate,
    retryBacklogCount,
    subjectCoverage,
    sessionCoverage,
    semesterCoverage,
    branchCoverage,
  };
}
