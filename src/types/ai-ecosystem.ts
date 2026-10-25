// ============================================================
// SHIKSHA SAHAYAK OS TYPES: AI Learning Ecosystem (Sprint 15)
// ============================================================

export interface AIStudyPlanSpec {
  id: string;
  userId: string;
  subjectId: string;
  dailyTasks: { day: number; task: string; durationMinutes: number }[];
  weakTopics: string[];
  createdAt: string;
}

export interface AIGovernanceLogSpec {
  id: string;
  userId: string;
  promptType: string;
  inputTokens: number;
  latencyMs: number;
  qualityRating?: number;
  createdAt: string;
}
