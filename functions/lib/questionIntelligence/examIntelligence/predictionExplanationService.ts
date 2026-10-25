// ============================================================
// EXAM INTELLIGENCE ENGINE - PREDICTION EXPLANATION SERVICE
// Formulates clear, explainable evidence summaries for student
// dashboards, ensuring transparent academic decision-support.
// ============================================================

import { TopicTrendDetail, StudentTopicRiskDetail, StudentExamReadinessReport } from './types';

export interface ExplanationSummary {
  headline: string;
  keyInsights: string[];
  recommendedStrategy: string;
  disclaimer: string;
}

/**
  Builds human-readable, explainable insights for student topic risk and readiness.
 */
export function generateStudentIntelligenceExplanation(
  readiness: StudentExamReadinessReport,
  topRisks: StudentTopicRiskDetail[]
): ExplanationSummary {
  const insights: string[] = [];

  // 1. Readiness Insight
  if (readiness.readinessLevel === 'STRONG' || readiness.readinessLevel === 'EXAM_READY') {
    insights.push(`Your overall readiness is ${readiness.overallReadinessScore}% (${readiness.readinessLevel}), reflecting strong preparation across GTU syllabus units.`);
  } else if (readiness.readinessLevel === 'PREPARING' || readiness.readinessLevel === 'DEVELOPING') {
    insights.push(`Your readiness is currently ${readiness.overallReadinessScore}% (${readiness.readinessLevel}). Targeted practice on weak topics will accelerate your preparation.`);
  } else {
    insights.push('You are at the foundation stage. Initial practice on high-frequency GTU topics is recommended.');
  }

  // 2. Risk Insights
  const critical = topRisks.filter(r => r.riskLevel === 'CRITICAL_RISK');
  if (critical.length > 0) {
    insights.push(`Identified ${critical.length} critical-priority topics with low mastery: [${critical.slice(0, 2).map(c => c.topicName).join(', ')}].`);
  }

  const unattempted = topRisks.filter(r => r.riskLevel === 'NO_STUDENT_DATA' && (r.historicalPriorityLevel === 'CRITICAL' || r.historicalPriorityLevel === 'HIGH'));
  if (unattempted.length > 0) {
    insights.push(`You have ${unattempted.length} high-frequency GTU exam topics with zero practice attempts.`);
  }

  // 3. Recommended Strategy
  let strategy = 'Continue balanced practice across medium and hard questions.';
  if (critical.length > 0) {
    strategy = `Focus your study sessions on revising ${critical[0].topicName} before attempting mock tests.`;
  } else if (unattempted.length > 0) {
    strategy = `Begin with baseline practice on ${unattempted[0].topicName} to expand your syllabus coverage.`;
  }

  return {
    headline: `GTU Exam Preparation Analysis: ${readiness.subjectName}`,
    keyInsights: insights,
    recommendedStrategy: strategy,
    disclaimer: 'All insights and signals are derived from historical GTU exam patterns for academic guidance and do not guarantee specific exam questions.',
  };
}
