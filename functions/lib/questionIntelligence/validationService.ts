// ============================================================
// QUESTION INTELLIGENCE ENGINE - VALIDATION SERVICE
// Strict payload validation for MCQ, MSQ, NAT question structures,
// required fields, and provenance invariants (Original PYQ vs AI Practice).
// ============================================================

import { MasterQuestion, McqOptionSpec, MsqOptionSpec, NatAcceptableRange } from '../../../src/types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
  Detects whether an option array contains generic placeholder/dummy choices
  such as "Option Choice A", "Option Choice B", "Option A", "Option 1", "Choice A", "Dummy Option".
 */
export function containsPlaceholderOptions(options: Array<{ id?: string; text?: string; value?: string } | string>): boolean {
  if (!Array.isArray(options) || options.length === 0) return false;

  const placeholderPatterns = [
    /^option\s*(choice\s*)?[a-d0-9]$/i,
    /^choice\s*[a-d0-9]$/i,
    /^dummy\s*option/i,
    /^placeholder/i,
    /^sample\s*option/i,
    /^option\s*text/i,
  ];

  let matchCount = 0;
  for (const opt of options) {
    const text = typeof opt === 'string' ? opt.trim() : String(opt?.text || opt?.value || '').trim();
    if (placeholderPatterns.some(pat => pat.test(text))) {
      matchCount++;
    }
  }

  return matchCount >= 2;
}

/**
  Validates MCQ question payload specs.
 */
