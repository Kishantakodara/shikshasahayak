// ============================================================
// QUESTION QUALITY ENGINE - SCORING & HEALTH SERVICE
// Deterministic 0-100 Quality Score, Quality Bands, Health Flags,
// and Review Priority Scoring logic.
// ============================================================

import { Env } from '../../contentEngine';
import { calculateQuestionPerformance, QuestionPerformanceStats } from './questionPerformanceService';
import { validateQuestionPayload } from '../validationService';

export type QualityBand = 'EXCELLENT' | 'GOOD' | 'WATCH' | 'NEEDS_REVIEW' | 'CRITICAL';
export type ReviewPriorityLevel = 'NORMAL' | 'WATCH' | 'HIGH' | 'CRITICAL';

export interface QuestionQualityEvaluation {
  questionId: string;
  qualityScore: number;
  qualityBand: QualityBand;
  healthFlags: string[];
  reviewPriorityScore: number;
  reviewPriorityLevel: ReviewPriorityLevel;
  performance: QuestionPerformanceStats;
}

export function computeQualityBand(score: number): QualityBand {
  if (score >= 85) return 'EXCELLENT';
  if (score >= 70) return 'GOOD';
  if (score >= 55) return 'WATCH';
  if (score >= 40) return 'NEEDS_REVIEW';
  return 'CRITICAL';
}

export function computeReviewPriorityLevel(priorityScore: number): ReviewPriorityLevel {
  if (priorityScore >= 75) return 'CRITICAL';
  if (priorityScore >= 50) return 'HIGH';
  if (priorityScore >= 25) return 'WATCH';
  return 'NORMAL';
}

