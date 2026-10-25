// ============================================================
// QUESTION INTELLIGENCE ENGINE - STUDENT PRACTICE INTELLIGENCE
// Adaptive, repeated-PYQ, exam-pattern, and weakness-driven practice
// generation with strict verified-only gating and answer shielding.
// ============================================================

import { Env } from '../contentEngine';
import { getMcqPracticeQuestions } from './mcqPracticeService';
import { QuestionType } from '../../../src/types';

export type StudentPracticeMode =
  | 'WEAK_TOPIC'
  | 'REPEATED_PYQ'
  | 'REVISION'
  | 'EXAM_PATTERN'
  | 'DIFFICULTY_PROGRESSIVE'
  | 'MIXED_PRACTICE';

export interface IntelligentPracticeOptions {
  subjectCode: string;
  semester?: number;
  mode?: StudentPracticeMode;
  targetTopic?: string;
  targetDifficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  limit?: number;
}

export interface StudentPracticeQuestionDTO {
  id: string;
  questionText: string;
  questionType: QuestionType;
  subjectCode?: string;
  subjectName: string;
  semester: number;
  topicName?: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  options?: Array<{ id: string; text: string }>;
  isOriginalPyq: boolean;
  examName?: string | null;
  examYear?: number | null;
  repeatFrequencyBand?: string;
}

export interface StudentPracticeSessionResponse {
  mode: StudentPracticeMode;
  subjectCode: string;
  totalQuestions: number;
  questions: StudentPracticeQuestionDTO[];
}

/**
  Generates intelligent student practice sessions respecting all verified-only
  and answer-key shielding security guarantees.
 */
export async function generateIntelligentPracticeSession(
  env: Env,
  studentId: string,
  options: IntelligentPracticeOptions
): Promise<StudentPracticeSessionResponse> {
  const mode = options.mode || 'MIXED_PRACTICE';
  const limit = Math.min(25, Math.max(1, options.limit || 10));
  const subjectCode = options.subjectCode.trim();
  const semester = options.semester || 1;

  let query = `
    SELECT q.id, q.question_text, q.question_type, q.subject_code, q.subject_name,
           q.semester, q.topic_name, q.difficulty, q.marks, q.options_json,
           q.is_original_pyq, q.exam_name, q.exam_year,
           c.repeat_frequency_band
    FROM master_question_bank q
    LEFT JOIN question_duplicate_cluster_members m ON q.id = m.question_id
    LEFT JOIN question_duplicate_clusters c ON m.cluster_id = c.id
    WHERE q.verification_status = 'verified' AND q.subject_code = ?
  `;

  const params: any[] = [subjectCode];

  // Apply mode-specific filters
  if (mode === 'REPEATED_PYQ') {
    query += ` AND (c.repeat_frequency_band IN ('VERY_HIGH_REPEAT', 'HIGH_REPEAT', 'MEDIUM_REPEAT') OR q.is_original_pyq = 1)`;
  } else if (mode === 'WEAK_TOPIC' && options.targetTopic) {
    query += ` AND q.topic_name = ?`;
    params.push(options.targetTopic.trim());
  } else if (mode === 'DIFFICULTY_PROGRESSIVE' && options.targetDifficulty) {
    query += ` AND UPPER(q.difficulty) = ?`;
    params.push(options.targetDifficulty);
  }

  query += ` ORDER BY RANDOM() LIMIT ?`;
  params.push(limit);

  const rows = await env.DB.prepare(query).bind(...params).all<Record<string, unknown>>();

  const questions: StudentPracticeQuestionDTO[] = (rows.results || []).map(r => {
    let opts: Array<{ id: string; text: string }> = [];
    if (r.options_json) {
      try {
        const parsed = JSON.parse(String(r.options_json));
        opts = Array.isArray(parsed)
          ? parsed.map((o: any, idx: number) => ({
              id: typeof o === 'string' ? String(idx) : String(o.id || idx),
              text: typeof o === 'string' ? o : String(o.text || ''),
            }))
          : [];
      } catch {
        opts = [];
      }
    }

    // Shield all answers
    return {
      id: String(r.id),
      questionText: String(r.question_text || ''),
      questionType: (String(r.question_type || 'MCQ') as QuestionType),
      subjectCode: r.subject_code ? String(r.subject_code) : undefined,
      subjectName: String(r.subject_name || 'Engineering'),
      semester: Number(r.semester || semester),
      topicName: r.topic_name ? String(r.topic_name) : null,
      difficulty: (String(r.difficulty || 'medium').toLowerCase() as 'easy' | 'medium' | 'hard'),
      marks: Number(r.marks || 1),
      options: opts,
      isOriginalPyq: Number(r.is_original_pyq) === 1,
      examName: r.exam_name ? String(r.exam_name) : null,
      examYear: r.exam_year ? Number(r.exam_year) : null,
      repeatFrequencyBand: r.repeat_frequency_band ? String(r.repeat_frequency_band) : undefined,
    };
  });

  return {
    mode,
    subjectCode,
    totalQuestions: questions.length,
    questions,
  };
}
