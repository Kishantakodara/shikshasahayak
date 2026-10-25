// ============================================================
// EXAM INTELLIGENCE ENGINE - RECURRENCE INTELLIGENCE SERVICE
// Deep analysis of repeated concepts and recurring PYQ questions
// across multi-year GTU exam sessions with immutable provenance.
// ============================================================

import { Env } from '../../contentEngine';
import { RecurrenceConceptDetail } from './types';

/**
  Retrieves comprehensive recurrence intelligence across GTU question clusters.
 */
export async function getSubjectRecurrenceIntelligence(
  env: Env,
  subjectCode: string
): Promise<RecurrenceConceptDetail[]> {
  const code = subjectCode.trim();

  // 1. Fetch clusters and their occurrences
  const clusters = await env.DB.prepare(
    `SELECT 
      id, cluster_hash, canonical_question_text, subject_code,
      total_occurrences, first_appeared_session, first_appeared_year,
      last_appeared_session, last_appeared_year, repeat_frequency_band
     FROM question_duplicate_clusters
     WHERE subject_code = ?
     ORDER BY total_occurrences DESC`
  )
    .bind(code)
    .all<{
      id: string;
      cluster_hash: string;
      canonical_question_text: string;
      subject_code: string;
      total_occurrences: number;
      first_appeared_session?: string;
      first_appeared_year?: number;
      last_appeared_session?: string;
      last_appeared_year?: number;
      repeat_frequency_band: string;
    }>();

  const results: RecurrenceConceptDetail[] = [];

  for (const c of clusters.results || []) {
    const totalOccurrences = Number(c.total_occurrences || 1);

    // Fetch individual member appearances to get complete history
    const members = await env.DB.prepare(
      `SELECT exam_session, exam_year FROM question_duplicate_cluster_members WHERE cluster_id = ?`
    )
      .bind(c.id)
      .all<{ exam_session?: string; exam_year?: number }>();

    const years = Array.from(
      new Set((members.results || []).map(m => m.exam_year).filter((y): y is number => typeof y === 'number'))
    ).sort((a, b) => a - b);

    const sessions = Array.from(
      new Set((members.results || []).map(m => m.exam_session).filter(Boolean))
    ) as string[];

    let averageGap = 0;
    if (years.length >= 2) {
      const span = years[years.length - 1] - years[0];
      averageGap = Number((span / (years.length - 1)).toFixed(1));
    }

    let importance: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    if (totalOccurrences >= 4) importance = 'CRITICAL';
    else if (totalOccurrences === 3) importance = 'HIGH';
    else if (totalOccurrences === 2) importance = 'MEDIUM';

    const evidence: string[] = [];
    evidence.push(`Appeared ${totalOccurrences} times across GTU exam sessions`);
    if (years.length > 0) {
      evidence.push(`Observed in years: ${years.join(', ')}`);
    }
    if (averageGap > 0) {
      evidence.push(`Average recurrence cycle: every ~${averageGap} years`);
    }

    results.push({
      clusterId: c.id,
      canonicalQuestionText: c.canonical_question_text,
      subjectCode: code,
      repeatCount: totalOccurrences,
      sessionsAppeared: sessions,
      yearsAppeared: years,
      firstSeenSession: c.first_appeared_session || (sessions[0] || 'W2022'),
      lastSeenSession: c.last_appeared_session || (sessions[sessions.length - 1] || 'W2024'),
      averageSessionGap: averageGap,
      repeatFrequencyBand: (c.repeat_frequency_band as any) || 'UNIQUE',
      historicalImportance: importance,
      evidence,
    });
  }

  return results;
}
