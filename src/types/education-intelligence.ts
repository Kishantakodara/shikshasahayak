// ============================================================
// SHIKSHA SAHAYAK OS TYPES: Education Intelligence Platform (Sprint 20)
// ============================================================

export type KnowledgeEntityType =
  | "university"
  | "program"
  | "branch"
  | "subject"
  | "unit"
  | "topic"
  | "concept"
  | "resource"
  | "question"
  | "skill"
  | "project"
  | "career_path"
  | "company"
  | "student"
  | "teacher"
  | "institution";

export type KnowledgeRelationType =
  | "BELONGS_TO"
  | "PREREQUISITE_FOR"
  | "TESTS_CONCEPT"
  | "DEVELOPES_SKILL"
  | "STRENGTHENS_CAREER"
  | "ENROLLED_IN"
  | "TEACHES_SUBJECT"
  | "EQUIVALENT_TO";

export interface KnowledgeGraphNode {
  id: string;
  entityType: KnowledgeEntityType;
  name: string;
  payload?: Record<string, any>;
}

export interface KnowledgeGraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relationType: KnowledgeRelationType;
  weight: number;
}

export interface PredictiveLearningScore {
  userId: string;
  subjectId: string;
  subjectName: string;
  failureRiskScore: number; // 0 - 100%
  completionProbability: number; // 0 - 100%
  confidenceScore: number; // 0.0 - 1.0
  explanation: {
    primaryFactor: string;
    recommendedEffort: string;
  };
}

export interface AdaptivePathDay {
  dayNumber: number;
  date: string;
  topicToStudy: string;
  allocatedHours: number;
  recommendedResourceUrl?: string;
  isDone?: boolean;
}

export interface AdaptiveLearningPath {
  id: string;
  userId: string;
  subjectId: string;
  targetExamDate: string;
  dailyHoursAvailable: number;
  schedule: AdaptivePathDay[];
}

export interface ContextualRecommendation {
  id: string;
  type: "resource" | "assessment" | "project" | "skill" | "roadmap";
  title: string;
  description: string;
  relevanceScore: number; // 0 - 100
  reason: string; // e.g. "Addresses Weak Topic: Binary Trees"
  actionUrl: string;
}

export interface AIOptimizedCompletionRequest {
  taskName: string;
  prompt: string;
  userScope?: string;
  preferredModel?: string;
}

export interface AIOptimizedCompletionResponse {
  resultText: string;
  provider: string;
  modelUsed: string;
  latencyMs: number;
  tokensUsed: number;
}
