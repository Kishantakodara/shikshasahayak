// ============================================================
// QUESTION QUALITY ENGINE - DEMAND & COVERAGE SERVICE
// Subject/topic coverage gap analysis, format/difficulty imbalance
// detection, and deterministic ingestion recommendations.
// ============================================================

import { Env } from '../../contentEngine';
import { GTU_FIRST_YEAR_CATALOG } from '../gtuIngestion/gtuFirstYearCatalog';

export interface CoverageGapReport {
  subjectCode: string;
  subjectName: string;
  totalQuestions: number;
  mcqCount: number;
  msqCount: number;
  natCount: number;
  easyCount: number;
  mediumCount: number;
  hardCount: number;
  imbalanceFlags: string[];
}

export interface IngestionRecommendation {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  subjectCode: string;
  subjectName: string;
  recommendedMcqCount: number;
  recommendedMsqCount: number;
  recommendedNatCount: number;
  recommendedHardCount: number;
  reasons: string[];
}

export async function analyzeCoverageGaps(env: Env): Promise<CoverageGapReport[]> {
  const reports: CoverageGapReport[] = [];

  for (const subj of GTU_FIRST_YEAR_CATALOG) {
    const stats = await env.DB.prepare(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN question_type = 'MCQ' THEN 1 ELSE 0 END) as mcq_cnt,
        SUM(CASE WHEN question_type = 'MSQ' THEN 1 ELSE 0 END) as msq_cnt,
        SUM(CASE WHEN question_type = 'NAT' THEN 1 ELSE 0 END) as nat_cnt,
        SUM(CASE WHEN difficulty = 'easy' THEN 1 ELSE 0 END) as easy_cnt,
        SUM(CASE WHEN difficulty = 'medium' THEN 1 ELSE 0 END) as med_cnt,
        SUM(CASE WHEN difficulty = 'hard' THEN 1 ELSE 0 END) as hard_cnt
       FROM master_question_bank
       WHERE subject_code = ? AND verification_status = 'verified'`
    ).bind(subj.subjectCode).first<{
      total: number;
      mcq_cnt: number;
      msq_cnt: number;
      nat_cnt: number;
      easy_cnt: number;
      med_cnt: number;
      hard_cnt: number;
    }>();

    const total = stats?.total || 0;
    const mcq = stats?.mcq_cnt || 0;
    const msq = stats?.msq_cnt || 0;
    const nat = stats?.nat_cnt || 0;
    const easy = stats?.easy_cnt || 0;
    const med = stats?.med_cnt || 0;
    const hard = stats?.hard_cnt || 0;

    const imbalanceFlags: string[] = [];
    if (total < 20) imbalanceFlags.push('INSUFFICIENT_POOL');
    if (msq === 0) imbalanceFlags.push('UNDERREPRESENTED_MSQ');
    if (nat === 0) imbalanceFlags.push('UNDERREPRESENTED_NAT');
    if (hard === 0) imbalanceFlags.push('DIFFICULTY_IMBALANCE');

    reports.push({
      subjectCode: subj.subjectCode,
      subjectName: subj.subjectName,
      totalQuestions: total,
      mcqCount: mcq,
      msqCount: msq,
      natCount: nat,
      easyCount: easy,
      mediumCount: med,
      hardCount: hard,
      imbalanceFlags,
    });
  }

  return reports;
}

export async function generateIngestionRecommendations(
  env: Env
): Promise<IngestionRecommendation[]> {
  const gaps = await analyzeCoverageGaps(env);
  const recs: IngestionRecommendation[] = [];

  for (const gap of gaps) {
    if (gap.imbalanceFlags.length === 0) continue;

    const priority: 'HIGH' | 'MEDIUM' | 'LOW' = gap.totalQuestions < 10 ? 'HIGH' : 'MEDIUM';
    const reasons: string[] = [];

    let recMcq = 0;
    let recMsq = 0;
    let recNat = 0;
    let recHard = 0;

    if (gap.totalQuestions < 20) {
      recMcq += 15;
      reasons.push(`Low pool size (${gap.totalQuestions} questions)`);
    }

    if (gap.msqCount === 0) {
      recMsq += 5;
      reasons.push('Lacks MSQ question coverage');
    }

    if (gap.natCount === 0) {
      recNat += 5;
      reasons.push('Lacks NAT numerical question coverage');
    }

    if (gap.hardCount === 0) {
      recHard += 5;
      reasons.push('Lacks Hard difficulty questions');
    }

    recs.push({
      priority,
      subjectCode: gap.subjectCode,
      subjectName: gap.subjectName,
      recommendedMcqCount: recMcq,
      recommendedMsqCount: recMsq,
      recommendedNatCount: recNat,
      recommendedHardCount: recHard,
      reasons,
    });
  }

  return recs;
}
