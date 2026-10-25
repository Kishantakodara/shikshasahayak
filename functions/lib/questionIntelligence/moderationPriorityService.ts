// ============================================================
// QUESTION INTELLIGENCE ENGINE - MODERATION PRIORITIZATION SERVICE
// Prioritizes staged and pending questions for reviewer workspace
// without replacing human / authoritative D1 moderation approval.
// ============================================================

import { MasterQuestion } from '../../../src/types';
import { evaluateDeterministicQuestionQuality } from './qualityEngine/questionQualityEngine';

export type ModerationPriorityLevel = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';

export interface ModerationPriorityEvaluation {
  questionId: string;
  priorityScore: number; // 0 to 100
  priorityLevel: ModerationPriorityLevel;
  priorityReasons: string[];
  recommendedReviewOrder: number; // 1 (highest priority) to 5 (lowest)
  isAutoApprovalEligible: false; // Explicitly locked to false
}

/**
  Calculates deterministic moderation priority for review queue items.
  Never auto-approves any item.
 */
export function calculateModerationPriority(
  question: Partial<MasterQuestion>,
  options: { hasReports?: boolean; repeatOccurrences?: number } = {}
): ModerationPriorityEvaluation {
  let score = 50;
  const reasons: string[] = [];

  const quality = evaluateDeterministicQuestionQuality(question);

  // 1. High quality + complete provenance raises review efficiency
  if (quality.qualityScore >= 80) {
    score += 20;
    reasons.push('High extraction quality and complete structural fields');
  } else if (quality.qualityScore < 50) {
    score -= 20;
    reasons.push('Low extraction quality — requires careful technical fix or rejection');
  }

  // 2. Repeated PYQ importance boosts priority
  const repeats = options.repeatOccurrences || 1;
  if (repeats >= 3) {
    score += 25;
    reasons.push(`High-frequency repeat question across ${repeats} GTU exam sessions`);
  } else if (repeats === 2) {
    score += 10;
    reasons.push('Repeated GTU PYQ question');
  }

  // 3. User issue reports elevate priority
  if (options.hasReports) {
    score += 30;
    reasons.push('Active user issue report requires urgent verification');
  }

  // 4. Missing explanation slightly lowers review readiness
  if (quality.flags.includes('POOR_EXPLANATION')) {
    score -= 10;
    reasons.push('Requires reviewer to supplement missing technical explanation');
  }

  const finalScore = Math.max(0, Math.min(100, score));

  let level: ModerationPriorityLevel = 'NORMAL';
  let order = 3;

  if (finalScore >= 80) {
    level = 'CRITICAL';
    order = 1;
  } else if (finalScore >= 65) {
    level = 'HIGH';
    order = 2;
  } else if (finalScore >= 45) {
    level = 'NORMAL';
    order = 3;
  } else {
    level = 'LOW';
    order = 4;
  }

  return {
    questionId: question.id || '',
    priorityScore: finalScore,
    priorityLevel: level,
    priorityReasons: reasons,
    recommendedReviewOrder: order,
    isAutoApprovalEligible: false,
  };
}
