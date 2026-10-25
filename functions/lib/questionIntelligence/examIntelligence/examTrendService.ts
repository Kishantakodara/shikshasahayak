// ============================================================
// EXAM INTELLIGENCE ENGINE - EXAM TREND SERVICE
// Deterministic analysis of GTU question frequency patterns,
// multi-session trends, and concept momentum over historical exams.
// ============================================================

import { Env } from '../../contentEngine';
import { TrendDirection, ExamPriorityLevel, TopicTrendDetail } from './types';

const RECENT_SESSIONS = ['W2024', 'S2024'];
const OLDER_SESSIONS = ['W2023', 'S2023', 'W2022'];

/**
  Determines the trend direction based on recent vs older historical frequency.
 */
export function calculateTrendDirection(
  totalCount: number,
  recentCount: number,
  olderCount: number,
  hasRecentAppearance: boolean,
  repeatClusterCount: number
): TrendDirection {
  if (totalCount < 2) {
    return 'INSUFFICIENT_DATA';
  }

  if (repeatClusterCount >= 2) {
    return 'HIGH_RECURRENCE';
  }

  if (recentCount > 0 && olderCount === 0) {
    return 'RECENTLY_APPEARED';
  }

  if (recentCount === 0 && olderCount >= 2) {
    return 'LONG_ABSENCE';
  }

  const recentRate = recentCount / RECENT_SESSIONS.length;
  const olderRate = olderCount / OLDER_SESSIONS.length;

  if (recentRate >= olderRate * 1.4) {
    return 'RISING';
  }

  if (recentRate <= olderRate * 0.6) {
    return 'DECLINING';
  }

  return 'STABLE';
}

/**
  Computes topic-level historical exam trends and priority signals across GTU sessions.
 */
export async function analyzeSubjectExamTrends(
  env: Env,
  subjectCode: string
): Promise<TopicTrendDetail[]> {
  const code = subjectCode.trim();

  // 1. Fetch verified questions mapped to curriculum topics
  const qRows = await env.DB.prepare(
    `SELECT 
      q.id, q.marks, q.difficulty, q.exam_session, q.exam_year,
      COALESCE(m.unit_no, q.unit_no, 1) as unit_no,
      COALESCE(m.unit_name, 'General Module') as unit_name,
      COALESCE(m.topic_name, q.topic_name, 'Core Concepts') as topic_name
     FROM master_question_bank q
     LEFT JOIN question_curriculum_mappings m ON q.id = m.question_id
     WHERE q.subject_code = ? AND q.verification_status = 'verified'`
  )
    .bind(code)
    .all<{
      id: string;
      marks?: number;
      difficulty?: string;
      exam_session?: string;
      exam_year?: number;
      unit_no: number;
      unit_name: string;
      topic_name: string;
    }>();

  const questions = qRows.results || [];
  if (questions.length === 0) {
    return [];
  }

  // 2. Fetch duplicate clusters in this subject
  const clusterRows = await env.DB.prepare(
    `SELECT canonical_question_text, total_occurrences
     FROM question_duplicate_clusters
     WHERE subject_code = ? AND total_occurrences > 1`
  )
    .bind(code)
    .all<{ canonical_question_text: string; total_occurrences: number }>();

  const repeatClusters = clusterRows.results || [];

  // 3. Group by topic
  const topicMap = new Map<string, {
    unitNo: number;
    unitName: string;
    topicName: string;
    totalMarks: number;
    questionsCount: number;
    recentCount: number;
    olderCount: number;
    hasRecentAppearance: boolean;
    repeatClusterCount: number;
  }>();

  for (const q of questions) {
    const topic = q.topic_name.trim();
    const existing = topicMap.get(topic) || {
      unitNo: Number(q.unit_no || 1),
      unitName: q.unit_name || 'General Module',
      topicName: topic,
      totalMarks: 0,
      questionsCount: 0,
      recentCount: 0,
      olderCount: 0,
      hasRecentAppearance: false,
      repeatClusterCount: 0,
    };

    existing.questionsCount++;
    const m = q.marks !== undefined && q.marks !== null ? Number(q.marks) : 1;
    existing.totalMarks += m;

    const sess = q.exam_session ? `${q.exam_session}${q.exam_year || ''}` : '';
    const isRecent = (q.exam_year && q.exam_year >= 2024) || (q.exam_session === 'W2024' || q.exam_session === 'S2024');

    if (isRecent) {
      existing.recentCount++;
      existing.hasRecentAppearance = true;
    } else {
      existing.olderCount++;
    }

    // Check matching repeat clusters
    const matchedClusters = repeatClusters.filter(c => c.canonical_question_text.toLowerCase().includes(topic.toLowerCase()));
    existing.repeatClusterCount = matchedClusters.length;

    topicMap.set(topic, existing);
  }

  const trends: TopicTrendDetail[] = [];

  for (const [topicName, item] of topicMap.entries()) {
    const total = item.questionsCount;
    const avgMarks = total > 0 ? Number((item.totalMarks / total).toFixed(1)) : 1;

    const direction = calculateTrendDirection(
      total,
      item.recentCount,
      item.olderCount,
      item.hasRecentAppearance,
      item.repeatClusterCount
    );

    // Calculate deterministic priority score (0-100)
    let score = 40;
    const evidence: string[] = [];

    if (total >= 4) {
      score += 25;
      evidence.push(`Appeared ${total} times across analyzed GTU exam papers`);
    } else if (total >= 2) {
      score += 15;
      evidence.push(`Appeared ${total} times in historical papers`);
    } else {
      evidence.push(`Single historical appearance (${total} question)`);
    }

    if (item.repeatClusterCount >= 1) {
      score += 20;
      evidence.push(`Contains ${item.repeatClusterCount} verified recurring question patterns`);
    }

    if (direction === 'RISING' || direction === 'RECENTLY_APPEARED') {
      score += 15;
      evidence.push('Frequency momentum is rising in recent GTU exam sessions');
    } else if (direction === 'DECLINING') {
      score -= 10;
      evidence.push('Slightly lower frequency in recent sessions compared to earlier years');
    }

    if (avgMarks >= 5) {
      score += 10;
      evidence.push(`High marks concentration (Average: ${avgMarks} Marks)`);
    }

    const finalScore = Math.max(10, Math.min(100, score));

    let priorityLevel: ExamPriorityLevel = 'MEDIUM';
    if (direction === 'INSUFFICIENT_DATA') {
      priorityLevel = 'INSUFFICIENT_DATA';
    } else if (finalScore >= 80) {
      priorityLevel = 'CRITICAL';
    } else if (finalScore >= 65) {
      priorityLevel = 'HIGH';
    } else if (finalScore >= 45) {
      priorityLevel = 'MEDIUM';
    } else {
      priorityLevel = 'LOW';
    }

    const confidence = total >= 4 ? 0.9 : (total >= 2 ? 0.75 : 0.5);

    trends.push({
      subjectCode: code,
      unitNo: item.unitNo,
      unitName: item.unitName,
      topicName,
      totalHistoricalFrequency: total,
      recentFrequency: item.recentCount,
      olderFrequency: item.olderCount,
      repeatClusterCount: item.repeatClusterCount,
      averageMarks: avgMarks,
      trendDirection: direction,
      priorityScore: finalScore,
      priorityLevel,
      confidence,
      evidence,
    });
  }

  // Sort by priority score descending
  return trends.sort((a, b) => b.priorityScore - a.priorityScore);
}
