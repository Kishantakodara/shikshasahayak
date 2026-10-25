// ============================================================
// ADAPTIVE LEARNING ENGINE - ADAPTIVE QUESTION SELECTION
// Selects optimal next questions matching student mastery, difficulty,
// revision needs, unseen questions, and high quality scores.
// ============================================================

import { Env } from '../../contentEngine';
import { queryEligibleQuestions } from '../testEngine/testGenerationService';
import { recalculateStudentTopicMastery } from './studentMasteryService';

export interface AdaptiveSelectionConfig {
  studentId: string;
  subjectCode?: string;
  topicName?: string;
  targetCount?: number;
  mode?: 'WEAK_TOPIC' | 'REVISION' | 'CHALLENGE' | 'RECOVERY' | 'BALANCED';
}

export async function selectAdaptiveQuestions(
  env: Env,
  config: AdaptiveSelectionConfig
): Promise<Record<string, unknown>[]> {
  const targetCount = config.targetCount || 10;

  // Fetch student mastery context if subject & topic are provided
  let studentMasteryScore = 50.0;
  if (config.subjectCode && config.topicName) {
    const mastery = await recalculateStudentTopicMastery(env, config.studentId, config.subjectCode, config.topicName);
    studentMasteryScore = mastery.masteryScore;
  }

  // Determine target difficulty based on mode and mastery
  let targetDifficulty: 'EASY' | 'HARD' | undefined = undefined;
  if (config.mode === 'CHALLENGE' || studentMasteryScore >= 80.0) {
    targetDifficulty = 'HARD';
  } else if (config.mode === 'RECOVERY' || studentMasteryScore < 40.0) {
    targetDifficulty = 'EASY';
  }

  // Query eligible questions from Master Question Bank using verified & non-quarantined gate
  const eligible = await queryEligibleQuestions(env, {
    testType: 'CUSTOM_TEST',
    questionCount: targetCount,
    durationMinutes: 15,
    subjectCode: config.subjectCode,
    topicName: config.topicName,
    difficulty: targetDifficulty,
  });

  // Fetch student attempt history to identify attempted/incorrect question IDs
  const attemptRows = await env.DB.prepare(
    `SELECT question_id, is_correct FROM student_mcq_attempts WHERE student_id = ?`
  )
    .bind(config.studentId)
    .all<{ question_id: string; is_correct: number }>();

  const attemptedMap = new Map<string, number>();
  (attemptRows.results || []).forEach((r) => {
    attemptedMap.set(r.question_id, r.is_correct);
  });

  // Score & sort eligible questions adaptively
  const scored = eligible.map((q) => {
    const qId = String(q.id);
    let priorityWeight = 50.0;

    const isAttempted = attemptedMap.has(qId);
    const lastResult = attemptedMap.get(qId);

    if (config.mode === 'REVISION' && isAttempted && lastResult === 0) {
      priorityWeight += 40.0; // High priority for previously incorrect questions
    } else if (!isAttempted) {
      priorityWeight += 30.0; // High priority for unseen questions
    } else if (isAttempted && lastResult === 1) {
      priorityWeight -= 20.0; // Low priority for already correctly answered
    }

    return { question: q, priorityWeight };
  });

  // Sort by priority weight descending
  scored.sort((a, b) => b.priorityWeight - a.priorityWeight);

  const selected = scored.slice(0, targetCount).map((s) => s.question);

  return selected;
}
