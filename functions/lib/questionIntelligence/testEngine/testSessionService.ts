// ============================================================
// QUESTION INTELLIGENCE ENGINE - TEST SESSION SERVICE
// Manages test session states (CREATED -> IN_PROGRESS -> SUBMITTED/EXPIRED),
// server-side answer evaluation, score calculation, and result reviews.
// ============================================================

import {
  TestSessionDTO,
  TestResultDTO,
  StudentTestQuestionDTO,
  TestSessionState,
} from '../../../../src/types';
import { Env } from '../../contentEngine';

/**
  Evaluates MSQ answer array match server-side.
 */
function evaluateMsqAnswerMatch(studentAnswer: string, correctAnswersJson: string): boolean {
  let studentSet: string[] = [];
  try {
    const parsed = JSON.parse(studentAnswer);
    if (Array.isArray(parsed)) studentSet = parsed.map(s => String(s).trim());
    else if (typeof studentAnswer === 'string') studentSet = [studentAnswer.trim()];
  } catch {
    if (studentAnswer.trim()) studentSet = [studentAnswer.trim()];
  }

  let correctSet: string[] = [];
  try {
    const parsed = JSON.parse(correctAnswersJson);
    if (Array.isArray(parsed)) correctSet = parsed.map(s => String(s).trim());
    else if (typeof correctAnswersJson === 'string') correctSet = [correctAnswersJson.trim()];
  } catch {
    if (correctAnswersJson.trim()) correctSet = [correctAnswersJson.trim()];
  }

  if (studentSet.length !== correctSet.length) return false;
  const set2 = new Set(correctSet);
  return studentSet.every(item => set2.has(item));
}

/**
  Evaluates NAT numerical answer match server-side.
 */
function evaluateNatAnswerMatch(studentAnswer: string, exactAnswerStr: string, rangeJson?: string): boolean {
  const studentNum = Number(studentAnswer.trim());
  if (isNaN(studentNum)) return false;

  if (rangeJson) {
    try {
      const range = JSON.parse(rangeJson);
      if (range && typeof range === 'object' && range.min !== undefined && range.max !== undefined) {
        return studentNum >= Number(range.min) && studentNum <= Number(range.max);
      }
    } catch {
      /* empty */
    }
  }

  const exactNum = Number(exactAnswerStr.trim());
  if (!isNaN(exactNum)) {
    return Math.abs(studentNum - exactNum) < 0.01;
  }

  return studentAnswer.trim() === exactAnswerStr.trim();
}

/**
  Retrieves an active test session, handling state transitions and time calculations.
 */
