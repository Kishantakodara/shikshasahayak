// ============================================================
// QUESTION INTELLIGENCE ENGINE - EXAM PATTERN INTELLIGENCE SERVICE
// Analytics for GTU exam patterns, topic frequencies, marks distribution,
// repeated question representation, and recurring concepts across sessions.
// ============================================================

import { Env } from '../contentEngine';

export interface ExamPatternReport {
  subjectCode: string;
  totalQuestionsAnalyzed: number;
  totalMarksAnalyzed: number;
  questionTypeFrequency: Record<string, number>;
  difficultyDistribution: Record<string, number>;
  marksDistribution: Record<string, number>;
  unitFrequency: Array<{ unitNo: number; unitName: string; questionCount: number; percentage: number }>;
  topTopicFrequency: Array<{ topicName: string; count: number; percentage: number }>;
  recurringConcepts: Array<{ concept: string; occurrences: number }>;
  repeatedQuestionsPercentage: number;
}

/**
  Generates comprehensive Exam Pattern Intelligence for a subject.
 */
export async function generateExamPatternReport(
  env: Env,
  subjectCode: string
): Promise<ExamPatternReport> {
  const code = subjectCode.trim();

  // 1. Fetch questions for the subject
  const qRows = await env.DB.prepare(
    `SELECT id, question_type, marks, difficulty, topic_name, explanation
     FROM master_question_bank
     WHERE subject_code = ? AND verification_status = 'verified'`
  )
    .bind(code)
    .all<{
      id: string;
      question_type: string;
      marks?: number;
      difficulty?: string;
      topic_name?: string;
      explanation?: string;
    }>();

  const questions = qRows.results || [];
  const totalQuestionsAnalyzed = questions.length;

  let totalMarks = 0;
  const typeFreq: Record<string, number> = {};
  const diffFreq: Record<string, number> = { EASY: 0, MEDIUM: 0, HARD: 0, VERY_HARD: 0 };
  const marksFreq: Record<string, number> = {};
  const topicCounts: Record<string, number> = {};

  for (const q of questions) {
    const qType = String(q.question_type || 'DESCRIPTIVE').toUpperCase();
    typeFreq[qType] = (typeFreq[qType] || 0) + 1;

    const m = q.marks !== undefined && q.marks !== null ? Number(q.marks) : 1;
    totalMarks += m;
    const mKey = `${m}M`;
    marksFreq[mKey] = (marksFreq[mKey] || 0) + 1;

    const d = String(q.difficulty || 'medium').toUpperCase();
    if (diffFreq[d] !== undefined) diffFreq[d]++;
    else diffFreq['MEDIUM']++;

    if (q.topic_name && q.topic_name.trim()) {
      const top = q.topic_name.trim();
      topicCounts[top] = (topicCounts[top] || 0) + 1;
    }
  }

  // 2. Fetch Curriculum Unit mappings
  const mapRows = await env.DB.prepare(
    `SELECT unit_no, unit_name, COUNT(*) as cnt
     FROM question_curriculum_mappings
     WHERE subject_code = ? AND unit_no IS NOT NULL
     GROUP BY unit_no, unit_name
     ORDER BY unit_no ASC`
  )
    .bind(code)
    .all<{ unit_no: number; unit_name?: string; cnt: number }>();

  const unitFrequency = (mapRows.results || []).map(r => ({
    unitNo: r.unit_no,
    unitName: r.unit_name || `Unit ${r.unit_no}`,
    questionCount: Number(r.cnt || 0),
    percentage: totalQuestionsAnalyzed > 0 ? Number(((Number(r.cnt) / totalQuestionsAnalyzed) * 100).toFixed(1)) : 0,
  }));

  // 3. Top topics
  const topTopicFrequency = Object.entries(topicCounts)
    .map(([topicName, count]) => ({
      topicName,
      count,
      percentage: totalQuestionsAnalyzed > 0 ? Number(((count / totalQuestionsAnalyzed) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // 4. Repeated question clusters in this subject
  let repeatedQuestionsCount = 0;
  try {
    const repRow = await env.DB.prepare(
      `SELECT SUM(total_occurrences) as total_repeats
       FROM question_duplicate_clusters
       WHERE subject_code = ? AND total_occurrences > 1`
    )
      .bind(code)
      .first<{ total_repeats: number }>();
    repeatedQuestionsCount = Number(repRow?.total_repeats || 0);
  } catch {
    /* empty */
  }

  const repeatedQuestionsPercentage = totalQuestionsAnalyzed > 0
    ? Number(((repeatedQuestionsCount / totalQuestionsAnalyzed) * 100).toFixed(1))
    : 0;

  return {
    subjectCode: code,
    totalQuestionsAnalyzed,
    totalMarksAnalyzed: totalMarks,
    questionTypeFrequency: typeFreq,
    difficultyDistribution: diffFreq,
    marksDistribution: marksFreq,
    unitFrequency,
    topTopicFrequency,
    recurringConcepts: topTopicFrequency.map(t => ({ concept: t.topicName, occurrences: t.count })),
    repeatedQuestionsPercentage,
  };
}
