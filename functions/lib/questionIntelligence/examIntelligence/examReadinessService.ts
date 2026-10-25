// ============================================================
// EXAM INTELLIGENCE ENGINE - EXAM READINESS SERVICE
// Multi-dimensional evaluation of student exam readiness
// based on verifiable syllabus, mastery, PYQ, and difficulty metrics.
// ============================================================

import { Env } from '../../contentEngine';
import {
  StudentExamReadinessReport,
  ExamReadinessLevel,
  ReadinessDimensionScore,
} from './types';
import { calculateStudentTopicRisks } from './topicRiskService';

/**
  Calculates comprehensive, multi-dimensional student Exam Readiness.
 */
export async function calculateStudentExamReadiness(
  env: Env,
  studentId: string,
  subjectCode: string,
  semester: number = 1
): Promise<StudentExamReadinessReport> {
  const code = subjectCode.trim();

  // 1. Get Subject Name from master_question_bank or catalog
  const subjRow = await env.DB.prepare(
    `SELECT subject_name FROM master_question_bank WHERE subject_code = ? LIMIT 1`
  )
    .bind(code)
    .first<{ subject_name: string }>();

  const subjectName = subjRow?.subject_name || `${code} Engineering`;

  // 2. Fetch all student attempts in this subject
  const attempts = await env.DB.prepare(
    `SELECT 
      sma.is_correct, sma.created_at,
      mqb.is_original_pyq, mqb.difficulty, mqb.topic_name
     FROM student_mcq_attempts sma
     JOIN master_question_bank mqb ON sma.question_id = mqb.id
     WHERE sma.student_id = ? AND mqb.subject_code = ?
     ORDER BY sma.created_at DESC`
  )
    .bind(studentId, code)
    .all<{
      is_correct: number;
      created_at: string;
      is_original_pyq: number;
      difficulty?: string;
      topic_name?: string;
    }>();

  const totalAttempts = attempts.results ? attempts.results.length : 0;

  // 3. Fetch topic risk profiles
  const topicRisks = await calculateStudentTopicRisks(env, studentId, code);
  const totalTopics = topicRisks.length;
  const attemptedTopics = topicRisks.filter(t => t.studentAttemptsCount > 0);
  const masteredTopics = topicRisks.filter(t => t.studentMasteryScore >= 75);

  // If no attempts, return NOT_STARTED baseline
  if (totalAttempts === 0) {
    const zeroReport: StudentExamReadinessReport = {
      studentId,
      subjectCode: code,
      subjectName,
      semester,
      overallReadinessScore: 0,
      readinessLevel: 'NOT_STARTED',
      confidence: 0.0,
      dimensions: [
        { dimension: 'CONTENT_COVERAGE', label: 'Syllabus Coverage', score: 0, weight: 0.15, status: 'NEEDS_ATTENTION', detail: '0 topics attempted' },
        { dimension: 'TOPIC_MASTERY', label: 'Topic Mastery', score: 0, weight: 0.20, status: 'NEEDS_ATTENTION', detail: 'No practice attempts recorded' },
        { dimension: 'PYQ_MASTERY', label: 'PYQ Performance', score: 0, weight: 0.20, status: 'NEEDS_ATTENTION', detail: '0 GTU PYQs attempted' },
        { dimension: 'EXAM_PATTERN_COVERAGE', label: 'High Priority Topics', score: 0, weight: 0.15, status: 'NEEDS_ATTENTION', detail: '0 high-frequency topics completed' },
        { dimension: 'DIFFICULTY_READINESS', label: 'Hard Question Readiness', score: 0, weight: 0.10, status: 'NEEDS_ATTENTION', detail: 'No medium/hard questions attempted' },
        { dimension: 'RECENT_PERFORMANCE', label: 'Recent Momentum', score: 0, weight: 0.10, status: 'NEEDS_ATTENTION', detail: 'No recent activity' },
        { dimension: 'REVISION_HEALTH', label: 'Revision Health', score: 0, weight: 0.10, status: 'NEEDS_ATTENTION', detail: 'Fresh start required' },
      ],
      weakAreas: topicRisks.filter(t => t.historicalPriorityLevel === 'CRITICAL' || t.historicalPriorityLevel === 'HIGH').map(t => t.topicName),
      strongAreas: [],
      recommendedNextActions: ['Begin initial diagnostic practice on high-frequency GTU topics'],
      calculatedAt: new Date().toISOString(),
    };
    return zeroReport;
  }

  // Dimension 1: CONTENT_COVERAGE (0-100)
  const coverageRatio = totalTopics > 0 ? (attemptedTopics.length / totalTopics) : 0;
  const contentCoverageScore = Math.min(100, Math.round(coverageRatio * 100));

  // Dimension 2: TOPIC_MASTERY (0-100)
  const avgMastery = attemptedTopics.length > 0
    ? attemptedTopics.reduce((acc, t) => acc + t.studentMasteryScore, 0) / attemptedTopics.length
    : 0;
  const topicMasteryScore = Math.min(100, Math.round(avgMastery));

  // Dimension 3: PYQ_MASTERY (0-100)
  const pyqAttempts = (attempts.results || []).filter(a => Number(a.is_original_pyq) === 1);
  const pyqCorrect = pyqAttempts.filter(a => Number(a.is_correct) === 1).length;
  const pyqMasteryScore = pyqAttempts.length > 0
    ? Math.min(100, Math.round((pyqCorrect / pyqAttempts.length) * 100))
    : 0;

  // Dimension 4: EXAM_PATTERN_COVERAGE (0-100)
  const highPrioTopics = topicRisks.filter(t => t.historicalPriorityLevel === 'CRITICAL' || t.historicalPriorityLevel === 'HIGH');
  const attemptedHighPrio = highPrioTopics.filter(t => t.studentAttemptsCount > 0);
  const examPatternScore = highPrioTopics.length > 0
    ? Math.min(100, Math.round((attemptedHighPrio.length / highPrioTopics.length) * 100))
    : 100;

  // Dimension 5: DIFFICULTY_READINESS (0-100)
  const hardAttempts = (attempts.results || []).filter(a => String(a.difficulty || '').toLowerCase() === 'hard');
  const hardCorrect = hardAttempts.filter(a => Number(a.is_correct) === 1).length;
  const difficultyScore = hardAttempts.length > 0
    ? Math.min(100, Math.round((hardCorrect / hardAttempts.length) * 100))
    : (totalAttempts >= 5 ? 50 : 25);

  // Dimension 6: RECENT_PERFORMANCE (0-100)
  const recentSlice = (attempts.results || []).slice(0, 15);
  const recentCorrect = recentSlice.filter(a => Number(a.is_correct) === 1).length;
  const recentPerformanceScore = recentSlice.length > 0
    ? Math.min(100, Math.round((recentCorrect / recentSlice.length) * 100))
    : 0;

  // Dimension 7: REVISION_HEALTH (0-100)
  const revisionHealthScore = Math.min(100, Math.round(50 + (masteredTopics.length * 10)));

  // Composite Weighted Readiness Score
  const weightedSum =
    contentCoverageScore * 0.15 +
    topicMasteryScore * 0.20 +
    pyqMasteryScore * 0.20 +
    examPatternScore * 0.15 +
    difficultyScore * 0.10 +
    recentPerformanceScore * 0.10 +
    revisionHealthScore * 0.10;

  // Insufficient sample penalty: require at least 10 attempts for full high readiness
  const sampleConfidence = Math.min(1.0, totalAttempts / 15);
  const calibratedScore = Math.round(weightedSum * (0.6 + 0.4 * sampleConfidence));
  const overallReadinessScore = Math.max(5, Math.min(100, calibratedScore));

  let readinessLevel: ExamReadinessLevel = 'DEVELOPING';
  if (overallReadinessScore >= 90 && totalAttempts >= 15) readinessLevel = 'STRONG';
  else if (overallReadinessScore >= 75 && totalAttempts >= 10) readinessLevel = 'EXAM_READY';
  else if (overallReadinessScore >= 55) readinessLevel = 'PREPARING';
  else if (overallReadinessScore >= 35) readinessLevel = 'DEVELOPING';
  else readinessLevel = 'FOUNDATION';

  const dimensions: ReadinessDimensionScore[] = [
    {
      dimension: 'CONTENT_COVERAGE',
      label: 'Syllabus Coverage',
      score: contentCoverageScore,
      weight: 0.15,
      status: contentCoverageScore >= 75 ? 'STRONG' : (contentCoverageScore >= 50 ? 'DEVELOPING' : 'NEEDS_ATTENTION'),
      detail: `${attemptedTopics.length}/${totalTopics} topics practiced`,
    },
    {
      dimension: 'TOPIC_MASTERY',
      label: 'Topic Mastery',
      score: topicMasteryScore,
      weight: 0.20,
      status: topicMasteryScore >= 75 ? 'STRONG' : (topicMasteryScore >= 50 ? 'DEVELOPING' : 'NEEDS_ATTENTION'),
      detail: `Average accuracy across topics: ${topicMasteryScore}%`,
    },
    {
      dimension: 'PYQ_MASTERY',
      label: 'PYQ Performance',
      score: pyqMasteryScore,
      weight: 0.20,
      status: pyqMasteryScore >= 75 ? 'STRONG' : (pyqMasteryScore >= 50 ? 'DEVELOPING' : 'NEEDS_ATTENTION'),
      detail: `${pyqCorrect}/${pyqAttempts.length} GTU PYQs correct`,
    },
    {
      dimension: 'EXAM_PATTERN_COVERAGE',
      label: 'High Priority Topics',
      score: examPatternScore,
      weight: 0.15,
      status: examPatternScore >= 75 ? 'STRONG' : (examPatternScore >= 50 ? 'DEVELOPING' : 'NEEDS_ATTENTION'),
      detail: `${attemptedHighPrio.length}/${highPrioTopics.length} high-frequency topics attempted`,
    },
    {
      dimension: 'DIFFICULTY_READINESS',
      label: 'Hard Question Readiness',
      score: difficultyScore,
      weight: 0.10,
      status: difficultyScore >= 70 ? 'STRONG' : (difficultyScore >= 45 ? 'DEVELOPING' : 'NEEDS_ATTENTION'),
      detail: `${hardCorrect}/${hardAttempts.length} hard questions solved`,
    },
    {
      dimension: 'RECENT_PERFORMANCE',
      label: 'Recent Momentum',
      score: recentPerformanceScore,
      weight: 0.10,
      status: recentPerformanceScore >= 75 ? 'STRONG' : (recentPerformanceScore >= 50 ? 'DEVELOPING' : 'NEEDS_ATTENTION'),
      detail: `Recent accuracy: ${recentPerformanceScore}% (${recentSlice.length} attempts)`,
    },
    {
      dimension: 'REVISION_HEALTH',
      label: 'Revision Health',
      score: revisionHealthScore,
      weight: 0.10,
      status: revisionHealthScore >= 75 ? 'STRONG' : 'DEVELOPING',
      detail: `${masteredTopics.length} topics currently mastered`,
    },
  ];

  const weakAreas = topicRisks
    .filter(t => t.riskLevel === 'CRITICAL_RISK' || t.riskLevel === 'HIGH_RISK')
    .map(t => t.topicName);

  const strongAreas = topicRisks
    .filter(t => t.riskLevel === 'LOW_RISK' && t.studentMasteryScore >= 75)
    .map(t => t.topicName);

  const recommendedNextActions: string[] = [];
  if (weakAreas.length > 0) {
    recommendedNextActions.push(`Focus practice on weak critical topic: '${weakAreas[0]}'`);
  }
  if (pyqAttempts.length < 5) {
    recommendedNextActions.push('Solve at least 5 more GTU original PYQs to boost exam pattern familiarity');
  }
  if (coverageRatio < 0.70) {
    recommendedNextActions.push('Expand practice to unattempted syllabus topics');
  }
  if (recommendedNextActions.length === 0) {
    recommendedNextActions.push('Maintain revision pace with mixed-difficulty timed mock sessions');
  }

  const now = new Date().toISOString();

  // Persist snapshot to D1
  try {
    await env.DB.prepare(
      `INSERT INTO student_exam_readiness_snapshots (
        id, student_id, subject_code, semester, overall_readiness_score,
        readiness_level, content_coverage_score, topic_mastery_score,
        pyq_mastery_score, exam_pattern_score, difficulty_score,
        recent_performance_score, revision_health_score,
        weak_areas_json, strong_areas_json, recommended_actions_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
    )
      .bind(
        `sers_${crypto.randomUUID().slice(0, 12)}`,
        studentId,
        code,
        semester,
        overallReadinessScore,
        readinessLevel,
        contentCoverageScore,
        topicMasteryScore,
        pyqMasteryScore,
        examPatternScore,
        difficultyScore,
        recentPerformanceScore,
        revisionHealthScore,
        JSON.stringify(weakAreas),
        JSON.stringify(strongAreas),
        JSON.stringify(recommendedNextActions)
      )
      .run();
  } catch {
    /* empty */
  }

  return {
    studentId,
    subjectCode: code,
    subjectName,
    semester,
    overallReadinessScore,
    readinessLevel,
    confidence: sampleConfidence,
    dimensions,
    weakAreas,
    strongAreas,
    recommendedNextActions,
    calculatedAt: now,
  };
}