export async function getTestSession(
  env: Env,
  sessionId: string,
  studentId?: string,
  isAdmin?: boolean
): Promise<TestSessionDTO> {
  const sessionRow = await env.DB.prepare(
    `SELECT * FROM test_sessions WHERE id = ?`
  )
    .bind(sessionId)
    .first<Record<string, unknown>>();

  if (!sessionRow) {
    throw new Error(`Test session '${sessionId}' not found`);
  }

  // Security Ownership Check
  if (studentId && String(sessionRow.student_id) !== studentId && !isAdmin) {
    throw new Error(`Unauthorized access to test session '${sessionId}'`);
  }

  let currentStatus = String(sessionRow.status) as TestSessionState;
  const nowMs = Date.now();

  // State Transition: CREATED -> IN_PROGRESS on first access
  if (currentStatus === 'CREATED') {
    const startedAt = new Date().toISOString();
    await env.DB.prepare(
      `UPDATE test_sessions SET status = 'IN_PROGRESS', started_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    )
      .bind(startedAt, sessionId)
      .run();
    currentStatus = 'IN_PROGRESS';
    sessionRow.started_at = startedAt;
  }

  // Calculate Remaining Time & Auto-Expire check
  const durationMin = sessionRow.duration_minutes !== undefined && sessionRow.duration_minutes !== null ? Number(sessionRow.duration_minutes) : 20;
  let remainingSeconds = durationMin * 60;


  if (sessionRow.started_at && currentStatus === 'IN_PROGRESS') {
    const startTimeMs = new Date(String(sessionRow.started_at)).getTime();
    const elapsedSeconds = Math.floor((nowMs - startTimeMs) / 1000);
    remainingSeconds = Math.max(0, durationMin * 60 - elapsedSeconds);

    if (remainingSeconds === 0) {
      // Auto-submit expired session
      await submitTestSession(env, sessionId, String(sessionRow.student_id), true);
      currentStatus = 'EXPIRED';
    }
  }

  // Fetch Questions
  const qRows = await env.DB.prepare(
    `SELECT tsq.sequence_number, tsq.marks, tsq.negative_marks, tsq.selected_answer,
            mqb.*
     FROM test_session_questions tsq
     JOIN master_question_bank mqb ON tsq.question_id = mqb.id
     WHERE tsq.test_session_id = ?
     ORDER BY tsq.sequence_number ASC`
  )
    .bind(sessionId)
    .all<Record<string, unknown>>();

  const questions: StudentTestQuestionDTO[] = (qRows.results || []).map(row => {
    let options: Array<{ id: string; text: string }> = [];
    if (row.options_json) {
      try {
        const parsed = JSON.parse(String(row.options_json));
        if (Array.isArray(parsed)) {
          options = parsed.map((o: any, idx: number) => ({
            id: typeof o === 'string' ? String(idx) : String(o.id || idx),
            text: typeof o === 'string' ? o : String(o.text || o.value || ''),
          }));
        }
      } catch {
        /* empty */
      }
    }

    return {
      id: String(row.id),
      sequenceNumber: Number(row.sequence_number),
      questionText: String(row.question_text || ''),
      questionHtml: row.question_html ? String(row.question_html) : null,
      questionImageUrl: row.question_image_url ? String(row.question_image_url) : null,
      questionType: String(row.question_type || 'MCQ') as any,
      options,
      marks: Number(row.marks || 1.0),
      negativeMarks: Number(row.negative_marks || 0.0),
      subjectName: String(row.subject_name || ''),
      topicName: row.topic_name ? String(row.topic_name) : null,
      sourceType: String(row.source_type || 'OTHER') as any,
      isOriginalPyq: Boolean(row.is_original_pyq),
      isAiGenerated: Boolean(row.is_ai_generated),
      examName: row.exam_name ? String(row.exam_name) : null,
      examYear: row.exam_year ? Number(row.exam_year) : null,
      selectedAnswer: row.selected_answer ? String(row.selected_answer) : null,
      isAnswered: Boolean(row.selected_answer),
    };
  });

  return {
    id: sessionId,
    studentId: String(sessionRow.student_id),
    testType: String(sessionRow.test_type) as any,
    sourceMode: String(sessionRow.source_mode || 'ALL') as any,
    status: currentStatus,
    questionCount: Number(sessionRow.question_count),
    durationMinutes: durationMin,
    remainingSeconds,
    negativeMarking: Boolean(sessionRow.negative_marking),
    negativeMarkValue: Number(sessionRow.negative_mark_value || 0.25),
    startedAt: sessionRow.started_at ? String(sessionRow.started_at) : null,
    submittedAt: sessionRow.submitted_at ? String(sessionRow.submitted_at) : null,
    totalMarks: Number(sessionRow.total_marks || 0.0),
    obtainedMarks: Number(sessionRow.obtained_marks || 0.0),
    questions,
  };
}

/**
  Evaluates and stores a student's answer for a specific test question.
 */
export async function submitQuestionAnswer(
  env: Env,
  sessionId: string,
  studentId: string,
  questionId: string,
  answer: string,
  timeTakenSeconds: number = 0
): Promise<{ success: boolean; isCorrect: boolean; correctAnswer?: string; explanation?: string | null; stepByStepSolution?: string[] }> {
  // Session check
  const sessionRow = await env.DB.prepare(
    `SELECT student_id, status, practice_mode FROM test_sessions WHERE id = ?`
  )
    .bind(sessionId)
    .first<{ student_id: string; status: string; practice_mode?: string }>();

  if (!sessionRow) {
    throw new Error(`Test session '${sessionId}' not found`);
  }
  if (sessionRow.student_id !== studentId) {
    throw new Error(`Unauthorized modification of test session`);
  }
  if (sessionRow.status === 'SUBMITTED' || sessionRow.status === 'EXPIRED' || sessionRow.status === 'ABANDONED') {
    throw new Error(`Cannot modify test session in status '${sessionRow.status}'`);
  }

  // Question check
  const qRow = await env.DB.prepare(
    `SELECT tsq.marks, tsq.negative_marks, mqb.question_type, mqb.correct_answer_json,
            mqb.acceptable_numerical_range_json, mqb.explanation, mqb.step_by_step_solution_json
     FROM test_session_questions tsq
     JOIN master_question_bank mqb ON tsq.question_id = mqb.id
     WHERE tsq.test_session_id = ? AND tsq.question_id = ?`
  )
    .bind(sessionId, questionId)
    .first<Record<string, unknown>>();

  if (!qRow) {
    throw new Error(`Question '${questionId}' is not bound to test session '${sessionId}'`);
  }

  const qType = String(qRow.question_type || 'MCQ').toUpperCase();
  const correctAnswerJson = String(qRow.correct_answer_json || '').trim();
  const rangeJson = qRow.acceptable_numerical_range_json ? String(qRow.acceptable_numerical_range_json) : undefined;

  let isCorrect = false;
  if (qType === 'MCQ' || qType === 'SINGLE_CORRECT') {
    isCorrect = answer.trim() === correctAnswerJson;
  } else if (qType === 'MSQ' || qType === 'MULTIPLE_CORRECT') {
    isCorrect = evaluateMsqAnswerMatch(answer, correctAnswerJson);
  } else if (qType === 'NAT' || qType === 'NUMERICAL') {
    isCorrect = evaluateNatAnswerMatch(answer, correctAnswerJson, rangeJson);
  }

  const marks = Number(qRow.marks || 1.0);
  const negMarks = Number(qRow.negative_marks || 0.0);
  const marksObtained = isCorrect ? marks : answer.trim() ? -negMarks : 0.0;

  await env.DB.prepare(
    `UPDATE test_session_questions
     SET selected_answer = ?, is_correct = ?, marks_obtained = ?, time_taken_seconds = ?, answered_at = CURRENT_TIMESTAMP
     WHERE test_session_id = ? AND question_id = ?`
  )
    .bind(
      answer.trim(),
      isCorrect ? 1 : 0,
      marksObtained,
      timeTakenSeconds,
      sessionId,
      questionId
    )
    .run();

  // Log into student_mcq_attempts for dedicated practice tracking & adaptive mastery
  const attemptId = `att_${crypto.randomUUID().slice(0, 12)}`;
  await env.DB.prepare(
    `INSERT INTO student_mcq_attempts (id, student_id, question_id, selected_option_id, is_correct, time_taken_seconds, created_at)
     VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
  )
    .bind(
      attemptId,
      studentId,
      questionId,
      answer.trim(),
      isCorrect ? 1 : 0,
      timeTakenSeconds
    )
    .run();

  // Async recalculate topic mastery if question belongs to a subject/topic
  const qMeta = await env.DB.prepare(`SELECT subject_code, topic_name FROM master_question_bank WHERE id = ?`)
    .bind(questionId)
    .first<{ subject_code: string; topic_name: string }>();

  if (qMeta && qMeta.subject_code && qMeta.topic_name) {
    try {
      const { recalculateStudentTopicMastery } = await import('../adaptiveEngine/studentMasteryService');
      await recalculateStudentTopicMastery(env, studentId, qMeta.subject_code, qMeta.topic_name);
    } catch {
      // Non-blocking
    }
  }

  const isImmediate = sessionRow.practice_mode === 'IMMEDIATE_PRACTICE';

  let steps: string[] | undefined;
  if (isImmediate && qRow.step_by_step_solution_json) {
    try { steps = JSON.parse(String(qRow.step_by_step_solution_json)); } catch { /* empty */ }
  }

  return {
    success: true,
    isCorrect,
    correctAnswer: isImmediate ? correctAnswerJson : undefined,
    explanation: isImmediate ? (qRow.explanation ? String(qRow.explanation) : null) : undefined,
    stepByStepSolution: isImmediate ? steps : undefined,
  };
}


/**
  Finalizes test submission and calculates final score, accuracy, and topic breakdown.
 */
export async function submitTestSession(
  env: Env,
  sessionId: string,
  studentId: string,
  isExpired: boolean = false
): Promise<TestResultDTO> {
  const sessionRow = await env.DB.prepare(
    `SELECT * FROM test_sessions WHERE id = ?`
  )
    .bind(sessionId)
    .first<Record<string, unknown>>();

  if (!sessionRow) {
    throw new Error(`Test session '${sessionId}' not found`);
  }
  if (String(sessionRow.student_id) !== studentId) {
    throw new Error(`Unauthorized test submission`);
  }
  if (sessionRow.status === 'SUBMITTED' && !isExpired) {
    // Immutable submission - return existing result
    return getTestResult(env, sessionId, studentId);
  }

  // Calculate scores
  const tsqRows = await env.DB.prepare(
    `SELECT tsq.*, mqb.question_type, mqb.correct_answer_json, mqb.acceptable_numerical_range_json,
            mqb.question_text, mqb.explanation, mqb.step_by_step_solution_json,
            mqb.subject_name, mqb.topic_name, mqb.difficulty, mqb.source_type,
            mqb.is_original_pyq, mqb.is_ai_generated, mqb.exam_name, mqb.exam_year
     FROM test_session_questions tsq
     JOIN master_question_bank mqb ON tsq.question_id = mqb.id
     WHERE tsq.test_session_id = ?
     ORDER BY tsq.sequence_number ASC`
  )
    .bind(sessionId)
    .all<Record<string, unknown>>();

  let totalMarksSum = 0;
  let obtainedMarksSum = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;
  let totalTimeSec = 0;

  const topicPerfMap = new Map<string, { total: number; correct: number }>();
  const sourcePerfMap = new Map<string, { total: number; correct: number }>();
  const diffPerfMap = new Map<string, { total: number; correct: number }>();

  for (const row of tsqRows.results || []) {
    const qMarks = Number(row.marks || 1.0);
    totalMarksSum += qMarks;
    totalTimeSec += Number(row.time_taken_seconds || 0);

    const isAns = Boolean(row.selected_answer);
    const isCorr = Boolean(row.is_correct);

    const topic = row.topic_name ? String(row.topic_name) : 'General';
    const source = Boolean(row.is_original_pyq)
      ? `${row.exam_name || 'PYQ'} ${row.exam_year || ''}`.trim()
      : 'AI Practice';
    const diff = String(row.difficulty || 'medium').toLowerCase();

    // Track Topic Performance
    const tStats = topicPerfMap.get(topic) || { total: 0, correct: 0 };
    tStats.total++;

    // Track Source Performance
    const sStats = sourcePerfMap.get(source) || { total: 0, correct: 0 };
    sStats.total++;

    // Track Difficulty Performance
    const dStats = diffPerfMap.get(diff) || { total: 0, correct: 0 };
    dStats.total++;

    if (!isAns) {
      unansweredCount++;
    } else if (isCorr) {
      correctCount++;
      obtainedMarksSum += qMarks;
      tStats.correct++;
      sStats.correct++;
      dStats.correct++;
    } else {
      incorrectCount++;
      const neg = Number(row.negative_marks || 0.0);
      obtainedMarksSum -= neg;
    }

    topicPerfMap.set(topic, tStats);
    sourcePerfMap.set(source, sStats);
    diffPerfMap.set(diff, dStats);
  }

  const finalStatus: TestSessionState = isExpired ? 'EXPIRED' : 'SUBMITTED';
  const totalQuestions = (tsqRows.results || []).length;
  const accuracyPercentage = totalQuestions > 0 ? Number(((correctCount / totalQuestions) * 100).toFixed(1)) : 0.0;
  const percentage = totalMarksSum > 0 ? Number(((Math.max(0, obtainedMarksSum) / totalMarksSum) * 100).toFixed(1)) : 0.0;

  const nowStr = new Date().toISOString();
  await env.DB.prepare(
    `UPDATE test_sessions
     SET status = ?, submitted_at = ?, total_marks = ?, obtained_marks = ?,
         correct_count = ?, incorrect_count = ?, unanswered_count = ?,
         accuracy_percentage = ?, time_taken_seconds = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  )
    .bind(
      finalStatus,
      nowStr,
      totalMarksSum,
      Number(obtainedMarksSum.toFixed(2)),
      correctCount,
      incorrectCount,
      unansweredCount,
      accuracyPercentage,
      totalTimeSec,
      sessionId
    )
    .run();

  return getTestResult(env, sessionId, studentId);
}

/**
  Retrieves full post-test result details including question answers, explanations, and analytics.
 */
export async function getTestResult(
  env: Env,
  sessionId: string,
  studentId: string
): Promise<TestResultDTO> {
  const sessionRow = await env.DB.prepare(
    `SELECT * FROM test_sessions WHERE id = ?`
  )
    .bind(sessionId)
    .first<Record<string, unknown>>();

  if (!sessionRow) {
    throw new Error(`Test session '${sessionId}' not found`);
  }
  if (String(sessionRow.student_id) !== studentId) {
    throw new Error(`Unauthorized access to test results`);
  }

  const tsqRows = await env.DB.prepare(
    `SELECT tsq.*, mqb.question_type, mqb.correct_answer_json, mqb.question_text,
            mqb.explanation, mqb.step_by_step_solution_json, mqb.subject_name,
            mqb.topic_name, mqb.difficulty, mqb.source_type, mqb.is_original_pyq,
            mqb.is_ai_generated, mqb.exam_name, mqb.exam_year
     FROM test_session_questions tsq
     JOIN master_question_bank mqb ON tsq.question_id = mqb.id
     WHERE tsq.test_session_id = ?
     ORDER BY tsq.sequence_number ASC`
  )
    .bind(sessionId)
    .all<Record<string, unknown>>();

  const questionResults = (tsqRows.results || []).map(row => {
    let steps: string[] | undefined;
    if (row.step_by_step_solution_json) {
      try { steps = JSON.parse(String(row.step_by_step_solution_json)); } catch { /* empty */ }
    }

    const sourceLabel = Boolean(row.is_original_pyq)
      ? `${row.exam_name || 'PYQ'} ${row.exam_year || ''}`.trim()
      : 'AI Derived Practice';

    return {
      questionId: String(row.question_id),
      sequenceNumber: Number(row.sequence_number),
      questionText: String(row.question_text || ''),
      questionType: String(row.question_type || 'MCQ') as any,
      selectedAnswer: row.selected_answer ? String(row.selected_answer) : null,
      correctAnswer: String(row.correct_answer_json || ''),
      isCorrect: Boolean(row.is_correct),
      marksObtained: Number(row.marks_obtained || 0.0),
      explanation: row.explanation ? String(row.explanation) : null,
      stepByStepSolution: steps,
      sourceLabel,
      subjectName: String(row.subject_name || ''),
      topicName: row.topic_name ? String(row.topic_name) : null,
      difficulty: String(row.difficulty || 'medium'),
    };
  });

  // Calculate Breakdown Maps
  const topicPerfMap = new Map<string, { total: number; correct: number }>();
  const sourcePerfMap = new Map<string, { total: number; correct: number }>();
  const diffPerfMap = new Map<string, { total: number; correct: number }>();

  for (const q of questionResults) {
    const topic = q.topicName || 'General';
    const source = q.sourceLabel;
    const diff = q.difficulty;

    const t = topicPerfMap.get(topic) || { total: 0, correct: 0 };
    t.total++;
    if (q.isCorrect) t.correct++;
    topicPerfMap.set(topic, t);

    const s = sourcePerfMap.get(source) || { total: 0, correct: 0 };
    s.total++;
    if (q.isCorrect) s.correct++;
    sourcePerfMap.set(source, s);

    const d = diffPerfMap.get(diff) || { total: 0, correct: 0 };
    d.total++;
    if (q.isCorrect) d.correct++;
    diffPerfMap.set(diff, d);
  }

  const topicWisePerformance = Array.from(topicPerfMap.entries()).map(([topicName, stats]) => ({
    topicName,
    total: stats.total,
    correct: stats.correct,
    accuracyPercentage: stats.total > 0 ? Number(((stats.correct / stats.total) * 100).toFixed(1)) : 0,
  }));

  const sourceWisePerformance = Array.from(sourcePerfMap.entries()).map(([source, stats]) => ({
    source,
    total: stats.total,
    correct: stats.correct,
  }));

  const difficultyWisePerformance = Array.from(diffPerfMap.entries()).map(([difficulty, stats]) => ({
    difficulty,
    total: stats.total,
    correct: stats.correct,
  }));

  const totalMarksSum = Number(sessionRow.total_marks || 0.0);
  const obtained = Number(sessionRow.obtained_marks || 0.0);
  const percentage = totalMarksSum > 0 ? Number(((Math.max(0, obtained) / totalMarksSum) * 100).toFixed(1)) : 0.0;

  return {
    testSessionId: sessionId,
    studentId,
    status: String(sessionRow.status) as TestSessionState,
    score: obtained,
    totalMarks: totalMarksSum,
    percentage,
    accuracyPercentage: Number(sessionRow.accuracy_percentage || 0.0),
    correctCount: Number(sessionRow.correct_count || 0),
    incorrectCount: Number(sessionRow.incorrect_count || 0),
    unansweredCount: Number(sessionRow.unanswered_count || 0),
    totalQuestions: Number(sessionRow.question_count || 0),
    timeTakenSeconds: Number(sessionRow.time_taken_seconds || 0),
    questionResults,
    topicWisePerformance,
    sourceWisePerformance,
    difficultyWisePerformance,
  };
}
