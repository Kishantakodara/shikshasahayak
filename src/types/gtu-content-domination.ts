// ============================================================
// SHIKSHA SAHAYAK OS TYPES: GTU Content Domination Engine (Sprint 11)
// ============================================================

export interface GTUAcademicTaxonomyNode {
  id: string;
  universityName: string;
  branchSlug: string;
  semester: number;
  subjectSlug: string;
  unitNumber: number;
  topicName: string;
  resourceCount: number;
  createdAt: string;
}

export interface ContentRatingFeedbackSpec {
  id: string;
  resourceId: string;
  userId: string;
  rating: number;
  feedbackText?: string;
  qualityScore: number;
  createdAt: string;
}

export interface GTUContentDominationSummary {
  totalBranches: number;
  totalSubjects: number;
  totalTopics: number;
  totalPYQs: number;
  averageQualityScore: number;
}
