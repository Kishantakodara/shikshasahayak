// ============================================================
// QUESTION INTELLIGENCE ENGINE - STUDENT ANALYTICS SERVICE
// Computes student performance metrics, weak topic intelligence,
// test availability estimation, and test history summaries.
// ============================================================

import { Env } from '../contentEngine';
import { TestGenerationConfig, TestSessionState } from '../../../src/types';
import { queryEligibleQuestions } from './testEngine/testGenerationService';
import { resolveCanonicalBranchId } from './branchMappingService';

export interface StudentAnalyticsSummary {
  studentId: string;
  totalTestsCompleted: number;
  totalQuestionsAttempted: number;
  totalCorrectAnswers: number;
  overallAccuracyPercentage: number;
  averageScorePercentage: number;
  bestScorePercentage: number;
  averageTimePerQuestionSeconds: number;
  recentTestSessions: Array<{
    id: string;
    testType: string;
    subjectName?: string | null;
    submittedAt: string;
    obtainedMarks: number;
    totalMarks: number;
    accuracyPercentage: number;
  }>;
  topicBreakdown: Array<{
    topicName: string;
    totalAttempted: number;
    totalCorrect: number;
    accuracyPercentage: number;
  }>;
  difficultyBreakdown: Array<{
    difficulty: string;
    totalAttempted: number;
    totalCorrect: number;
    accuracyPercentage: number;
  }>;
  sourceBreakdown: Array<{
    sourceLabel: string;
    totalAttempted: number;
    totalCorrect: number;
    accuracyPercentage: number;
  }>;
}

export interface WeakTopicIntelligenceItem {
  topicName: string;
  subjectName: string;
  subjectCode?: string | null;
  totalAttempted: number;
  totalCorrect: number;
  accuracyPercentage: number;
  recommendedConfig: TestGenerationConfig;
}

export interface TestHistoryItem {
  id: string;
  testType: string;
  sourceMode: string;
  subjectCode?: string | null;
  subjectName?: string | null;
  topicName?: string | null;
  questionCount: number;
  durationMinutes: number;
  status: TestSessionState;
  startedAt?: string | null;
  submittedAt?: string | null;
  totalMarks: number;
  obtainedMarks: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  accuracyPercentage: number;
  timeTakenSeconds: number;
}

/**
  Checks question availability for a proposed test configuration before creation.
 */
export async function checkTestAvailability(
  env: Env,
  config: TestGenerationConfig
): Promise<{ availableCount: number; isSufficient: boolean; requested: number }> {
  const eligible = await queryEligibleQuestions(env, config);
  return {
    availableCount: eligible.length,
    isSufficient: eligible.length >= config.questionCount,
    requested: config.questionCount,
  };
}

/**
  Computes comprehensive student performance analytics derived from canonical test session data.
 */
