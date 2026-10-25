// ============================================================
// QUESTION QUALITY ENGINE - PERFORMANCE SERVICE
// Aggregates student attempt data, computes difficulty index, accuracy,
// average timing, and sample size confidence bands.
// ============================================================

import { Env } from '../../contentEngine';

export type SampleConfidenceBand = 'LOW_SAMPLE' | 'LIMITED_SAMPLE' | 'RELIABLE' | 'HIGH_CONFIDENCE';

export interface QuestionPerformanceStats {
  questionId: string;
  totalAttempts: number;
  uniqueStudents: number;
  correctAttempts: number;
  incorrectAttempts: number;
  skippedAttempts: number;
  accuracyPercentage: number;
  difficultyIndex: number; // 0.0 (hardest) to 1.0 (easiest)
  averageTimeSeconds: number;
  sampleConfidenceBand: SampleConfidenceBand;
}

export function getSampleConfidenceBand(totalAttempts: number): SampleConfidenceBand {
  if (totalAttempts < 10) return 'LOW_SAMPLE';
  if (totalAttempts < 50) return 'LIMITED_SAMPLE';
  if (totalAttempts < 200) return 'RELIABLE';
  return 'HIGH_CONFIDENCE';
}

export async function calculateQuestionPerformance(
  env: Env,
  questionId: string
): Promise<QuestionPerformanceStats> {
  const attemptsRes = await env.DB.prepare(
    `SELECT
      COUNT(*) as total,
      COUNT(DISTINCT student_id) as unique_users,
      SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_cnt,
      SUM(CASE WHEN is_correct = 0 AND selected_option_id IS NOT NULL THEN 1 ELSE 0 END) as incorrect_cnt,
      SUM(CASE WHEN selected_option_id IS NULL THEN 1 ELSE 0 END) as skipped_cnt,
      AVG(time_taken_seconds) as avg_time
     FROM student_mcq_attempts
     WHERE question_id = ?`
  ).bind(questionId).first<{
    total: number;
    unique_users: number;
    correct_cnt: number;
    incorrect_cnt: number;
    skipped_cnt: number;
    avg_time: number;
  }>();


  const totalAttempts = attemptsRes?.total || 0;
  const uniqueStudents = attemptsRes?.unique_users || 0;
  const correctAttempts = attemptsRes?.correct_cnt || 0;
  const incorrectAttempts = attemptsRes?.incorrect_cnt || 0;
  const skippedAttempts = attemptsRes?.skipped_cnt || 0;

  const answeredAttempts = correctAttempts + incorrectAttempts;
  const accuracyPercentage = answeredAttempts > 0 ? (correctAttempts / answeredAttempts) * 100 : 80.0;
  const difficultyIndex = totalAttempts > 0 ? correctAttempts / totalAttempts : 0.5;
  const averageTimeSeconds = Math.round((attemptsRes?.avg_time || 45.0) * 10) / 10;
  const sampleConfidenceBand = getSampleConfidenceBand(totalAttempts);

  return {
    questionId,
    totalAttempts,
    uniqueStudents,
    correctAttempts,
    incorrectAttempts,
    skippedAttempts,
    accuracyPercentage: Math.round(accuracyPercentage * 10) / 10,
    difficultyIndex: Math.round(difficultyIndex * 100) / 100,
    averageTimeSeconds,
    sampleConfidenceBand,
  };
}
