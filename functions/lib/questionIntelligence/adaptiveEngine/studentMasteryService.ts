// ============================================================
// ADAPTIVE LEARNING ENGINE - STUDENT MASTERY SERVICE
// Multi-signal student topic and subject mastery calculation,
// confidence bands, recency weighting, and roadmap generation.
// ============================================================

import { Env } from '../../contentEngine';
import { getSampleConfidenceBand, SampleConfidenceBand } from '../qualityEngine';

export type MasteryLevel = 'LOW_CONFIDENCE' | 'DEVELOPING' | 'PRACTICING' | 'PROFICIENT' | 'MASTERED';

export interface TopicMasteryRecord {
  studentId: string;
  branchId: string;
  subjectCode: string;
  subjectName: string;
  topicName: string;
  masteryScore: number; // 0.0 to 100.0
  masteryLevel: MasteryLevel;
  confidenceBand: SampleConfidenceBand;
  totalAttempts: number;
  correctAttempts: number;
  incorrectAttempts: number;
  skippedAttempts: number;
  accuracyPercentage: number;
  recentAccuracyPercentage: number;
  averageTimeSeconds: number;
  lastPracticedAt: string;
}

export interface SubjectRoadmapItem {
  topicName: string;
  masteryScore: number;
  masteryLevel: MasteryLevel;
  confidenceBand: SampleConfidenceBand;
  totalAttempts: number;
  accuracyPercentage: number;
  lastPracticedAt: string;
  recommendedAction: string;
}

export interface SubjectRoadmap {
  subjectCode: string;
  subjectName: string;
  overallMasteryScore: number;
  overallMasteryLevel: MasteryLevel;
  topics: SubjectRoadmapItem[];
}

export function computeMasteryLevel(score: number, confidence: SampleConfidenceBand): MasteryLevel {
  if (confidence === 'LOW_SAMPLE') return 'LOW_CONFIDENCE';
  if (score >= 90.0) return 'MASTERED';
  if (score >= 75.0) return 'PROFICIENT';
  if (score >= 50.0) return 'PRACTICING';
  return 'DEVELOPING';
}

export async function recalculateStudentTopicMastery(
  env: Env,
  studentId: string,
  subjectCode: string,
  topicName: string,
  branchId: string = 'branch_07'
): Promise<TopicMasteryRecord> {
  const attempts = await env.DB.prepare(
    `SELECT sma.*, mqb.subject_name, mqb.difficulty
     FROM student_mcq_attempts sma
     JOIN master_question_bank mqb ON sma.question_id = mqb.id
     WHERE sma.student_id = ? AND mqb.subject_code = ? AND mqb.topic_name = ?
     ORDER BY sma.created_at DESC`
  )
    .bind(studentId, subjectCode, topicName)
    .all<any>();

  const rows = attempts.results || [];
  const totalAttempts = rows.length;

  if (totalAttempts === 0) {
    const defaultRecord: TopicMasteryRecord = {
      studentId,
      branchId,
      subjectCode,
      subjectName: `${subjectCode} Subject`,
      topicName,
      masteryScore: 0.0,
      masteryLevel: 'LOW_CONFIDENCE',
      confidenceBand: 'LOW_SAMPLE',
      totalAttempts: 0,
      correctAttempts: 0,
      incorrectAttempts: 0,
      skippedAttempts: 0,
      accuracyPercentage: 0.0,
      recentAccuracyPercentage: 0.0,
      averageTimeSeconds: 0.0,
      lastPracticedAt: new Date().toISOString(),
    };
    return defaultRecord;
  }

  const subjectName = rows[0].subject_name || `${subjectCode} Subject`;
  let correctAttempts = 0;
  let incorrectAttempts = 0;
  let skippedAttempts = 0;
  let totalTime = 0;

  rows.forEach((r) => {
    if (r.is_correct === 1) correctAttempts++;
    else if (r.selected_option_id) incorrectAttempts++;
    else skippedAttempts++;
    totalTime += Number(r.time_taken_seconds || 0);
  });

  const accuracyPercentage = (correctAttempts / (correctAttempts + incorrectAttempts || 1)) * 100;
  const recentRows = rows.slice(0, 10);
  const recentCorrect = recentRows.filter((r) => r.is_correct === 1).length;
  const recentAccuracyPercentage = (recentCorrect / recentRows.length) * 100;
  const averageTimeSeconds = Math.round((totalTime / totalAttempts) * 10) / 10;

  const confidenceBand = getSampleConfidenceBand(totalAttempts);

  // Multi-signal mastery formula: 60% recent accuracy + 30% overall accuracy + 10% volume bonus
  const volumeBonus = Math.min(10.0, totalAttempts * 0.5);
  let rawScore = recentAccuracyPercentage * 0.6 + accuracyPercentage * 0.3 + volumeBonus;

  // Skip penalty
  const skipRate = (skippedAttempts / totalAttempts) * 100;
  if (skipRate > 30) rawScore -= 10.0;

  const masteryScore = Math.max(0.0, Math.min(100.0, Math.round(rawScore * 10) / 10));
  const masteryLevel = computeMasteryLevel(masteryScore, confidenceBand);
  const recordId = `stm_${studentId}_${subjectCode}_${topicName.replace(/[^a-zA-Z0-9]/g, '_')}`;

  // Fetch previous score for event log
  const prevRow = await env.DB.prepare(
    `SELECT mastery_score, mastery_level FROM student_topic_mastery WHERE id = ?`
  )
    .bind(recordId)
    .first<{ mastery_score: number; mastery_level: string }>();

  await env.DB.prepare(
    `INSERT INTO student_topic_mastery (
      id, student_id, branch_id, subject_code, subject_name, topic_name,
      mastery_score, mastery_level, confidence_band, total_attempts,
      correct_attempts, incorrect_attempts, skipped_attempts,
      accuracy_percentage, recent_accuracy_percentage, average_time_seconds,
      last_practiced_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(student_id, branch_id, subject_code, topic_name) DO UPDATE SET
      mastery_score = excluded.mastery_score,
      mastery_level = excluded.mastery_level,
      confidence_band = excluded.confidence_band,
      total_attempts = excluded.total_attempts,
      correct_attempts = excluded.correct_attempts,
      incorrect_attempts = excluded.incorrect_attempts,
      skipped_attempts = excluded.skipped_attempts,
      accuracy_percentage = excluded.accuracy_percentage,
      recent_accuracy_percentage = excluded.recent_accuracy_percentage,
      average_time_seconds = excluded.average_time_seconds,
      last_practiced_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP`
  )
    .bind(
      recordId,
      studentId,
      branchId,
      subjectCode,
      subjectName,
      topicName,
      masteryScore,
      masteryLevel,
      confidenceBand,
      totalAttempts,
      correctAttempts,
      incorrectAttempts,
      skippedAttempts,
      accuracyPercentage,
      recentAccuracyPercentage,
      averageTimeSeconds
    )
    .run();

  // Audit event if score changed
  if (prevRow && Math.abs(prevRow.mastery_score - masteryScore) >= 1.0) {
    const evtId = `sme_${crypto.randomUUID().slice(0, 10)}`;
    await env.DB.prepare(
      `INSERT INTO student_mastery_events (id, student_id, subject_code, topic_name, previous_mastery, new_mastery, previous_level, new_level, trigger_event)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ATTEMPT_COMPLETED')`
    )
      .bind(
        evtId,
        studentId,
        subjectCode,
        topicName,
        prevRow.mastery_score,
        masteryScore,
        prevRow.mastery_level,
        masteryLevel
      )
      .run();
  }

  return {
    studentId,
    branchId,
    subjectCode,
    subjectName,
    topicName,
    masteryScore,
    masteryLevel,
    confidenceBand,
    totalAttempts,
    correctAttempts,
    incorrectAttempts,
    skippedAttempts,
    accuracyPercentage: Math.round(accuracyPercentage * 10) / 10,
    recentAccuracyPercentage: Math.round(recentAccuracyPercentage * 10) / 10,
    averageTimeSeconds,
    lastPracticedAt: new Date().toISOString(),
  };
}

