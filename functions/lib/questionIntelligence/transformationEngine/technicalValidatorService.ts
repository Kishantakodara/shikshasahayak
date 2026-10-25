// ============================================================
// QUESTION INTELLIGENCE ENGINE - TECHNICAL VALIDATOR SERVICE
// Enforces strict engineering standards, answer verification,
// option consistency, numerical range precision, and status transitions.
// ============================================================

import { MasterQuestion, QuestionVerificationStatus } from '../../../../src/types';
import { containsPlaceholderOptions } from '../validationService';

export interface TechnicalValidationResult {
  status: 'VERIFIED' | 'NEEDS_REVIEW' | 'REJECTED';
  isValid: boolean;
  errors: string[];
  warnings: string[];
  qualityScore: number; // 0 to 100
}

/**
  Validates MCQ question payload against engineering quality standards.
 */
export function validateMcqTechnicalQuality(data: Partial<MasterQuestion>): TechnicalValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let score = 100;

  const options = data.mcqData?.options || [];
  const correctAnswer = (data.mcqData?.correctAnswer || data.correctAnswerJson || '').trim();

  // 1. Option count
  if (!Array.isArray(options) || options.length !== 4) {
    errors.push(`MCQ must contain exactly 4 options (found ${options.length || 0})`);
    score -= 30;
  } else if (containsPlaceholderOptions(options)) {
    errors.push('MCQ contains generic placeholder/dummy options (e.g. Option Choice A)');
    score -= 60;
  }

  // 2. Empty or duplicate options
  if (Array.isArray(options) && options.length > 0) {
    const texts = options.map(o => (typeof o === 'string' ? o : o.text || '').trim().toLowerCase());
    if (texts.some(t => !t)) {
      errors.push('MCQ contains empty or whitespace-only option text');
      score -= 25;
    }
    const uniqueTexts = new Set(texts);
    if (uniqueTexts.size < texts.length) {
      errors.push('MCQ contains duplicate option choices');
      score -= 25;
    }
  }

  // 3. Correct answer match
  if (!correctAnswer) {
    errors.push('MCQ missing correct answer reference');
    score -= 40;
  } else if (Array.isArray(options) && options.length === 4) {
    const validIds = options.map((o, idx) => (typeof o === 'string' ? String(idx) : String(o.id || idx)));
    if (!validIds.includes(correctAnswer)) {
      errors.push(`MCQ correct answer '${correctAnswer}' does not match any valid option ID [${validIds.join(', ')}]`);
      score -= 40;
    }
  }

  // 4. Explanation requirement
  if (!data.explanation || !data.explanation.trim()) {
    warnings.push('MCQ lacks technical explanation or step-by-step reasoning');
    score -= 10;
  }

  let status: 'VERIFIED' | 'NEEDS_REVIEW' | 'REJECTED' = 'VERIFIED';
  if (errors.length > 0) {
    status = score < 50 ? 'REJECTED' : 'NEEDS_REVIEW';
  } else if (warnings.length > 0 || score < 90) {
    status = 'NEEDS_REVIEW';
  }

  return {
    status,
    isValid: errors.length === 0,
    errors,
    warnings,
    qualityScore: Math.max(0, score),
  };
}

/**
  Validates MSQ (Multiple Select Question) payload against engineering standards.
 */