export async function evaluateQuestionQuality(
  env: Env,
  questionId: string
): Promise<QuestionQualityEvaluation> {
  const qRow = await env.DB.prepare(`SELECT * FROM master_question_bank WHERE id = ?`)
    .bind(questionId)
    .first<Record<string, unknown>>();

  if (!qRow) throw new Error(`Question '${questionId}' not found in master question bank`);

  const perf = await calculateQuestionPerformance(env, questionId);

  const reportsCount = (
    await env.DB.prepare(
      `SELECT COUNT(*) as cnt FROM question_issue_reports WHERE question_id = ? AND status IN ('OPEN', 'INVESTIGATING')`
    ).bind(questionId).first<{ cnt: number }>()
  )?.cnt || 0;

  let qualityScore = 85.0;
  const healthFlags: string[] = [];

  const qType = String(qRow.question_type || 'MCQ');
  const parsedOptions = qRow.options_json ? JSON.parse(String(qRow.options_json)) : undefined;
  const parsedCorrect = qRow.correct_answer_json ? String(qRow.correct_answer_json) : undefined;

  const valPayload: any = {
    questionText: String(qRow.question_text || ''),
    questionType: qType,
    subjectCode: String(qRow.subject_code || ''),
    subjectName: String(qRow.subject_name || 'Subject'),
    semester: Number(qRow.semester || 1),
    examName: String(qRow.exam_name || 'GTU'),
    examYear: Number(qRow.exam_year || 2024),
    sourceType: String(qRow.source_type || 'GTU'),
    options: parsedOptions || [
      { id: 'A', text: 'Option A' },
      { id: 'B', text: 'Option B' },
    ],
    correctAnswer: parsedCorrect || 'A',
    explanation: qRow.explanation ? String(qRow.explanation) : undefined,
    isOriginalPyq: Number(qRow.is_original_pyq) === 1,
    isAiGenerated: Number(qRow.is_ai_generated) === 1,
  };

  // Technical validation check
  const valResult = validateQuestionPayload(valPayload);
  if (!valResult.isValid) {
    qualityScore -= 30.0;
  }



  // Explanation completeness check
  if (!qRow.explanation || String(qRow.explanation).trim().length < 10) {
    healthFlags.push('POOR_EXPLANATION');
    qualityScore -= 10.0;
  }

  // Reports penalty
  if (reportsCount > 0) {
    qualityScore -= Math.min(30.0, reportsCount * 12.0);
    healthFlags.push('POSSIBLE_AMBIGUITY');
  }

  // Student performance adjustments (only when sample >= 10)
  if (perf.sampleConfidenceBand !== 'LOW_SAMPLE') {
    const skipRate = perf.totalAttempts > 0 ? (perf.skippedAttempts / perf.totalAttempts) * 100 : 0;
    if (skipRate > 35) {
      healthFlags.push('HIGH_SKIP_RATE');
      qualityScore -= 15.0;
    }

    if (perf.accuracyPercentage < 20.0) {
      healthFlags.push('TOO_HARD');
    } else if (perf.accuracyPercentage > 95.0) {
      healthFlags.push('TOO_EASY');
    }

    if (perf.accuracyPercentage < 25.0) {
      healthFlags.push('HIGH_ERROR_RATE');
      qualityScore -= 10.0;
    }
  } else {
    healthFlags.push('LOW_SAMPLE');
  }

  if (healthFlags.length === 0 || (healthFlags.length === 1 && healthFlags[0] === 'LOW_SAMPLE')) {
    healthFlags.unshift('HEALTHY');
  }

  qualityScore = Math.max(0.0, Math.min(100.0, Math.round(qualityScore * 10) / 10));
  const qualityBand = computeQualityBand(qualityScore);

  // Review Priority Score (0-100)
  let priorityScore = (100.0 - qualityScore) * 0.6 + reportsCount * 20.0;
  if (healthFlags.includes('POSSIBLE_AMBIGUITY')) priorityScore += 20.0;
  if (healthFlags.includes('POOR_EXPLANATION')) priorityScore += 10.0;

  priorityScore = Math.max(0.0, Math.min(100.0, Math.round(priorityScore * 10) / 10));
  const reviewPriorityLevel = computeReviewPriorityLevel(priorityScore);

  // Upsert into question_quality_metrics
  await env.DB.prepare(
    `INSERT INTO question_quality_metrics (
      question_id, total_attempts, unique_students, correct_attempts, incorrect_attempts, skipped_attempts,
      accuracy_percentage, difficulty_index, average_time_seconds, sample_confidence_band,
      quality_score, quality_band, health_flags_json, review_priority_score, review_priority_level, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(question_id) DO UPDATE SET
      total_attempts = excluded.total_attempts,
      unique_students = excluded.unique_students,
      correct_attempts = excluded.correct_attempts,
      incorrect_attempts = excluded.incorrect_attempts,
      skipped_attempts = excluded.skipped_attempts,
      accuracy_percentage = excluded.accuracy_percentage,
      difficulty_index = excluded.difficulty_index,
      average_time_seconds = excluded.average_time_seconds,
      sample_confidence_band = excluded.sample_confidence_band,
      quality_score = excluded.quality_score,
      quality_band = excluded.quality_band,
      health_flags_json = excluded.health_flags_json,
      review_priority_score = excluded.review_priority_score,
      review_priority_level = excluded.review_priority_level,
      updated_at = CURRENT_TIMESTAMP`
  )
    .bind(
      questionId,
      perf.totalAttempts,
      perf.uniqueStudents,
      perf.correctAttempts,
      perf.incorrectAttempts,
      perf.skippedAttempts,
      perf.accuracyPercentage,
      perf.difficultyIndex,
      perf.averageTimeSeconds,
      perf.sampleConfidenceBand,
      qualityScore,
      qualityBand,
      JSON.stringify(healthFlags),
      priorityScore,
      reviewPriorityLevel
    )
    .run();

  return {
    questionId,
    qualityScore,
    qualityBand,
    healthFlags,
    reviewPriorityScore: priorityScore,
    reviewPriorityLevel,
    performance: perf,
  };
}