export function validateMcqPayload(
  options: McqOptionSpec[] | any[],
  correctAnswer: string
): ValidationResult {
  const errors: string[] = [];

  if (!Array.isArray(options) || options.length < 2) {
    errors.push('MCQ requires an options array with at least 2 choices');
  } else {
    if (containsPlaceholderOptions(options)) {
      errors.push('MCQ contains generic placeholder/dummy options (e.g. Option Choice A) and cannot be verified');
    }
    const texts = options.map(o => (typeof o === 'string' ? o : o.text || o.value || '').trim());
    if (texts.some(t => !t)) {
      errors.push('MCQ contains empty or whitespace-only option choices');
    }
    const uniqueTexts = new Set(texts.map(t => t.toLowerCase()));
    if (uniqueTexts.size < texts.length) {
      errors.push('MCQ contains duplicate option choices');
    }
  }

  if (!correctAnswer || typeof correctAnswer !== 'string' || !correctAnswer.trim()) {
    errors.push('MCQ requires exactly one correct answer reference string');
  } else if (Array.isArray(options) && options.length >= 2) {
    const trimmedAnswer = correctAnswer.trim();
    const optionIds = options.map((opt, idx) => {
      if (typeof opt === 'string') return String(idx);
      return String(opt.id || opt.value || idx);
    });

    const isMatch = optionIds.includes(trimmedAnswer) || options.some(opt => typeof opt === 'object' && opt.isCorrect === true);
    if (!isMatch) {
      errors.push(`MCQ correct answer '${correctAnswer}' does not match any valid option in the options array [${optionIds.join(', ')}]`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
  Validates MSQ (Multiple Select Question) payload specs.
 */
export function validateMsqPayload(
  options: MsqOptionSpec[] | any[],
  correctAnswers: string[] | any
): ValidationResult {
  const errors: string[] = [];

  if (!Array.isArray(options) || options.length < 2) {
    errors.push('MSQ requires an options array with at least 2 choices');
  } else {
    if (containsPlaceholderOptions(options)) {
      errors.push('MSQ contains generic placeholder/dummy options (e.g. Option Choice A) and cannot be verified');
    }
    const texts = options.map(o => (typeof o === 'string' ? o : o.text || o.value || '').trim());
    if (texts.some(t => !t)) {
      errors.push('MSQ contains empty or whitespace-only option choices');
    }
    const uniqueTexts = new Set(texts.map(t => t.toLowerCase()));
    if (uniqueTexts.size < texts.length) {
      errors.push('MSQ contains duplicate option choices');
    }
  }

  let answersArray: string[] = [];
  if (Array.isArray(correctAnswers)) {
    answersArray = correctAnswers.map(a => String(a).trim());
  } else if (typeof correctAnswers === 'string') {
    try {
      const parsed = JSON.parse(correctAnswers);
      if (Array.isArray(parsed)) answersArray = parsed.map(a => String(a).trim());
    } catch {
      if (correctAnswers.trim()) answersArray = [correctAnswers.trim()];
    }
  }

  if (answersArray.length < 1) {
    errors.push('MSQ requires at least one correct answer in the correctAnswers array');
  } else if (Array.isArray(options) && options.length >= 2) {
    const optionIds = options.map((opt, idx) => {
      if (typeof opt === 'string') return String(idx);
      return String(opt.id || opt.value || idx);
    });

    for (const ans of answersArray) {
      if (!optionIds.includes(ans)) {
        errors.push(`MSQ correct answer '${ans}' does not match any valid option in options array [${optionIds.join(', ')}]`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
  Validates NAT (Numerical Answer Type) payload specs.
 */
export function validateNatPayload(
  correctAnswer: string | number,
  acceptableRange?: NatAcceptableRange | any
): ValidationResult {
  const errors: string[] = [];

  let hasValidExact = false;
  if (correctAnswer !== undefined && correctAnswer !== null && String(correctAnswer).trim() !== '') {
    const parsedVal = Number(correctAnswer);
    if (!isNaN(parsedVal)) {
      hasValidExact = true;
    }
  }

  let hasValidRange = false;
  if (acceptableRange && typeof acceptableRange === 'object') {
    const min = Number(acceptableRange.min);
    const max = Number(acceptableRange.max);
    if (!isNaN(min) && !isNaN(max)) {
      hasValidRange = true;
      if (min > max) {
        errors.push(`NAT acceptable range min (${min}) cannot be greater than max (${max})`);
      }
    }
  } else if (typeof acceptableRange === 'string' && acceptableRange.trim()) {
    try {
      const parsed = JSON.parse(acceptableRange);
      if (parsed && typeof parsed === 'object') {
        const min = Number(parsed.min);
        const max = Number(parsed.max);
        if (!isNaN(min) && !isNaN(max)) {
          hasValidRange = true;
          if (min > max) errors.push(`NAT acceptable range min (${min}) cannot be greater than max (${max})`);
        }
      }
    } catch {
      // ignore
    }
  }

  if (!hasValidExact && !hasValidRange) {
    errors.push('NAT question requires either a valid numerical correct answer or a min-max acceptable range');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
  Validates provenance rules (Original PYQ vs AI Practice).
 */
export function validateProvenance(data: Partial<MasterQuestion>): ValidationResult {
  const errors: string[] = [];

  const isAi = Boolean(data.isAiGenerated) || data.sourceType === 'AI_PRACTICE';
  const isOriginal = Boolean(data.isOriginalPyq);

  // Invariant 1: AI Practice and Original PYQ are mutually exclusive
  if (isAi && isOriginal) {
    errors.push('A question CANNOT be marked as both an Original PYQ and AI-generated practice question');
  }

  if (isOriginal) {
    if (!data.sourceType || data.sourceType === 'AI_PRACTICE') {
      errors.push('Original PYQ requires a valid non-AI source_type (e.g. GTU, GATE, TEACHER)');
    }
    if (!data.examName || !data.examName.trim()) {
      errors.push('Original PYQ requires an exam_name (e.g. GTU or GATE)');
    }
    if (data.examYear === undefined || data.examYear === null || isNaN(Number(data.examYear))) {
      errors.push('Original PYQ requires a valid exam_year (e.g. 2024)');
    }
    if (data.isAiGenerated === true) {
      errors.push('Original PYQ must have is_ai_generated = false');
    }
  }

  if (isAi) {
    if (data.isAiGenerated !== true) {
      errors.push('AI practice question must have is_ai_generated = true');
    }
    if (data.isOriginalPyq === true) {
      errors.push('AI practice question must have is_original_pyq = false');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
  Full validation entry point for MasterQuestion payloads.
 */
export function validateMasterQuestionPayload(data: Partial<MasterQuestion>): ValidationResult {
  const errors: string[] = [];

  if (!data.questionText || !data.questionText.trim()) {
    errors.push('Question text is required');
  }

  if (!data.subjectName || !data.subjectName.trim()) {
    errors.push('Subject name is required');
  }

  if (data.semester === undefined || data.semester === null || data.semester < 0 || data.semester > 12) {
    errors.push('Semester must be an integer between 0 and 12');
  }

  if (!data.questionType) {
    errors.push('Question type (MCQ, MSQ, or NAT) is required');
  } else {
    const qType = String(data.questionType).toUpperCase();
    if (!['MCQ', 'MSQ', 'NAT', 'DESCRIPTIVE', 'SINGLE_CORRECT', 'MULTIPLE_CORRECT', 'NUMERICAL'].includes(qType)) {
      errors.push(`Invalid question type '${data.questionType}'. Must be MCQ, MSQ, NAT, or DESCRIPTIVE.`);
    } else if (qType === 'MCQ' || qType === 'SINGLE_CORRECT') {
      let optionsList: any[] = [];
      if (data.mcqData?.options) optionsList = data.mcqData.options;
      else if (Array.isArray(data.options)) optionsList = data.options;
      else if (typeof data.optionsJson === 'string') {
        try { optionsList = JSON.parse(data.optionsJson); } catch { /* empty */ }
      }
      const rawAnswer = data.mcqData?.correctAnswer || data.correctAnswerJson || data.correctAnswer || '';
      const ans = Array.isArray(rawAnswer) ? (rawAnswer.length === 1 ? String(rawAnswer[0]) : '') : String(rawAnswer);
      const mcqRes = validateMcqPayload(optionsList, ans);
      errors.push(...mcqRes.errors);
    } else if (qType === 'MSQ' || qType === 'MULTIPLE_CORRECT') {
      let optionsList: any[] = [];
      if (data.msqData?.options) optionsList = data.msqData.options;
      else if (Array.isArray(data.options)) optionsList = data.options;
      else if (typeof data.optionsJson === 'string') {
        try { optionsList = JSON.parse(data.optionsJson); } catch { /* empty */ }
      }
      const answers = data.msqData?.correctAnswers || data.correctAnswerJson || data.correctAnswer || [];
      const msqRes = validateMsqPayload(optionsList, answers);
      errors.push(...msqRes.errors);
    } else if (qType === 'NAT' || qType === 'NUMERICAL') {
      const exact = data.natData?.exactValue !== undefined
        ? data.natData.exactValue
        : (data.correctAnswerJson !== undefined ? data.correctAnswerJson : ((data as any).correctAnswer !== undefined ? (data as any).correctAnswer : ''));
      const range = data.natData?.acceptableRange || data.acceptableNumericalRangeJson || (data as any).acceptableNumericalRange;
      const natRes = validateNatPayload(exact, range);
      errors.push(...natRes.errors);
    }

  }

  // Provenance Validation
  const provRes = validateProvenance(data);
  errors.push(...provRes.errors);

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
  Alias for validateMasterQuestionPayload.
 */
export function validateQuestionPayload(data: any): ValidationResult {
  const payload: Partial<MasterQuestion> = {
    questionText: data.questionText,
    questionType: data.questionType,
    subjectCode: data.subjectCode,
    subjectName: data.subjectName,
    semester: data.semester !== undefined ? data.semester : 1,
    isOriginalPyq: data.isOriginalPyq !== undefined ? data.isOriginalPyq : true,
    isAiGenerated: data.isAiGenerated !== undefined ? data.isAiGenerated : false,
    sourceType: data.sourceType || (data.isAiGenerated ? 'AI_PRACTICE' : 'GTU'),
    examName: data.examName || 'GTU',
    examYear: data.examYear !== undefined ? data.examYear : 2024,
    mcqData: data.questionType === 'MCQ' ? { options: data.options || [], correctAnswer: data.correctAnswer } : undefined,
    msqData: data.questionType === 'MSQ' ? { options: data.options || [], correctAnswers: Array.isArray(data.correctAnswer) ? data.correctAnswer : [data.correctAnswer] } : undefined,
    natData: data.questionType === 'NAT' ? { exactValue: data.correctAnswer, acceptableRange: data.acceptableNumericalRange || data.acceptableRange } : undefined,
  };

  return validateMasterQuestionPayload(payload);
}