export function validateMsqTechnicalQuality(data: Partial<MasterQuestion>): TechnicalValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let score = 100;

  const options = data.msqData?.options || [];
  const correctAnswers = data.msqData?.correctAnswers || [];

  // 1. Option count
  if (!Array.isArray(options) || options.length < 2) {
    errors.push('MSQ requires an options array with at least 2 choices');
    score -= 30;
  } else if (containsPlaceholderOptions(options)) {
    errors.push('MSQ contains generic placeholder/dummy options (e.g. Option Choice A)');
    score -= 60;
  }

  // 2. Duplicate or empty options
  if (Array.isArray(options) && options.length > 0) {
    const texts = options.map(o => (typeof o === 'string' ? o : o.text || '').trim().toLowerCase());
    if (texts.some(t => !t)) {
      errors.push('MSQ contains empty option choices');
      score -= 25;
    }
    if (new Set(texts).size < texts.length) {
      errors.push('MSQ contains duplicate option choices');
      score -= 25;
    }
  }

  // 3. At least 2 correct answers for MSQ
  if (!Array.isArray(correctAnswers) || correctAnswers.length < 2) {
    errors.push('MSQ requires at least 2 correct options in correctAnswers array');
    score -= 35;
  } else if (Array.isArray(options) && options.length >= 2) {
    const validIds = options.map((o, idx) => (typeof o === 'string' ? String(idx) : String(o.id || idx)));
    for (const ans of correctAnswers) {
      if (!validIds.includes(String(ans).trim())) {
        errors.push(`MSQ correct answer '${ans}' does not match any valid option ID`);
        score -= 20;
      }
    }
  }

  // 4. Technical explanation
  if (!data.explanation || !data.explanation.trim()) {
    warnings.push('MSQ lacks technical explanation for each option choice');
    score -= 10;
  }

  let status: 'VERIFIED' | 'NEEDS_REVIEW' | 'REJECTED' = 'VERIFIED';
  if (errors.length > 0) {
    status = score < 50 ? 'REJECTED' : 'NEEDS_REVIEW';
  } else if (warnings.length > 0 || score < 90) {
    status = 'NEEDS_REVIEW';
  }

  return {
    status,
    isValid: errors.length === 0,
    errors,
    warnings,
    qualityScore: Math.max(0, score),
  };
}

/**
  Validates NAT (Numerical Answer Type) payload against precision standards.
 */
export function validateNatTechnicalQuality(data: Partial<MasterQuestion>): TechnicalValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let score = 100;

  const exact = data.natData?.exactValue !== undefined ? data.natData.exactValue : data.correctAnswerJson;
  const range = data.natData?.acceptableRange || (data.acceptableNumericalRangeJson ? JSON.parse(data.acceptableNumericalRangeJson) : null);

  let hasValidNumber = false;
  if (exact !== undefined && exact !== null && String(exact).trim() !== '') {
    if (!isNaN(Number(exact))) {
      hasValidNumber = true;
    }
  }

  let hasValidRange = false;
  if (range && typeof range === 'object') {
    const min = Number(range.min);
    const max = Number(range.max);
    if (!isNaN(min) && !isNaN(max)) {
      hasValidRange = true;
      if (min > max) {
        errors.push(`NAT acceptable range min (${min}) cannot exceed max (${max})`);
        score -= 40;
      }
    }
  }

  if (!hasValidNumber && !hasValidRange) {
    errors.push('NAT question requires a valid numerical answer or acceptable min-max range');
    score -= 40;
  }

  if (!data.explanation && (!data.stepByStepSolution || data.stepByStepSolution.length === 0)) {
    warnings.push('NAT question lacks step-by-step numerical calculation steps');
    score -= 10;
  }

  let status: 'VERIFIED' | 'NEEDS_REVIEW' | 'REJECTED' = 'VERIFIED';
  if (errors.length > 0) {
    status = score < 50 ? 'REJECTED' : 'NEEDS_REVIEW';
  } else if (warnings.length > 0 || score < 90) {
    status = 'NEEDS_REVIEW';
  }

  return {
    status,
    isValid: errors.length === 0,
    errors,
    warnings,
    qualityScore: Math.max(0, score),
  };
}

/**
  Subject-specific validation for First-Year engineering disciplines.
  Emits warnings for non-critical formatting and errors only for destructive syntax issues.
 */
