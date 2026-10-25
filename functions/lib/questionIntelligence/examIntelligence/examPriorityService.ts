// ============================================================
// EXAM INTELLIGENCE ENGINE - EXAM PRIORITY SERVICE
// Deterministic multi-factor priority scoring for exam preparation.
// Strictly adheres to No-False-Prediction Policy (decision support only).
// ============================================================

import { ExamPriorityLevel } from './types';

export interface PriorityScoreFactors {
  historicalFrequencyScore: number; // 0-100 (30% weight)
  recurrenceScore: number;          // 0-100 (25% weight)
  recentTrendScore: number;         // 0-100 (15% weight)
  marksWeightScore: number;         // 0-100 (15% weight)
  syllabusCoverageScore: number;    // 0-100 (15% weight)
}

export interface ExamPriorityEvaluation {
  priorityScore: number; // 0 to 100
  priorityLevel: ExamPriorityLevel;
  confidence: number;    // 0.0 to 1.0
  evidence: string[];
  factors: PriorityScoreFactors;
  safetyDisclaimer: string;
}

/**
  Calculates deterministic exam priority score using verifiable historical evidence.
  Never asserts certainty or fabricates predictions.
 */
export function calculateExamPriorityScore(input: {
  frequency: number;
  recurrenceCount: number;
  isRecentMomentumRising: boolean;
  averageMarks: number;
  isCoreSyllabusUnit: boolean;
  hasSufficientData: boolean;
}): ExamPriorityEvaluation {
  const evidence: string[] = [];

  if (!input.hasSufficientData || input.frequency === 0) {
    return {
      priorityScore: 0,
      priorityLevel: 'INSUFFICIENT_DATA',
      confidence: 0.0,
      evidence: ['Insufficient historical exam data to determine preparation priority'],
      factors: {
        historicalFrequencyScore: 0,
        recurrenceScore: 0,
        recentTrendScore: 0,
        marksWeightScore: 0,
        syllabusCoverageScore: 0,
      },
      safetyDisclaimer: 'Preparation priority is based on historical GTU exam patterns as an academic decision-support aid and does not guarantee exam content.',
    };
  }

  // 1. Historical Frequency (0-100, 30%)
  let freqScore = Math.min(100, input.frequency * 20);
  evidence.push(`Topic appeared in ${input.frequency} analyzed GTU question instances`);

  // 2. Recurrence (0-100, 25%)
  let recScore = Math.min(100, input.recurrenceCount * 30);
  if (input.recurrenceCount > 1) {
    evidence.push(`Identified ${input.recurrenceCount} recurring question/concept patterns`);
  }

  // 3. Recent Trend (0-100, 15%)
  let trendScore = 50;
  if (input.isRecentMomentumRising) {
    trendScore = 90;
    evidence.push('Frequency momentum is rising in recent GTU exam sessions');
  }

  // 4. Marks Weight (0-100, 15%)
  let marksScore = Math.min(100, (input.averageMarks / 7.0) * 100);
  if (input.averageMarks >= 4.0) {
    evidence.push(`High marks weighting (Average: ${input.averageMarks.toFixed(1)}M)`);
  }

  // 5. Syllabus Coverage (0-100, 15%)
  let syllabusScore = input.isCoreSyllabusUnit ? 90 : 60;
  if (input.isCoreSyllabusUnit) {
    evidence.push('Part of core GTU first-year syllabus foundation');
  }

  // Composite Weighted Sum
  const totalScore = Number(
    (
      freqScore * 0.30 +
      recScore * 0.25 +
      trendScore * 0.15 +
      marksScore * 0.15 +
      syllabusScore * 0.15
    ).toFixed(1)
  );

  const finalScore = Math.max(10, Math.min(100, Math.round(totalScore)));

  let level: ExamPriorityLevel = 'MEDIUM';
  if (finalScore >= 80) level = 'CRITICAL';
  else if (finalScore >= 65) level = 'HIGH';
  else if (finalScore >= 45) level = 'MEDIUM';
  else level = 'LOW';

  const confidence = input.frequency >= 4 ? 0.90 : (input.frequency >= 2 ? 0.75 : 0.50);

  return {
    priorityScore: finalScore,
    priorityLevel: level,
    confidence,
    evidence,
    factors: {
      historicalFrequencyScore: freqScore,
      recurrenceScore: recScore,
      recentTrendScore: trendScore,
      marksWeightScore: marksScore,
      syllabusCoverageScore: syllabusScore,
    },
    safetyDisclaimer: 'Preparation priority is based on historical GTU exam patterns as an academic decision-support aid and does not guarantee exam content.',
  };
}
