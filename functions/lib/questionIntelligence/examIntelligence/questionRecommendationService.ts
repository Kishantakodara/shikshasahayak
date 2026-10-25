// ============================================================
// EXAM INTELLIGENCE ENGINE - QUESTION RECOMMENDATION SERVICE
// Tailored question recommendations mapped to student preparation modes,
// topic weaknesses, and GTU recurrence patterns.
// Strictly enforces verified-only question gating & answer shielding.
// ============================================================

import { Env } from '../../contentEngine';
import { RecommendationMode, RecommendedQuestionItem, ExamPriorityLevel } from './types';
import { calculateStudentTopicRisks } from './topicRiskService';

export interface RecommendationRequestOptions {
  subjectCode: string;
  semester?: number;
  mode?: RecommendationMode;
  targetTopic?: string;
  limit?: number;
}

export interface RecommendationResponse {
  studentId: string;
  subjectCode: string;
  mode: RecommendationMode;
  totalRecommended: number;
  questions: RecommendedQuestionItem[];
}

/**
  Generates intelligent, explainable question recommendations.
 */
export async function getIntelligentQuestionRecommendations(
  env: Env,
  studentId: string,
  options: RecommendationRequestOptions
): Promise<RecommendationResponse> {
  const code = options.subjectCode.trim();
  const mode = options.mode || 'EXAM_PRIORITY';
  const limit = Math.min(25, Math.max(1, options.limit || 10));

  // 1. Get Topic Risks to identify weak areas
  const topicRisks = await calculateStudentTopicRisks(env, studentId, code);
  const criticalTopicNames = topicRisks
    .filter(t => t.riskLevel === 'CRITICAL_RISK' || t.riskLevel === 'HIGH_RISK')
    .map(t => t.topicName);

  // 2. Query verified questions
  let query = `
    SELECT 
      q.id, q.question_text, q.question_type, q.subject_code, q.subject_name,
      q.semester, q.unit_no, q.topic_name, q.difficulty, q.marks,
      q.options_json, q.is_original_pyq, q.exam_name, q.exam_year,
      c.repeat_frequency_band
    FROM master_question_bank q
    LEFT JOIN question_duplicate_cluster_members m ON q.id = m.question_id
    LEFT JOIN question_duplicate_clusters c ON m.cluster_id = c.id
    WHERE q.subject_code = ? AND q.verification_status = 'verified'
  `;

  const params: any[] = [code];

  if (mode === 'REPEATED_PYQ') {
    query += ` AND (c.repeat_frequency_band IN ('VERY_HIGH_REPEAT', 'HIGH_REPEAT', 'MEDIUM_REPEAT') OR q.is_original_pyq = 1)`;
  } else if (mode === 'WEAK_AND_FREQUENT' && criticalTopicNames.length > 0) {
    const placeholders = criticalTopicNames.map(() => '?').join(', ');
    query += ` AND q.topic_name IN (${placeholders})`;
    params.push(...criticalTopicNames);
  } else if (options.targetTopic) {
    query += ` AND q.topic_name = ?`;
    params.push(options.targetTopic.trim());
  }

  query += ` ORDER BY RANDOM() LIMIT ?`;
  params.push(limit);

  const rows = await env.DB.prepare(query).bind(...params).all<Record<string, unknown>>();

  const questions: RecommendedQuestionItem[] = (rows.results || []).map(r => {
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

    let reason = 'High-priority GTU preparation benchmark question';
    let priorityLevel: ExamPriorityLevel = 'HIGH';

    if (mode === 'REPEATED_PYQ' || r.repeat_frequency_band === 'HIGH_REPEAT' || r.repeat_frequency_band === 'VERY_HIGH_REPEAT') {
      reason = 'Historically repeated GTU exam question across multiple sessions';
      priorityLevel = 'CRITICAL';
    } else if (criticalTopicNames.includes(String(r.topic_name))) {
      reason = `Recommended to strengthen your identified weakness in '${r.topic_name}'`;
      priorityLevel = 'HIGH';
    }

    // Shield all answers, explanations, and step-by-step solutions
    return {
      id: String(r.id),
      questionText: String(r.question_text || ''),
      questionType: String(r.question_type || 'MCQ'),
      subjectCode: String(r.subject_code || code),
      subjectName: String(r.subject_name || 'Engineering'),
      semester: Number(r.semester || options.semester || 1),
      unitNo: r.unit_no !== undefined ? Number(r.unit_no) : undefined,
      topicName: r.topic_name ? String(r.topic_name) : null,
      difficulty: (String(r.difficulty || 'medium').toLowerCase() as 'easy' | 'medium' | 'hard'),
      marks: Number(r.marks || 1),
      options: opts,
      isOriginalPyq: Number(r.is_original_pyq) === 1,
      examName: r.exam_name ? String(r.exam_name) : null,
      examYear: r.exam_year ? Number(r.exam_year) : null,
      recommendationReason: reason,
      priorityLevel,
    };
  });

  return {
    studentId,
    subjectCode: code,
    mode,
    totalRecommended: questions.length,
    questions,
  };
}
