/**
 * Content Factory V1 — Automated Quality & Schema Validator
 * Validates structural completeness, MCQ consistency, question targets,
 * and flags technical formulas/derivations for mandatory academic review.
 */

import { GeneratedContentPayload, ContentGenerationParams } from './provider';

export interface ValidationResult {
  status: 'valid' | 'flagged' | 'warning';
  issues: string[];
  warnings: string[];
  qualityReviewFlags: string[];
}

export function validateGeneratedContent(
  payload: GeneratedContentPayload,
  params: ContentGenerationParams
): ValidationResult {
  const issues: string[] = [];
  const warnings: string[] = [];
  const qualityReviewFlags: string[] = [];

  // 1. Topic and basic presence
  if (!payload.topic || payload.topic.trim().length === 0) {
    issues.push('Missing topic title in generated payload.');
  }

  // 2. Check each requested content type
  for (const cType of params.contentTypes) {
    switch (cType) {
      case 'detailed_notes':
        if (!payload.detailedNotes || payload.detailedNotes.trim().length < 100) {
          issues.push('Detailed notes are missing or shorter than 100 characters.');
        } else {
          // Check for engineering formulas/derivations
          if (/(\$\$|\\frac|\\sum|\b[a-zA-Z]\s*=\s*[0-9a-zA-Z_+\-*/^]+\b)/.test(payload.detailedNotes)) {
            qualityReviewFlags.push('Detailed Notes contain mathematical formulas/derivations — requires manual academic review.');
          }
        }
        break;

      case 'short_notes':
        if (!payload.shortNotes || payload.shortNotes.trim().length < 50) {
          issues.push('Short notes are missing or shorter than 50 characters.');
        }
        break;

      case 'definitions':
        if (!payload.definitions || payload.definitions.length === 0) {
          issues.push('Definitions array is empty.');
        } else {
          payload.definitions.forEach((d, idx) => {
            if (!d.term || !d.definition) {
              issues.push(`Definition item #${idx + 1} is missing term or definition.`);
            }
          });
          qualityReviewFlags.push('Technical definitions generated — verify against syllabus textbook standard.');
        }
        break;

      case 'examples':
        if (!payload.examples || payload.examples.length === 0) {
          warnings.push('No examples were generated.');
        } else {
          payload.examples.forEach((ex, idx) => {
            if (!ex.title || !ex.scenario || !ex.explanation) {
              issues.push(`Example #${idx + 1} is missing title, scenario, or explanation.`);
            }
          });
        }
        break;

      case 'mcqs':
        if (!payload.mcqs || payload.mcqs.length === 0) {
          issues.push('MCQ question list is empty.');
        } else {
          const expectedCount = params.config?.mcqCount || 5;
          if (payload.mcqs.length < expectedCount) {
            warnings.push(`Expected ${expectedCount} MCQs, received ${payload.mcqs.length}.`);
          }

          payload.mcqs.forEach((m, idx) => {
            if (!m.question || m.question.trim().length === 0) {
              issues.push(`MCQ #${idx + 1} has an empty question string.`);
            }
            if (!Array.isArray(m.options) || m.options.length < 4) {
              issues.push(`MCQ #${idx + 1} must contain at least 4 options.`);
            }
            if (typeof m.answer !== 'number' || m.answer < 0 || m.answer >= (m.options?.length || 4)) {
              issues.push(`MCQ #${idx + 1} has an invalid answer index (${m.answer}).`);
            }
            if (!m.explanation) {
              warnings.push(`MCQ #${idx + 1} is missing answer explanation.`);
            }
          });
        }
        break;

      case 'short_questions':
        if (!payload.shortQuestions || payload.shortQuestions.length === 0) {
          issues.push('Short questions array is empty.');
        } else {
          payload.shortQuestions.forEach((sq, idx) => {
            if (!sq.question || !sq.answer) {
              issues.push(`Short question #${idx + 1} is missing question or answer.`);
            }
          });
        }
        break;

      case 'long_questions':
        if (!payload.longQuestions || payload.longQuestions.length === 0) {
          issues.push('Long questions array is empty.');
        } else {
          payload.longQuestions.forEach((lq, idx) => {
            if (!lq.question || !lq.answer) {
              issues.push(`Long question #${idx + 1} is missing question or model answer.`);
            }
          });
        }
        break;

      case 'numerical_problems':
        if (payload.numericalProblems && payload.numericalProblems.length > 0) {
          payload.numericalProblems.forEach((num, idx) => {
            if (!num.problem || !num.finalAnswer || !num.steps || num.steps.length === 0) {
              issues.push(`Numerical problem #${idx + 1} is missing problem text, solution steps, or final answer.`);
            }
          });
          qualityReviewFlags.push('Numerical problems & answers generated — mandatory manual check of arithmetic and unit conversions.');
        }
        break;

      case 'viva_questions':
        if (!payload.vivaQuestions || payload.vivaQuestions.length === 0) {
          warnings.push('Viva questions array is empty.');
        } else {
          payload.vivaQuestions.forEach((viva, idx) => {
            if (!viva.question || !viva.answer) {
              issues.push(`Viva question #${idx + 1} is missing question or answer.`);
            }
          });
        }
        break;

      case 'quick_revision':
        if (!payload.quickRevision || !payload.quickRevision.summaryPoints || payload.quickRevision.summaryPoints.length === 0) {
          warnings.push('Quick revision summary points are missing.');
        }
        break;
    }
  }

  const status: 'valid' | 'flagged' | 'warning' =
    issues.length > 0 ? 'flagged' : (warnings.length > 0 || qualityReviewFlags.length > 0 ? 'warning' : 'valid');

  return {
    status,
    issues,
    warnings,
    qualityReviewFlags
  };
}
