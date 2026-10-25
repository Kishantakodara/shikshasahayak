// ============================================================
// EXAM INTELLIGENCE ENGINE - MAIN ORCHESTRATION SERVICE
// Unified entry point for GTU Exam Intelligence, Subject Overviews,
// and Student-Specific Personalized Dashboards.
// ============================================================

import { Env } from '../../contentEngine';
import { analyzeSubjectExamTrends } from './examTrendService';
import { getSubjectRecurrenceIntelligence } from './recurrenceIntelligenceService';
import { calculateStudentTopicRisks } from './topicRiskService';
import { calculateStudentExamReadiness } from './examReadinessService';
import { generatePersonalizedPreparationPlan } from './personalizedStudyPlanService';
import { getIntelligentQuestionRecommendations } from './questionRecommendationService';
import { generateStudentIntelligenceExplanation } from './predictionExplanationService';
import { generateExamPatternReport } from '../examPatternIntelligenceService';

export interface SubjectExamIntelligenceOverview {
  subjectCode: string;
  subjectName: string;
  totalAnalyzedQuestions: number;
  trends: Array<any>;
  recurrence: Array<any>;
  examPatterns: any;
}

export interface StudentExamIntelligenceDashboard {
  studentId: string;
  subjectCode: string;
  subjectName: string;
  readiness: any;
  topicRisks: any[];
  preparationPlan: any;
  explanation: any;
}

/**
  Retrieves public / subject-wide academic intelligence for a GTU subject.
 */
export async function getSubjectExamIntelligenceOverview(
  env: Env,
  subjectCode: string
): Promise<SubjectExamIntelligenceOverview> {
  const code = subjectCode.trim();

  const subjRow = await env.DB.prepare(
    `SELECT subject_name FROM master_question_bank WHERE subject_code = ? LIMIT 1`
  )
    .bind(code)
    .first<{ subject_name: string }>();

  const subjectName = subjRow?.subject_name || `${code} Engineering`;

  const [trends, recurrence, examPatterns] = await Promise.all([
    analyzeSubjectExamTrends(env, code),
    getSubjectRecurrenceIntelligence(env, code),
    generateExamPatternReport(env, code),
  ]);

  return {
    subjectCode: code,
    subjectName,
    totalAnalyzedQuestions: examPatterns.totalQuestionsAnalyzed,
    trends,
    recurrence,
    examPatterns,
  };
}

/**
  Retrieves complete, student-specific personalized preparation and intelligence dashboard.
 */
export async function getStudentExamDashboardData(
  env: Env,
  studentId: string,
  subjectCode: string,
  semester: number = 1
): Promise<StudentExamIntelligenceDashboard> {
  const code = subjectCode.trim();

  const [readiness, topicRisks, preparationPlan] = await Promise.all([
    calculateStudentExamReadiness(env, studentId, code, semester),
    calculateStudentTopicRisks(env, studentId, code),
    generatePersonalizedPreparationPlan(env, studentId, code, semester),
  ]);

  const explanation = generateStudentIntelligenceExplanation(readiness, topicRisks);

  return {
    studentId,
    subjectCode: code,
    subjectName: readiness.subjectName,
    readiness,
    topicRisks,
    preparationPlan,
    explanation,
  };
}
