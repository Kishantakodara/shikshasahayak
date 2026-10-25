// ============================================================
// QUESTION INTELLIGENCE ENGINE - DUPLICATE DETECTION SERVICE
// Conservative duplicate detection using normalized question text,
// subject codes, question type, and provenance metadata.
// ============================================================

import { MasterQuestion } from '../../../src/types';
import { Env } from '../contentEngine';
import { normalizeQuestionText } from './normalizationService';

export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  confidence: number;
  matchedQuestionId?: string;
  matchedQuestionText?: string;
}

/**
  Calculates string similarity ratio (Dice's Coefficient on character bigrams / word tokens).
 */
export function calculateTextSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0.0;
  
  const stopWords = new Set(['the', 'a', 'an', 'of', 'in', 'to', 'for', 'is', 'are', 'which', 'what', 'and', 'or']);

  // Clean punctuation and normalize spacing around operators (=, +, -, etc.)
  const prep = (s: string) =>
    s
      .toLowerCase()
      .replace(/[\=\+\-\*\/\:\,\;\.\(\)]/g, ' $& ')
      .replace(/[^a-z0-9\=\+\-\*\/\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const s1 = prep(str1);
  const s2 = prep(str2);

  if (s1 === s2) return 1.0;

  const words1 = Array.from(new Set(s1.split(' ').filter(w => w.length > 0 && !stopWords.has(w))));
  const words2 = Array.from(new Set(s2.split(' ').filter(w => w.length > 0 && !stopWords.has(w))));

  if (words1.length === 0 || words2.length === 0) return 0.0;

  const set2 = new Set(words2);
  let intersection = 0;
  for (const w of words1) {
    if (set2.has(w)) intersection++;
  }

  const dice = (2.0 * intersection) / (words1.length + words2.length);
  return Number(dice.toFixed(3));
}

/**
  Detects duplicate questions in master_question_bank using normalized parameters.
 */
export function detectDuplicateQuestion(
  dbRows: Array<{ id: string; question_text: string; subject_name: string; subject_code?: string; question_type: string; exam_year?: number; exam_name?: string }>,
  candidatePayload: Partial<MasterQuestion>
): DuplicateDetectionResult {
  if (!candidatePayload.questionText) {
    return { isDuplicate: false, confidence: 0.0 };
  }

  const candNorm = normalizeQuestionText(candidatePayload.questionText).normalized;
  const candType = String(candidatePayload.questionType || '').toUpperCase();
  const candSubj = (candidatePayload.subjectCode || candidatePayload.subjectName || '').toLowerCase().trim();

  let highestConfidence = 0.0;
  let matchedId: string | undefined;
  let matchedText: string | undefined;

  for (const row of dbRows) {
    const rowType = String(row.question_type || '').toUpperCase();
    
    // Must match question type (MCQ, MSQ, NAT)
    if (rowType !== candType && !(candType === 'MCQ' && rowType === 'SINGLE_CORRECT') && !(candType === 'NAT' && rowType === 'NUMERICAL')) {
      continue;
    }

    const rowSubj = (row.subject_code || row.subject_name || '').toLowerCase().trim();
    const rowNorm = normalizeQuestionText(row.question_text).normalized;

    // Direct similarity
    const sim = calculateTextSimilarity(candNorm, rowNorm);

    // Boost score if exact subject code or exam year matches
    let boostedSim = sim;
    if (sim > 0.7 && rowSubj === candSubj) {
      boostedSim = Math.min(1.0, sim + 0.1);
    }
    if (sim > 0.8 && row.exam_year === candidatePayload.examYear && row.exam_name === candidatePayload.examName) {
      boostedSim = Math.min(1.0, boostedSim + 0.05);
    }

    if (boostedSim > highestConfidence) {
      highestConfidence = Number(boostedSim.toFixed(3));
      matchedId = row.id;
      matchedText = row.question_text;
    }
  }

  // Conservative threshold: only flag duplicate if confidence >= 0.88
  const isDup = highestConfidence >= 0.88;

  return {
    isDuplicate: isDup,
    confidence: highestConfidence,
    matchedQuestionId: isDup ? matchedId : undefined,
    matchedQuestionText: isDup ? matchedText : undefined,
  };
}

/**
  Queries D1 database to detect duplicates against existing stored questions.
 */
export async function detectDuplicateQuestionAsync(
  env: Env,
  candidatePayload: Partial<MasterQuestion>
): Promise<DuplicateDetectionResult> {
  try {
    if (!candidatePayload.questionText) {
      return { isDuplicate: false, confidence: 0.0 };
    }

    let sql = `SELECT id, question_text, subject_name, subject_code, question_type, exam_year, exam_name
               FROM master_question_bank WHERE 1=1`;
    const params: any[] = [];

    if (candidatePayload.semester !== undefined) {
      sql += ` AND semester = ?`;
      params.push(candidatePayload.semester);
    }

    sql += ` LIMIT 200`;

    const stmt = env.DB.prepare(sql);
    const { results } = await (params.length > 0 ? stmt.bind(...params) : stmt).all<Record<string, unknown>>();

    const dbRows = (results || []).map(r => ({
      id: String(r.id),
      question_text: String(r.question_text),
      subject_name: String(r.subject_name),
      subject_code: r.subject_code ? String(r.subject_code) : undefined,
      question_type: String(r.question_type),
      exam_year: r.exam_year ? Number(r.exam_year) : undefined,
      exam_name: r.exam_name ? String(r.exam_name) : undefined,
    }));

    return detectDuplicateQuestion(dbRows, candidatePayload);
  } catch (error) {
    console.error('Error in detectDuplicateQuestionAsync:', error);
    return { isDuplicate: false, confidence: 0.0 };
  }
}

/**
  Finds potential duplicate candidate matches for admin review workspace.
 */
export async function findDuplicateCandidates(
  env: Env,
  questionText: string,
  subjectCode?: string,
  excludeQuestionId?: string
): Promise<Array<{ questionId: string; questionText: string; similarity: number }>> {
  try {
    if (!questionText) return [];
    let sql = `SELECT id, question_text, subject_code FROM master_question_bank WHERE 1=1`;
    const params: any[] = [];
    if (excludeQuestionId) {
      sql += ` AND id != ?`;
      params.push(excludeQuestionId);
    }
    sql += ` LIMIT 100`;

    const { results } = await (params.length > 0 ? env.DB.prepare(sql).bind(...params) : env.DB.prepare(sql)).all<Record<string, unknown>>();

    const matches: Array<{ questionId: string; questionText: string; similarity: number }> = [];
    for (const r of results || []) {
      const sim = calculateTextSimilarity(questionText, String(r.question_text || ''));
      if (sim >= 0.6) {
        matches.push({
          questionId: String(r.id),
          questionText: String(r.question_text || ''),
          similarity: sim,
        });
      }
    }

    return matches.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
  } catch {
    return [];
  }
}

