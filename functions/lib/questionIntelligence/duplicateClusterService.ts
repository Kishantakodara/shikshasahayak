// ============================================================
// QUESTION INTELLIGENCE ENGINE - DUPLICATE CLUSTER & REPEAT ANALYTICS
// Conceptual clustering for repeated GTU questions across historical
// exam sessions while preserving exact immutable source provenance.
// ============================================================

import { Env } from '../contentEngine';
import { normalizeQuestionText } from './normalizationService';
import { calculateTextSimilarity } from './duplicateDetectionService';

export type RepeatFrequencyBand =
  | 'VERY_HIGH_REPEAT'
  | 'HIGH_REPEAT'
  | 'MEDIUM_REPEAT'
  | 'LOW_REPEAT'
  | 'UNIQUE';

export interface DuplicateClusterMember {
  id: string;
  clusterId: string;
  questionId: string;
  paperId?: string;
  examSession?: string;
  examYear?: number;
  similarityScore: number;
  isPrimaryRepresentative: boolean;
  questionText?: string;
}

export interface DuplicateCluster {
  id: string;
  clusterHash: string;
  canonicalQuestionText: string;
  subjectCode: string;
  semester: number;
  totalOccurrences: number;
  firstAppearedSession?: string;
  firstAppearedYear?: number;
  lastAppearedSession?: string;
  lastAppearedYear?: number;
  repeatFrequencyBand: RepeatFrequencyBand;
  members: DuplicateClusterMember[];
  yearsAppeared: number[];
  sessionsAppeared: string[];
}

export interface RepeatedQuestionStats {
  subjectCode: string;
  totalClusters: number;
  veryHighRepeatCount: number;
  highRepeatCount: number;
  mediumRepeatCount: number;
  uniqueCount: number;
  topRepeatedQuestions: Array<{
    clusterId: string;
    canonicalQuestionText: string;
    occurrences: number;
    yearsAppeared: number[];
    sessionsAppeared: string[];
    repeatFrequencyBand: RepeatFrequencyBand;
  }>;
}

/**
  Computes deterministic repeat frequency band from occurrence count.
 */
export function computeRepeatFrequencyBand(occurrences: number): RepeatFrequencyBand {
  if (occurrences >= 4) return 'VERY_HIGH_REPEAT';
  if (occurrences === 3) return 'HIGH_REPEAT';
  if (occurrences === 2) return 'MEDIUM_REPEAT';
  return 'UNIQUE';
}

/**
  Generates deterministic cluster hash based on normalized question tokens.
 */
export function generateClusterHash(text: string, subjectCode: string): string {
  const norm = normalizeQuestionText(text).normalized;
  const tokenSet = Array.from(new Set(norm.split(' ').filter(w => w.length > 2))).sort().join('_');
  return `${subjectCode.trim()}_${tokenSet.slice(0, 80)}`;
}

/**
  Associates a question with an existing duplicate cluster or creates a new one.
  Strictly preserves individual question provenance.
 */
