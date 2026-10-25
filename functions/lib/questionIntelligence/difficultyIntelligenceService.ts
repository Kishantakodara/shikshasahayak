// ============================================================
// QUESTION INTELLIGENCE ENGINE - DIFFICULTY INTELLIGENCE SERVICE
// Deterministic structural & hybrid difficulty estimation.
// ============================================================

import { Env } from '../contentEngine';
import { MasterQuestion } from '../../../src/types';

export type DifficultyBand = 'EASY' | 'MEDIUM' | 'HARD' | 'VERY_HARD';
export type DifficultySource = 'EXPLICIT' | 'INFERRED' | 'CALCULATED';

export interface DifficultyProfile {
  questionId: string;
  difficultyBand: DifficultyBand;
  difficultyScore: number; // 0.0 (easiest) to 1.0 (hardest)
  difficultyConfidence: number; // 0.0 to 1.0
  difficultySource: DifficultySource;
  marks: number;
  hasMathFormula: boolean;
  hasCodeBlock: boolean;
  subPartsCount: number;
}

/**
  Calculates deterministic difficulty profile from question structure, marks, and complexity.
 */
export function estimateQuestionDifficulty(
  question: Partial<MasterQuestion>
): DifficultyProfile {
  const text = String(question.questionText || '');
  const marks = Number(question.marks || 1);
  const qType = String(question.questionType || '').toUpperCase();

  let rawScore = 0.4; // default baseline medium
  let confidence = 0.8;
  let source: DifficultySource = 'INFERRED';

  // If explicit difficulty is provided in valid range
  if (question.difficulty) {
    const d = String(question.difficulty).toLowerCase();
    if (d === 'easy') { rawScore = 0.25; source = 'EXPLICIT'; }
    else if (d === 'medium') { rawScore = 0.5; source = 'EXPLICIT'; }
    else if (d === 'hard') { rawScore = 0.75; source = 'EXPLICIT'; }
    else if (d === 'very_hard') { rawScore = 0.9; source = 'EXPLICIT'; }
  }

  // 1. Math formulas boost difficulty
  const hasMathFormula = text.includes('$') || text.includes('\\int') || text.includes('\\matrix') || text.includes('iint_') || text.includes('\\frac');
  if (hasMathFormula) {
    rawScore += 0.15;
  }

  // 2. Code blocks boost difficulty
  const hasCodeBlock = text.includes('printf(') || text.includes('for(') || text.includes('#include') || text.includes('while(') || text.includes('int main');
  if (hasCodeBlock) {
    rawScore += 0.15;
  }

  // 3. Sub-parts count
  const subPartsMatch = text.match(/\([i|v|x|a-d]+\)/gi);
  const subPartsCount = subPartsMatch ? subPartsMatch.length : 1;
  if (subPartsCount > 1) {
    rawScore += Math.min(0.2, (subPartsCount - 1) * 0.08);
  }

  // 4. Marks signal
  if (marks >= 7) {
    rawScore += 0.2;
  } else if (marks >= 4) {
    rawScore += 0.1;
  } else if (marks <= 1 && qType === 'MCQ') {
    rawScore -= 0.1;
  }

  const finalScore = Math.max(0.1, Math.min(0.95, Number(rawScore.toFixed(2))));

  let band: DifficultyBand = 'MEDIUM';
  if (finalScore < 0.35) band = 'EASY';
  else if (finalScore < 0.65) band = 'MEDIUM';
  else if (finalScore < 0.85) band = 'HARD';
  else band = 'VERY_HARD';

  return {
    questionId: question.id || '',
    difficultyBand: band,
    difficultyScore: finalScore,
    difficultyConfidence: confidence,
    difficultySource: source,
    marks,
    hasMathFormula,
    hasCodeBlock,
    subPartsCount,
  };
}

/**
  Saves difficulty profile in D1 database for a question.
 */
export async function saveQuestionDifficultyProfile(
  env: Env,
  questionId: string,
  profile: DifficultyProfile
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO question_difficulty_profiles (
      question_id, difficulty_band, difficulty_score, difficulty_confidence,
      difficulty_source, marks, has_math_formula, has_code_block, sub_parts_count, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(question_id) DO UPDATE SET
      difficulty_band = excluded.difficulty_band,
      difficulty_score = excluded.difficulty_score,
      difficulty_confidence = excluded.difficulty_confidence,
      difficulty_source = excluded.difficulty_source,
      marks = excluded.marks,
      has_math_formula = excluded.has_math_formula,
      has_code_block = excluded.has_code_block,
      sub_parts_count = excluded.sub_parts_count,
      updated_at = CURRENT_TIMESTAMP`
  )
    .bind(
      questionId,
      profile.difficultyBand,
      profile.difficultyScore,
      profile.difficultyConfidence,
      profile.difficultySource,
      profile.marks,
      profile.hasMathFormula ? 1 : 0,
      profile.hasCodeBlock ? 1 : 0,
      profile.subPartsCount
    )
    .run();
}
