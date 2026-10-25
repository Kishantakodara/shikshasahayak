// ============================================================
// QUESTION INTELLIGENCE ENGINE - QUESTION QUALITY ENGINE
// Multi-dimensional deterministic quality scoring, explainable flags,
// and OCR / formatting / provenance health evaluation.
// ============================================================

import { MasterQuestion } from '../../../../src/types';
import { containsPlaceholderOptions, validateQuestionPayload } from '../validationService';
import { validateSubjectSpecificPayload } from '../transformationEngine/technicalValidatorService';

export type QualityFlag =
  | 'MATH_FORMAT_VALID'
  | 'PROVENANCE_COMPLETE'
  | 'OPTIONS_COMPLETE'
  | 'NO_PLACEHOLDER'
  | 'LOW_DUPLICATE_RISK'
  | 'HIGH_DUPLICATE_RISK'
  | 'MALFORMED_CONTENT_FLAG'
  | 'OCR_ARTIFACTS_FLAG'
  | 'POOR_EXPLANATION'
  | 'MISSING_TOPIC'
  | 'DESCRIPTIVE_PRESERVED'
  | 'TECHNICAL_VALIDATION_PASSED';

export interface DeterministicQualityReport {
  qualityScore: number; // 0 to 100
  qualityBand: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'NEEDS_REVIEW' | 'CRITICAL';
  flags: QualityFlag[];
  warnings: string[];
  errors: string[];
  isEligibleForReview: boolean;
  explainableSummary: string;
}

/**
  Evaluates a question payload across multiple deterministic quality dimensions.
  Quality score informs reviewer priority and NEVER replaces authoritative moderation.
 */
export function evaluateDeterministicQuestionQuality(
  data: Partial<MasterQuestion>
): DeterministicQualityReport {
  let score = 100;
  const flags: QualityFlag[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  const text = String(data.questionText || '').trim();
  const qType = String(data.questionType || '').toUpperCase();

  // 1. Text completeness & OCR artifact detection
  if (!text) {
    errors.push('Question text is completely empty');
    flags.push('MALFORMED_CONTENT_FLAG');
    score -= 50;
  } else if (text.length < 10) {
    warnings.push('Question text is very short (< 10 chars)');
    score -= 15;
  }

  // Detect OCR artifacts (e.g. broken encoding \ufffd, repeated underscores, strange gibberish)
  if (/[\uFFFD\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(text) || /_{5,}/.test(text)) {
    flags.push('OCR_ARTIFACTS_FLAG');
    warnings.push('Question contains possible OCR artifacts or unprintable control characters');
    score -= 15;
  }

  // 2. Math & formatting validation
  const subjRes = validateSubjectSpecificPayload(data);
  if (subjRes.warnings.length > 0) {
    warnings.push(...subjRes.warnings);
    score -= Math.min(15, subjRes.warnings.length * 5);
  } else {
    flags.push('MATH_FORMAT_VALID');
  }

  // 3. Provenance completeness
  const isOriginal = Boolean(data.isOriginalPyq);
  const isAi = Boolean(data.isAiGenerated) || data.sourceType === 'AI_PRACTICE';

  if (isOriginal && isAi) {
    errors.push('Provenance violation: marked as both original PYQ and AI-generated');
    flags.push('MALFORMED_CONTENT_FLAG');
    score -= 40;
  } else if (isOriginal) {
    if (data.examName && data.examYear) {
      flags.push('PROVENANCE_COMPLETE');
    } else {
      warnings.push('Original PYQ missing explicit examName or examYear');
      score -= 10;
    }
  } else if (isAi) {
    flags.push('PROVENANCE_COMPLETE');
  }

  // 4. Options & Placeholder check (for MCQs / MSQs)
  if (qType === 'MCQ' || qType === 'SINGLE_CORRECT' || qType === 'MSQ' || qType === 'MULTIPLE_CORRECT') {
    const options = data.mcqData?.options || data.msqData?.options || (data.optionsJson ? JSON.parse(data.optionsJson) : []);
    if (!Array.isArray(options) || options.length < 2) {
      errors.push('Options array is missing or contains fewer than 2 choices');
      flags.push('MALFORMED_CONTENT_FLAG');
      score -= 30;
    } else if (containsPlaceholderOptions(options)) {
      errors.push('Options contain generic dummy placeholders (e.g. Option Choice A)');
      flags.push('MALFORMED_CONTENT_FLAG');
      score -= 40;
    } else {
      flags.push('OPTIONS_COMPLETE');
      flags.push('NO_PLACEHOLDER');
    }
  } else if (qType === 'NAT' || qType === 'NUMERICAL') {
    const range = data.natData?.acceptableRange || (typeof data.acceptableNumericalRangeJson === 'string' ? JSON.parse(data.acceptableNumericalRangeJson) : data.acceptableNumericalRangeJson);
    if (range && typeof range === 'object' && range.min !== undefined && range.max !== undefined && Number(range.min) > Number(range.max)) {
      flags.push('MALFORMED_CONTENT_FLAG');
      errors.push(`NAT acceptable range min (${range.min}) cannot exceed max (${range.max})`);
      score -= 40;
    }
  } else if (qType === 'DESCRIPTIVE' || !qType || qType === 'NULL') {
    flags.push('DESCRIPTIVE_PRESERVED');
  }

  // 5. Explanation check
  if (!data.explanation || !data.explanation.trim()) {
    flags.push('POOR_EXPLANATION');
    warnings.push('Question lacks step-by-step technical explanation');
    score -= 10;
  }

  // 6. Topic mapping check
  if (!data.topicName && !data.curriculumNodeId) {
    flags.push('MISSING_TOPIC');
    warnings.push('Question lacks mapped curriculum topic or node');
    score -= 5;
  }

  // 7. Technical validation check
  const valResult = validateQuestionPayload({
    questionText: text,
    questionType: (data.questionType as any) || 'DESCRIPTIVE',
    subjectName: data.subjectName || 'Engineering',
    semester: data.semester || 1,
    isOriginalPyq: data.isOriginalPyq,
    isAiGenerated: data.isAiGenerated,
    examName: data.examName,
    examYear: data.examYear,
    sourceType: data.sourceType,
    options: data.mcqData?.options || data.msqData?.options,
    correctAnswer: data.mcqData?.correctAnswer || data.msqData?.correctAnswers,
    natData: data.natData,
  } as any);

  if (valResult.isValid) {
    flags.push('TECHNICAL_VALIDATION_PASSED');
  } else {
    errors.push(...valResult.errors);
    score -= 20;
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  let qualityBand: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'NEEDS_REVIEW' | 'CRITICAL' = 'EXCELLENT';
  if (finalScore >= 85) qualityBand = 'EXCELLENT';
  else if (finalScore >= 70) qualityBand = 'GOOD';
  else if (finalScore >= 55) qualityBand = 'FAIR';
  else if (finalScore >= 40) qualityBand = 'NEEDS_REVIEW';
  else qualityBand = 'CRITICAL';

  const isEligibleForReview = errors.length === 0 && finalScore >= 40;
  const explainableSummary = `Quality Score: ${finalScore}/100 (${qualityBand}). Active Flags: [${flags.join(', ')}]. Warnings: ${warnings.length}, Errors: ${errors.length}.`;

  return {
    qualityScore: finalScore,
    qualityBand,
    flags,
    warnings,
    errors,
    isEligibleForReview,
    explainableSummary,
  };
}