export async function assignQuestionToCluster(
  env: Env,
  question: {
    id: string;
    questionText: string;
    subjectCode: string;
    semester?: number;
    paperId?: string;
    examSession?: string;
    examYear?: number;
  }
): Promise<DuplicateCluster> {
  const norm = normalizeQuestionText(question.questionText).normalized;
  const subjectCode = question.subjectCode || '3110014';
  const semester = question.semester || 1;
  const clusterHash = generateClusterHash(question.questionText, subjectCode);

  // 1. Search for existing cluster by hash or high similarity
  let clusterRow = await env.DB.prepare(
    `SELECT * FROM question_duplicate_clusters WHERE cluster_hash = ?`
  )
    .bind(clusterHash)
    .first<Record<string, unknown>>();

  let clusterId: string;

  if (clusterRow) {
    clusterId = String(clusterRow.id);
  } else {
    // Check existing clusters in the same subject for high similarity
    const existingClusters = await env.DB.prepare(
      `SELECT id, cluster_hash, canonical_question_text FROM question_duplicate_clusters WHERE subject_code = ?`
    )
      .bind(subjectCode)
      .all<{ id: string; cluster_hash: string; canonical_question_text: string }>();

    let matchedClusterId: string | null = null;
    if (existingClusters.results) {
      for (const cl of existingClusters.results) {
        const sim = calculateTextSimilarity(norm, normalizeQuestionText(cl.canonical_question_text).normalized);
        if (sim >= 0.70) {
          matchedClusterId = cl.id;
          break;
        }
      }
    }

    if (matchedClusterId) {
      clusterId = matchedClusterId;
      clusterRow = await env.DB.prepare(`SELECT * FROM question_duplicate_clusters WHERE id = ?`)
        .bind(clusterId)
        .first<Record<string, unknown>>();
    } else {
      // Create new cluster
      clusterId = `qdc_${crypto.randomUUID().slice(0, 12)}`;
      await env.DB.prepare(
        `INSERT INTO question_duplicate_clusters (
          id, cluster_hash, canonical_question_text, subject_code, semester,
          total_occurrences, first_appeared_session, first_appeared_year,
          last_appeared_session, last_appeared_year, repeat_frequency_band,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, 'UNIQUE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      )
        .bind(
          clusterId,
          clusterHash,
          question.questionText,
          subjectCode,
          semester,
          question.examSession || null,
          question.examYear || null,
          question.examSession || null,
          question.examYear || null
        )
        .run();
    }
  }

  // 2. Add member to cluster
  const memberId = `qdcm_${crypto.randomUUID().slice(0, 12)}`;
  await env.DB.prepare(
    `INSERT INTO question_duplicate_cluster_members (
      id, cluster_id, question_id, paper_id, exam_session, exam_year, similarity_score, is_primary_representative, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, 1.0, 0, CURRENT_TIMESTAMP)
    ON CONFLICT(cluster_id, question_id) DO NOTHING`
  )
    .bind(
      memberId,
      clusterId,
      question.id,
      question.paperId || null,
      question.examSession || null,
      question.examYear || null
    )
    .run();

  // 3. Recalculate cluster stats
  const memberRows = await env.DB.prepare(
    `SELECT exam_session, exam_year FROM question_duplicate_cluster_members WHERE cluster_id = ?`
  )
    .bind(clusterId)
    .all<{ exam_session?: string; exam_year?: number }>();

  const membersCount = memberRows.results ? memberRows.results.length : 1;
  const years = (memberRows.results || [])
    .map(r => r.exam_year)
    .filter((y): y is number => typeof y === 'number' && !isNaN(y))
    .sort((a, b) => a - b);

  const sessions = Array.from(new Set((memberRows.results || []).map(r => r.exam_session).filter(Boolean))) as string[];

  const firstYear = years[0] || question.examYear || null;
  const lastYear = years[years.length - 1] || question.examYear || null;
  const repeatBand = computeRepeatFrequencyBand(membersCount);

  await env.DB.prepare(
    `UPDATE question_duplicate_clusters SET
      total_occurrences = ?,
      first_appeared_year = ?,
      last_appeared_year = ?,
      repeat_frequency_band = ?,
      updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  )
    .bind(membersCount, firstYear, lastYear, repeatBand, clusterId)
    .run();

  return {
    id: clusterId,
    clusterHash,
    canonicalQuestionText: question.questionText,
    subjectCode,
    semester,
    totalOccurrences: membersCount,
    firstAppearedSession: sessions[0] || question.examSession,
    firstAppearedYear: firstYear || undefined,
    lastAppearedSession: sessions[sessions.length - 1] || question.examSession,
    lastAppearedYear: lastYear || undefined,
    repeatFrequencyBand: repeatBand,
    members: [],
    yearsAppeared: years,
    sessionsAppeared: sessions,
  };
}

/**
  Calculates repeated question statistics for a subject or entire platform.
 */
export async function getRepeatedQuestionStats(
  env: Env,
  subjectCode?: string
): Promise<RepeatedQuestionStats> {
  const code = subjectCode || '3110014';

  let totalClusters = 0;
  let veryHighRepeatCount = 0;
  let highRepeatCount = 0;
  let mediumRepeatCount = 0;
  let uniqueCount = 0;

  try {
    const rows = await env.DB.prepare(
      `SELECT repeat_frequency_band, COUNT(*) as count
       FROM question_duplicate_clusters
       WHERE subject_code = ?
       GROUP BY repeat_frequency_band`
    )
      .bind(code)
      .all<{ repeat_frequency_band: string; count: number }>();

    if (rows.results) {
      for (const r of rows.results) {
        const cnt = Number(r.count || 0);
        totalClusters += cnt;
        if (r.repeat_frequency_band === 'VERY_HIGH_REPEAT') veryHighRepeatCount += cnt;
        else if (r.repeat_frequency_band === 'HIGH_REPEAT') highRepeatCount += cnt;
        else if (r.repeat_frequency_band === 'MEDIUM_REPEAT') mediumRepeatCount += cnt;
        else uniqueCount += cnt;
      }
    }
  } catch {
    /* empty */
  }

  const topRows = await env.DB.prepare(
    `SELECT id, canonical_question_text, total_occurrences, first_appeared_year, last_appeared_year, repeat_frequency_band
     FROM question_duplicate_clusters
     WHERE subject_code = ?
     ORDER BY total_occurrences DESC
     LIMIT 10`
  )
    .bind(code)
    .all<{
      id: string;
      canonical_question_text: string;
      total_occurrences: number;
      first_appeared_year?: number;
      last_appeared_year?: number;
      repeat_frequency_band: RepeatFrequencyBand;
    }>();

  const topRepeatedQuestions = (topRows.results || []).map(r => ({
    clusterId: r.id,
    canonicalQuestionText: r.canonical_question_text,
    occurrences: Number(r.total_occurrences || 1),
    yearsAppeared: r.first_appeared_year && r.last_appeared_year
      ? Array.from(new Set([r.first_appeared_year, r.last_appeared_year]))
      : [],
    sessionsAppeared: [],
    repeatFrequencyBand: r.repeat_frequency_band,
  }));

  return {
    subjectCode: code,
    totalClusters,
    veryHighRepeatCount,
    highRepeatCount,
    mediumRepeatCount,
    uniqueCount,
    topRepeatedQuestions,
  };
}