export function validateSubjectSpecificPayload(data: Partial<MasterQuestion>): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const code = String(data.subjectCode || '').trim();
  const name = String(data.subjectName || '').toLowerCase();
  const text = String(data.questionText || '');

  // 1. Mathematics (3110014, 3110015, Maths)
  if (code === '3110014' || code === '3110015' || name.includes('math')) {
    const hasLatex = text.includes('$') || text.includes('\\') || text.includes('int_') || text.includes('matrix');
    const hasUnclosedBrackets = (text.match(/\[/g) || []).length !== (text.match(/\]/g) || []).length;
    if (hasUnclosedBrackets) {
      warnings.push('Mathematics question has mismatched brackets [ ] in matrix/interval notation');
    }
  }

  // 2. Physics (3110018, Physics)
  if (code === '3110018' || name.includes('physics')) {
    const hasFormulaOrUnits = /[\d.]+\s*(m\/s|km\/h|kg|N|J|W|Hz|eV|K|Pa|T|Wb)\b/i.test(text) || text.includes('\\') || text.includes('=');
    if (!hasFormulaOrUnits && text.length > 50 && !text.includes('?')) {
      warnings.push('Physics question may lack explicit physical units or equation definition');
    }
  }

  // 3. Basic Electrical Engineering (3110005, BEE, Electrical)
  if (code === '3110005' || name.includes('electrical') || name.includes('bee')) {
    const hasElectricalNotation = /\b(V|A|W|kW|kVA|Hz|ohm|ohms|Ω|Henry|H|Farad|F|AC|DC|R-L-C|transformer)\b/i.test(text);
    if (!hasElectricalNotation && text.length > 100) {
      warnings.push('Electrical question lacks standard electrical parameters or units (V, A, W, Hz, Ω)');
    }
  }

  // 4. Programming for Problem Solving (3110003, PPS, Programming)
  if (code === '3110003' || name.includes('programming') || name.includes('pps')) {
    const hasCodeSnippet = text.includes('int ') || text.includes('main(') || text.includes('#include') || text.includes('printf(') || text.includes('for(') || text.includes('while(');
    if (hasCodeSnippet) {
      const openBraces = (text.match(/\{/g) || []).length;
      const closeBraces = (text.match(/\}/g) || []).length;
      if (openBraces !== closeBraces) {
        warnings.push('C/Programming snippet has unmatched curly braces { } — check code indentation and format');
      }
    }
  }

  // 5. English (3110002, English)
  if (code === '3110002' || name.includes('english')) {
    if (text.length > 30 && !text.includes('?') && !text.includes('.') && !text.includes(':')) {
      warnings.push('English question text lacks standard terminal punctuation (. or ? or :)');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
  Full technical validation for MasterQuestion payloads.
 */
export function validateTechnicalQuestion(data: Partial<MasterQuestion>): TechnicalValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Question text requirement
  if (!data.questionText || !data.questionText.trim()) {
    errors.push('Question text is missing or empty');
  }

  // Provenance mutual exclusivity check
  const isAi = Boolean(data.isAiGenerated) || data.sourceType === 'AI_PRACTICE';
  const isOriginal = Boolean(data.isOriginalPyq);

  if (isAi && isOriginal) {
    errors.push('Question CANNOT be marked as both Original PYQ and AI-generated practice question');
  }

  // Subject-specific validation
  const subjRes = validateSubjectSpecificPayload(data);
  errors.push(...subjRes.errors);
  warnings.push(...subjRes.warnings);

  const qType = String(data.questionType || '').toUpperCase();
  let typeRes: TechnicalValidationResult = {
    status: 'VERIFIED',
    isValid: true,
    errors: [],
    warnings: [],
    qualityScore: 100,
  };

  if (qType === 'MCQ' || qType === 'SINGLE_CORRECT') {
    typeRes = validateMcqTechnicalQuality(data);
  } else if (qType === 'MSQ' || qType === 'MULTIPLE_CORRECT') {
    typeRes = validateMsqTechnicalQuality(data);
  } else if (qType === 'NAT' || qType === 'NUMERICAL') {
    typeRes = validateNatTechnicalQuality(data);
  } else {
    errors.push(`Unsupported question type '${data.questionType}' for technical verification`);
    typeRes.status = 'NEEDS_REVIEW';
  }

  const allErrors = [...errors, ...typeRes.errors];
  const allWarnings = [...warnings, ...typeRes.warnings];
  const finalScore = Math.max(0, typeRes.qualityScore - errors.length * 20);

  let finalStatus: 'VERIFIED' | 'NEEDS_REVIEW' | 'REJECTED' = typeRes.status;
  if (allErrors.length > 0) {
    finalStatus = finalScore < 50 ? 'REJECTED' : 'NEEDS_REVIEW';
  }

  return {
    status: finalStatus,
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    qualityScore: finalScore,
  };
}
