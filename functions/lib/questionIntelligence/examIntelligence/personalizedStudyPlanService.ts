// ============================================================
// EXAM INTELLIGENCE ENGINE - PERSONALIZED STUDY PLAN SERVICE
// Generates actionable daily targets, unit milestones, and
// revision queues customized to student weaknesses and GTU priorities.
// ============================================================

import { Env } from '../../contentEngine';
import {
  PersonalizedPreparationPlan,
  PreparationTask,
} from './types';
import { calculateStudentExamReadiness } from './examReadinessService';
import { calculateStudentTopicRisks } from './topicRiskService';
import { getSubjectRecurrenceIntelligence } from './recurrenceIntelligenceService';

/**
  Generates or refreshes a student's personalized GTU preparation plan.
 */
export async function generatePersonalizedPreparationPlan(
  env: Env,
  studentId: string,
  subjectCode: string,
  semester: number = 1,
  targetExamSession: string = 'W2024'
): Promise<PersonalizedPreparationPlan> {
  const code = subjectCode.trim();

  // 1. Fetch Readiness Report & Topic Risks
  const readiness = await calculateStudentExamReadiness(env, studentId, code, semester);
  const topicRisks = await calculateStudentTopicRisks(env, studentId, code);
  const recurrence = await getSubjectRecurrenceIntelligence(env, code);

  // 2. Identify highest risk topics and unattempted high priority topics
  const criticalRisks = topicRisks.filter(t => t.riskLevel === 'CRITICAL_RISK');
  const highRisks = topicRisks.filter(t => t.riskLevel === 'HIGH_RISK');
  const unattemptedHighPrio = topicRisks.filter(
    t => t.riskLevel === 'NO_STUDENT_DATA' && (t.historicalPriorityLevel === 'CRITICAL' || t.historicalPriorityLevel === 'HIGH')
  );

  const todayTasks: PreparationTask[] = [];

  // Task 1: Address top critical/high risk topic
  const primaryFocusTopic = criticalRisks[0]?.topicName || highRisks[0]?.topicName || unattemptedHighPrio[0]?.topicName || topicRisks[0]?.topicName || 'Core Formulas';
  todayTasks.push({
    id: `task_${crypto.randomUUID().slice(0, 8)}`,
    type: 'REVISE_TOPIC',
    title: `Master High-Risk Topic: ${primaryFocusTopic}`,
    description: `Review fundamental concepts, standard formulas, and solve 5 practice questions for ${primaryFocusTopic}.`,
    topicName: primaryFocusTopic,
    targetQuestionCount: 5,
    estimatedMinutes: 25,
    priority: 'CRITICAL',
    isCompleted: false,
  });

  // Task 2: Repeated GTU PYQ practice
  const topRepeatedConcept = recurrence[0]?.canonicalQuestionText?.slice(0, 50) || 'Repeated Network / Algebra Problems';
  todayTasks.push({
    id: `task_${crypto.randomUUID().slice(0, 8)}`,
    type: 'PRACTICE_PYQS',
    title: 'Solve Top Recurring GTU PYQs',
    description: `Practice 5 questions historically asked in 3+ GTU exam sessions (${topRepeatedConcept}...).`,
    targetQuestionCount: 5,
    estimatedMinutes: 20,
    priority: 'HIGH',
    isCompleted: false,
  });

  // Task 3: Medium/Hard Question Challenge
  todayTasks.push({
    id: `task_${crypto.randomUUID().slice(0, 8)}`,
    type: 'ATTEMPT_DIFFICULTY',
    title: 'Attempt 3 Medium/Hard Benchmark Questions',
    description: 'Build exam stamina by solving 3 multi-mark GTU questions with step-by-step solutions.',
    targetQuestionCount: 3,
    estimatedMinutes: 15,
    priority: 'NORMAL',
    isCompleted: false,
  });

  // 3. Upcoming Unit Milestones
  const unitsMap = new Map<number, { total: number; attempted: number }>();
  for (const t of topicRisks) {
    const u = t.unitNo || 1;
    const existing = unitsMap.get(u) || { total: 0, attempted: 0 };
    existing.total++;
    if (t.studentAttemptsCount > 0) existing.attempted++;
    unitsMap.set(u, existing);
  }

  const upcomingMilestones = Array.from(unitsMap.entries()).map(([unitNo, stats]) => {
    const progress = stats.total > 0 ? Math.round((stats.attempted / stats.total) * 100) : 0;
    return {
      title: `Unit ${unitNo} Mastery Milestone`,
      unitNo,
      targetDate: 'Within 7 Days',
      progressPercentage: progress,
    };
  });

  // 4. Revision Queue
  const revisionQueue = topicRisks
    .filter(t => t.studentAttemptsCount > 0 && t.studentMasteryScore < 75)
    .slice(0, 4)
    .map(t => ({
      topicName: t.topicName,
      daysSincePractice: 2,
      urgency: (t.riskLevel === 'CRITICAL_RISK' ? 'HIGH' : 'MEDIUM') as 'HIGH' | 'MEDIUM' | 'LOW',
    }));

  const plan: PersonalizedPreparationPlan = {
    studentId,
    subjectCode: code,
    subjectName: readiness.subjectName,
    targetExamSession,
    overallReadinessScore: readiness.overallReadinessScore,
    dailyTargetQuestions: 10,
    todayTasks,
    upcomingMilestones,
    revisionQueue,
  };

  // 5. Persist Plan in D1
  try {
    await env.DB.prepare(
      `INSERT INTO student_preparation_plans (
        id, student_id, subject_code, target_exam_session, plan_status,
        daily_target_questions, today_tasks_json, upcoming_milestones_json,
        revision_queue_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'ACTIVE', 10, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(student_id, subject_code, plan_status) DO UPDATE SET
        today_tasks_json = excluded.today_tasks_json,
        upcoming_milestones_json = excluded.upcoming_milestones_json,
        revision_queue_json = excluded.revision_queue_json,
        updated_at = CURRENT_TIMESTAMP`
    )
      .bind(
        `spp_${crypto.randomUUID().slice(0, 12)}`,
        studentId,
        code,
        targetExamSession,
        JSON.stringify(todayTasks),
        JSON.stringify(upcomingMilestones),
        JSON.stringify(revisionQueue)
      )
      .run();
  } catch {
    /* empty */
  }

  return plan;
}
