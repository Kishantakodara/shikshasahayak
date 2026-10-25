// ============================================================
// SHIKSHA SAHAYAK OS - ASSESSMENT PORTAL TYPES
// ============================================================

export type QuizDifficulty = 'easy' | 'medium' | 'hard';

export interface AssessmentQuizSpec {
  id: string;
  title: string;
  description?: string | null;
  subjectId: string;
  branchId: string;
  semester: number;
  difficulty: QuizDifficulty;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  isPublished: boolean;
  createdAt: string;
}

export interface AssessmentQuestionSpec {
  id: string;
  quizId: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string | null;
  marks: number;
  topicId?: string | null;
  createdAt: string;
}

export interface AssessmentAttemptSpec {
  id: string;
  userId: string;
  quizId: string;
  score: number;
  totalMarks: number;
  accuracyPercent: number;
  timeTakenSeconds: number;
  answers?: Record<string, number> | null;
  strongTopics?: string[] | null;
  weakTopics?: string[] | null;
  completedAt: string;
}