export async function getStudentPerformanceAnalytics(
  env: Env,
  studentId: string,
  branchId?: string
): Promise<StudentAnalyticsSummary> {
  const canonicalBranch = branchId ? resolveCanonicalBranchId(branchId) : null;

  // 1. Fetch Submitted Test Sessions
  let sessionSql = `SELECT * FROM test_sessions WHERE student_id = ? AND status IN ('SUBMITTED', 'EXPIRED')`;
  const params: any[] = [studentId];

  if (canonicalBranch) {
    sessionSql += ` AND (branch_id IS NULL OR branch_id = ?)`;
    params.push(canonicalBranch);
  }
  sessionSql += ` ORDER BY submitted_at DESC`;

  const { results: sessions } = await env.DB.prepare(sessionSql).bind(...params).all<Record<string, unknown>>();

  let totalTestsCompleted = (sessions || []).length;
  let totalScoreSum = 0;
  let maxScorePct = 0;

  const recentTestSessions = (sessions || []).slice(0, 5).map(s => {
    const total = Number(s.total_marks || 0);
    const obtained = Number(s.obtained_marks || 0);
    const pct = total > 0 ? Number(((Math.max(0, obtained) / total) * 100).toFixed(1)) : 0;
    if (pct > maxScorePct) maxScorePct = pct;
    totalScoreSum += pct;

    return {
      id: String(s.id),
      testType: String(s.test_type),
      subjectName: s.subject_code ? String(s.subject_code) : null,
      submittedAt: String(s.submitted_at || s.created_at),
      obtainedMarks: obtained,
      totalMarks: total,
      accuracyPercentage: Number(s.accuracy_percentage || 0),
    };
  });

  // Calculate average score percentage
  const averageScorePercentage = totalTestsCompleted > 0 ? Number((totalScoreSum / totalTestsCompleted).toFixed(1)) : 0;

  // 2. Fetch Question-Level Attempts from test_session_questions
  let tsqSql = `
    SELECT tsq.selected_answer, tsq.is_correct, tsq.time_taken_seconds,
           mqb.topic_name, mqb.difficulty, mqb.source_type, mqb.is_original_pyq, mqb.exam_name, mqb.exam_year
    FROM test_session_questions tsq
    JOIN test_sessions ts ON tsq.test_session_id = ts.id
    JOIN master_question_bank mqb ON tsq.question_id = mqb.id
    WHERE ts.student_id = ? AND ts.status IN ('SUBMITTED', 'EXPIRED') AND tsq.selected_answer IS NOT NULL
  `;
  const tsqParams: any[] = [studentId];
  if (canonicalBranch) {
    tsqSql += ` AND (ts.branch_id IS NULL OR ts.branch_id = ?)`;
    tsqParams.push(canonicalBranch);
  }

  const { results: qAttempts } = await env.DB.prepare(tsqSql).bind(...tsqParams).all<Record<string, unknown>>();

  let totalQuestionsAttempted = (qAttempts || []).length;
  let totalCorrectAnswers = 0;
  let totalTimeSecondsSum = 0;

  const topicMap = new Map<string, { total: number; correct: number }>();
  const diffMap = new Map<string, { total: number; correct: number }>();
  const sourceMap = new Map<string, { total: number; correct: number }>();

  for (const q of qAttempts || []) {
    const isCorrect = Boolean(q.is_correct);
    if (isCorrect) totalCorrectAnswers++;
    totalTimeSecondsSum += Number(q.time_taken_seconds || 0);

    const topic = q.topic_name ? String(q.topic_name) : 'General';
    const diff = String(q.difficulty || 'medium').toLowerCase();
    const sourceLabel = Boolean(q.is_original_pyq)
      ? `${q.exam_name || 'PYQ'} ${q.exam_year || ''}`.trim()
      : 'AI Practice';

    const t = topicMap.get(topic) || { total: 0, correct: 0 };
    t.total++;
    if (isCorrect) t.correct++;
    topicMap.set(topic, t);

    const d = diffMap.get(diff) || { total: 0, correct: 0 };
    d.total++;
    if (isCorrect) d.correct++;
    diffMap.set(diff, d);

    const s = sourceMap.get(sourceLabel) || { total: 0, correct: 0 };
    s.total++;
    if (isCorrect) s.correct++;
    sourceMap.set(sourceLabel, s);
  }

  const overallAccuracyPercentage = totalQuestionsAttempted > 0
    ? Number(((totalCorrectAnswers / totalQuestionsAttempted) * 100).toFixed(1))
    : 0;

  const averageTimePerQuestionSeconds = totalQuestionsAttempted > 0
    ? Number((totalTimeSecondsSum / totalQuestionsAttempted).toFixed(1))
    : 0;

  const topicBreakdown = Array.from(topicMap.entries()).map(([topicName, stats]) => ({
    topicName,
    totalAttempted: stats.total,
    totalCorrect: stats.correct,
    accuracyPercentage: Number(((stats.correct / stats.total) * 100).toFixed(1)),
  }));

  const difficultyBreakdown = Array.from(diffMap.entries()).map(([difficulty, stats]) => ({
    difficulty,
    totalAttempted: stats.total,
    totalCorrect: stats.correct,
    accuracyPercentage: Number(((stats.correct / stats.total) * 100).toFixed(1)),
  }));

  const sourceBreakdown = Array.from(sourceMap.entries()).map(([sourceLabel, stats]) => ({
    sourceLabel,
    totalAttempted: stats.total,
    totalCorrect: stats.correct,
    accuracyPercentage: Number(((stats.correct / stats.total) * 100).toFixed(1)),
  }));

  return {
    studentId,
    totalTestsCompleted,
    totalQuestionsAttempted,
    totalCorrectAnswers,
    overallAccuracyPercentage,
    averageScorePercentage,
    bestScorePercentage: maxScorePct,
    averageTimePerQuestionSeconds,
    recentTestSessions,
    topicBreakdown,
    difficultyBreakdown,
    sourceBreakdown,
  };
}

