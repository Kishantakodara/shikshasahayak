// ============================================================
// EXAM INTELLIGENCE ENGINE - UNIFIED TYPES
// Decision-support academic intelligence, trend analysis,
// student readiness, topic risk, and personalized preparation.
// ============================================================

export type TrendDirection =
  | 'RISING'
  | 'STABLE'
  | 'DECLINING'
  | 'RECENTLY_APPEARED'
  | 'LONG_ABSENCE'
  | 'HIGH_RECURRENCE'
  | 'LOW_RECURRENCE'
  | 'INSUFFICIENT_DATA';

export type ExamPriorityLevel =
  | 'CRITICAL'
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW'
  | 'INSUFFICIENT_DATA';

export type TopicRiskLevel =
  | 'CRITICAL_RISK'
  | 'HIGH_RISK'
  | 'MODERATE_RISK'
  | 'LOW_RISK'
  | 'NO_STUDENT_DATA';

export type ExamReadinessLevel =
  | 'NOT_STARTED'
  | 'FOUNDATION'
  | 'DEVELOPING'
  | 'PREPARING'
  | 'EXAM_READY'
  | 'STRONG';

export type RecommendationMode =
  | 'EXAM_PRIORITY'
  | 'WEAK_AND_FREQUENT'
  | 'REPEATED_PYQ'
  | 'REVISION_DUE'
  | 'TRENDING_TOPIC'
  | 'READINESS_BUILD'
  | 'FULL_MOCK_PREPARATION';

export interface TopicTrendDetail {
  subjectCode: string;
  unitNo: number;
  unitName: string;
  topicName: string;
  totalHistoricalFrequency: number;
  recentFrequency: number; // in last 2 analyzed sessions
  olderFrequency: number;  // in earlier analyzed sessions
  repeatClusterCount: number;
  averageMarks: number;
  trendDirection: TrendDirection;
  priorityScore: number; // 0 to 100
  priorityLevel: ExamPriorityLevel;
  confidence: number;    // 0.0 to 1.0
  evidence: string[];
}

export interface RecurrenceConceptDetail {
  clusterId: string;
  canonicalQuestionText: string;
  subjectCode: string;
  repeatCount: number;
  sessionsAppeared: string[];
  yearsAppeared: number[];
  firstSeenSession: string;
  lastSeenSession: string;
  averageSessionGap: number;
  repeatFrequencyBand: 'VERY_HIGH_REPEAT' | 'HIGH_REPEAT' | 'MEDIUM_REPEAT' | 'LOW_REPEAT' | 'UNIQUE';
  historicalImportance: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  evidence: string[];
}

export interface StudentTopicRiskDetail {
  subjectCode: string;
  unitNo: number;
  topicName: string;
  historicalPriorityLevel: ExamPriorityLevel;
  studentMasteryScore: number;
  studentAttemptsCount: number;
  studentAccuracyPercentage: number;
  riskLevel: TopicRiskLevel;
  riskReason: string;
  recommendedAction: string;
}

export interface ReadinessDimensionScore {
  dimension: 'CONTENT_COVERAGE' | 'TOPIC_MASTERY' | 'PYQ_MASTERY' | 'EXAM_PATTERN_COVERAGE' | 'DIFFICULTY_READINESS' | 'RECENT_PERFORMANCE' | 'REVISION_HEALTH';
  label: string;
  score: number; // 0 to 100
  weight: number;
  status: 'STRONG' | 'DEVELOPING' | 'NEEDS_ATTENTION';
  detail: string;
}

export interface StudentExamReadinessReport {
  studentId: string;
  subjectCode: string;
  subjectName: string;
  semester: number;
  overallReadinessScore: number; // 0 to 100
  readinessLevel: ExamReadinessLevel;
  confidence: number;
  dimensions: ReadinessDimensionScore[];
  weakAreas: string[];
  strongAreas: string[];
  recommendedNextActions: string[];
  calculatedAt: string;
}

export interface PreparationTask {
  id: string;
  type: 'REVISE_TOPIC' | 'PRACTICE_PYQS' | 'ATTEMPT_DIFFICULTY' | 'REVIEW_MISTAKES';
  title: string;
  description: string;
  topicName?: string;
  targetQuestionCount?: number;
  estimatedMinutes: number;
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL';
  isCompleted: boolean;
}

export interface PersonalizedPreparationPlan {
  studentId: string;
  subjectCode: string;
  subjectName: string;
  targetExamSession?: string;
  overallReadinessScore: number;
  dailyTargetQuestions: number;
  todayTasks: PreparationTask[];
  upcomingMilestones: Array<{
    title: string;
    unitNo: number;
    targetDate: string;
    progressPercentage: number;
  }>;
  revisionQueue: Array<{
    topicName: string;
    daysSincePractice: number;
    urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
}

export interface RecommendedQuestionItem {
  id: string;
  questionText: string;
  questionType: string;
  subjectCode: string;
  subjectName: string;
  semester: number;
  unitNo?: number;
  topicName?: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  options?: Array<{ id: string; text: string }>;
  isOriginalPyq: boolean;
  examName?: string | null;
  examYear?: number | null;
  recommendationReason: string;
  priorityLevel: ExamPriorityLevel;
}
