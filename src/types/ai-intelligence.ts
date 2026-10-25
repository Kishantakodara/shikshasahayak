// ============================================================
// SHIKSHA SAHAYAK OS - AI INTELLIGENCE LAYER TYPES
// ============================================================

export type AIFeatureType = 'study_tutor' | 'search_assistant' | 'quiz_generator' | 'concept_explain';

export interface AIExplanationPayload {
  userId: string;
  topicOrQuestion: string;
  contextSubject?: string;
  academicLevel?: string;
}

export interface AIExplanationResult {
  title: string;
  explanation: string;
  keyTakeaways: string[];
  suggestedTopics: string[];
}

export interface AIQuizGeneratorPayload {
  subjectId: string;
  topicName: string;
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface AIQuizDraftSpec {
  id: string;
  subjectId: string;
  topicId?: string | null;
  prompt: string;
  questions: Array<{
    questionText: string;
    options: string[];
    correctOptionIndex: number;
    explanation?: string;
  }>;
  status: 'draft' | 'approved' | 'rejected';
  createdAt: string;
}