/**
  Identifies student weak topics (accuracy < 60%) from actual test performance data.
 */
export async function getStudentWeakTopics(
  env: Env,
  studentId: string,
  branchId?: string
): Promise<WeakTopicIntelligenceItem[]> {
  const analytics = await getStudentPerformanceAnalytics(env, studentId, branchId);

  // Filter topics with accuracy < 60% and at least 1 attempted question
  const weakTopics = analytics.topicBreakdown
    .filter(t => t.totalAttempted >= 1 && t.accuracyPercentage < 60.0)
    .sort((a, b) => a.accuracyPercentage - b.accuracyPercentage);

  return weakTopics.map(wt => ({
    topicName: wt.topicName,
    subjectName: 'Engineering Mathematics / Core Module',
    totalAttempted: wt.totalAttempted,
    totalCorrect: wt.totalCorrect,
    accuracyPercentage: wt.accuracyPercentage,
    recommendedConfig: {
      testType: 'TOPIC_TEST',
      sourceMode: 'ALL',
      topicName: wt.topicName,
      questionTypes: 'MIXED',
      questionCount: 10,
      durationMinutes: 10,
      negativeMarking: false,
      studentId,
    },
  }));
}

/**
  Retrieves paginated test session history for a student.
 */
export async function getStudentTestHistory(
  env: Env,
  studentId: string,
  options?: { sourceMode?: string; testType?: string; limit?: number }
): Promise<TestHistoryItem[]> {
  let sql = `SELECT * FROM test_sessions WHERE student_id = ?`;
  const params: any[] = [studentId];

  if (options?.sourceMode && options.sourceMode !== 'ALL') {
    sql += ` AND source_mode = ?`;
    params.push(options.sourceMode);
  }

  if (options?.testType) {
    sql += ` AND test_type = ?`;
    params.push(options.testType);
  }

  sql += ` ORDER BY created_at DESC LIMIT ?`;
  params.push(options?.limit || 20);

  const { results } = await env.DB.prepare(sql).bind(...params).all<Record<string, unknown>>();

  return (results || []).map(r => ({
    id: String(r.id),
    testType: String(r.test_type),
    sourceMode: String(r.source_mode || 'ALL'),
    subjectCode: r.subject_code ? String(r.subject_code) : null,
    subjectName: r.subject_name ? String(r.subject_name) : null,
    topicName: r.topic_name ? String(r.topic_name) : null,
    questionCount: Number(r.question_count),
    durationMinutes: Number(r.duration_minutes),
    status: String(r.status) as TestSessionState,
    startedAt: r.started_at ? String(r.started_at) : null,
    submittedAt: r.submitted_at ? String(r.submitted_at) : null,
    totalMarks: Number(r.total_marks || 0),
    obtainedMarks: Number(r.obtained_marks || 0),
    correctCount: Number(r.correct_count || 0),
    incorrectCount: Number(r.incorrect_count || 0),
    unansweredCount: Number(r.unanswered_count || 0),
    accuracyPercentage: Number(r.accuracy_percentage || 0),
    timeTakenSeconds: Number(r.time_taken_seconds || 0),
  }));
}
