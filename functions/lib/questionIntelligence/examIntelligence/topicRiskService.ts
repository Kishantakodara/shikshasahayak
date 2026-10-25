// ============================================================
// EXAM INTELLIGENCE ENGINE - TOPIC RISK SERVICE
// Evaluates academic risk for each curriculum topic by blending
// historical exam importance with individual student performance.
// ============================================================

import { Env } from '../../contentEngine';
import { StudentTopicRiskDetail, TopicRiskLevel, ExamPriorityLevel } from './types';
import { analyzeSubjectExamTrends } from './examTrendService';

/**
  Calculates student topic risk profiles across all curriculum topics for a subject.
 */
export async function calculateStudentTopicRisks(
  env: Env,
  studentId: string,
  subjectCode: string
): Promise<StudentTopicRiskDetail[]> {
  const code = subjectCode.trim();

  // 1. Get historical exam trends & priority for this subject
  const trends = await analyzeSubjectExamTrends(env, code);

  // 2. Get student topic mastery records from student_topic_mastery
  const masteryRows = await env.DB.prepare(
    `SELECT topic_name, mastery_score, total_attempts, accuracy_percentage
     FROM student_topic_mastery
     WHERE student_id = ? AND subject_code = ?`
  )
    .bind(studentId, code)
    .all<{
      topic_name: string;
      mastery_score: number;
      total_attempts: number;
      accuracy_percentage: number;
    }>();

  const masteryMap = new Map<string, {
    masteryScore: number;
    totalAttempts: number;
    accuracyPercentage: number;
  }>();

  for (const m of masteryRows.results || []) {
    masteryMap.set(m.topic_name.toLowerCase().trim(), {
      masteryScore: Number(m.mastery_score || 0),
      totalAttempts: Number(m.total_attempts || 0),
      accuracyPercentage: Number(m.accuracy_percentage || 0),
    });
  }

  const riskProfiles: StudentTopicRiskDetail[] = [];

  for (const trend of trends) {
    const studentData = masteryMap.get(trend.topicName.toLowerCase().trim());
    const hasAttempts = studentData && studentData.totalAttempts > 0;
    const masteryScore = hasAttempts ? studentData.masteryScore : 0;
    const accuracy = hasAttempts ? studentData.accuracyPercentage : 0;
    const attempts = hasAttempts ? studentData.totalAttempts : 0;

    let riskLevel: TopicRiskLevel = 'LOW_RISK';
    let riskReason = '';
    let action = 'Maintain current revision pace';

    const isHighImportance = trend.priorityLevel === 'CRITICAL' || trend.priorityLevel === 'HIGH';

    if (!hasAttempts) {
      riskLevel = 'NO_STUDENT_DATA';
      riskReason = isHighImportance
        ? 'High-frequency exam topic with zero student practice history'
        : 'Topic has not yet been attempted by student';
      action = isHighImportance
        ? 'Urgent: Start baseline practice on this high-priority topic'
        : 'Attempt initial practice set when ready';
    } else if (isHighImportance && masteryScore < 50) {
      riskLevel = 'CRITICAL_RISK';
      riskReason = `High-importance GTU exam topic with low student mastery (${masteryScore.toFixed(0)}%)`;
      action = 'Immediate focused practice on fundamental concepts & repeated PYQs';
    } else if (isHighImportance && masteryScore < 75) {
      riskLevel = 'HIGH_RISK';
      riskReason = `Important exam topic where student accuracy (${accuracy.toFixed(0)}%) needs strengthening`;
      action = 'Solve additional medium & hard PYQs to achieve proficiency';
    } else if (!isHighImportance && masteryScore < 50) {
      riskLevel = 'MODERATE_RISK';
      riskReason = `Low student mastery (${masteryScore.toFixed(0)}%), but moderate exam frequency`;
      action = 'Review key formulas and core definitions';
    } else {
      riskLevel = 'LOW_RISK';
      riskReason = `Strong student mastery (${masteryScore.toFixed(0)}%) matching exam requirements`;
      action = 'Scheduled periodic revision to retain concepts';
    }

    const detail: StudentTopicRiskDetail = {
      subjectCode: code,
      unitNo: trend.unitNo,
      topicName: trend.topicName,
      historicalPriorityLevel: trend.priorityLevel,
      studentMasteryScore: masteryScore,
      studentAttemptsCount: attempts,
      studentAccuracyPercentage: accuracy,
      riskLevel,
      riskReason,
      recommendedAction: action,
    };

    // Upsert into D1 student_topic_risk_profiles
    try {
      await env.DB.prepare(
        `INSERT INTO student_topic_risk_profiles (
          id, student_id, subject_code, unit_no, topic_name,
          historical_priority_level, student_mastery_score, student_attempts_count,
          risk_level, risk_reason, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(student_id, subject_code, topic_name) DO UPDATE SET
          unit_no = excluded.unit_no,
          historical_priority_level = excluded.historical_priority_level,
          student_mastery_score = excluded.student_mastery_score,
          student_attempts_count = excluded.student_attempts_count,
          risk_level = excluded.risk_level,
          risk_reason = excluded.risk_reason,
          updated_at = CURRENT_TIMESTAMP`
      )
        .bind(
          `strp_${crypto.randomUUID().slice(0, 12)}`,
          studentId,
          code,
          trend.unitNo,
          trend.topicName,
          trend.priorityLevel,
          masteryScore,
          attempts,
          riskLevel,
          riskReason
        )
        .run();
    } catch {
      /* empty */
    }

    riskProfiles.push(detail);
  }

  // Sort: CRITICAL_RISK -> HIGH_RISK -> NO_STUDENT_DATA -> MODERATE_RISK -> LOW_RISK
  const order: Record<TopicRiskLevel, number> = {
    CRITICAL_RISK: 1,
    HIGH_RISK: 2,
    NO_STUDENT_DATA: 3,
    MODERATE_RISK: 4,
    LOW_RISK: 5,
  };

  return riskProfiles.sort((a, b) => order[a.riskLevel] - order[b.riskLevel]);
}