export async function getStudentSubjectRoadmap(
  env: Env,
  studentId: string,
  subjectCode: string
): Promise<SubjectRoadmap> {
  const topicsRes = await env.DB.prepare(
    `SELECT DISTINCT topic_name, subject_name FROM master_question_bank WHERE subject_code = ? AND verification_status = 'verified'`
  )
    .bind(subjectCode)
    .all<{ topic_name: string; subject_name: string }>();

  const topicRows = topicsRes.results || [];
  const subjectName = topicRows[0]?.subject_name || `${subjectCode} Subject`;
  const items: SubjectRoadmapItem[] = [];

  let totalScore = 0;

  for (const t of topicRows) {
    const topicName = t.topic_name;
    const mastery = await recalculateStudentTopicMastery(env, studentId, subjectCode, topicName);

    let recommendedAction = 'Practice 10 Questions';
    if (mastery.masteryLevel === 'MASTERED') recommendedAction = 'Maintain with Spaced Revision';
    else if (mastery.masteryLevel === 'PROFICIENT') recommendedAction = 'Challenge with Hard Questions';
    else if (mastery.masteryLevel === 'DEVELOPING') recommendedAction = 'Review Fundamentals & Practice';
    else if (mastery.masteryLevel === 'LOW_CONFIDENCE') recommendedAction = 'Start Practice Session';

    items.push({
      topicName,
      masteryScore: mastery.masteryScore,
      masteryLevel: mastery.masteryLevel,
      confidenceBand: mastery.confidenceBand,
      totalAttempts: mastery.totalAttempts,
      accuracyPercentage: mastery.accuracyPercentage,
      lastPracticedAt: mastery.lastPracticedAt,
      recommendedAction,
    });

    totalScore += mastery.masteryScore;
  }

  const avgScore = items.length > 0 ? totalScore / items.length : 0.0;
  const overallMasteryScore = Math.round(avgScore * 10) / 10;
  const overallConfidence = items.length > 0 ? items[0].confidenceBand : 'LOW_SAMPLE';
  const overallMasteryLevel = computeMasteryLevel(overallMasteryScore, overallConfidence);

  return {
    subjectCode,
    subjectName,
    overallMasteryScore,
    overallMasteryLevel,
    topics: items,
  };
}
