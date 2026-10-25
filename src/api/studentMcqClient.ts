import {
  McqPracticeFilterParams,
  StudentMcqQuestionDTO,
  StudentMcqAnswerEvaluation,
  StudentMcqProgressSummary,
} from '../types';
import { fetchWithAuth } from './client';

export interface McqPracticeResponse {
  success: boolean;
  questions: StudentMcqQuestionDTO[];
  total: number;
  limit: number;
  page: number;
}

export interface McqEvaluationResponse {
  success: boolean;
  evaluation: StudentMcqAnswerEvaluation;
}

export interface McqBookmarkResponse {
  success: boolean;
  isBookmarked: boolean;
  questionId: string;
}

export interface McqBookmarksListResponse {
  success: boolean;
  bookmarks: StudentMcqQuestionDTO[];
  total: number;
}

export interface McqProgressResponse {
  success: boolean;
  progress: StudentMcqProgressSummary;
}

export const studentMcqClient = {
  /**
   * Retrieves verified MCQ practice questions with academic context filters and safe fallbacks.
   */
  async getPracticeQuestions(params?: McqPracticeFilterParams): Promise<McqPracticeResponse> {
    const query = new URLSearchParams();
    if (params?.branchId) query.set('branchId', params.branchId);
    if (params?.semester !== undefined) query.set('semester', String(params.semester));
    if (params?.subjectCode) query.set('subjectCode', params.subjectCode);
    if (params?.subjectName) query.set('subjectName', params.subjectName);
    if (params?.canonicalSubjectId) query.set('canonicalSubjectId', params.canonicalSubjectId);
    if (params?.topicName) query.set('topicName', params.topicName);
    if (params?.difficulty) query.set('difficulty', params.difficulty);
    if (params?.sourceMode) query.set('sourceMode', params.sourceMode);
    if (params?.mode) query.set('mode', params.mode);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.page) query.set('page', String(params.page));
    if (params?.isBookmarkedOnly) query.set('isBookmarkedOnly', 'true');
    if (params?.unattemptedOnly) query.set('unattemptedOnly', 'true');

    const res = await fetchWithAuth(`/api/student/mcq/practice?${query.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load practice questions');
    }
    return res.json();
  },

  /**
   * Submits a student's answer for server-side evaluation & progress tracking.
   */
  async evaluateAnswer(
    questionId: string,
    selectedOptionId: string,
    timeTakenSeconds: number = 0,
    practiceMode: 'RANDOM' | 'TOPIC_WISE' | 'PYQ_WISE' | 'CUSTOM' = 'RANDOM'
  ): Promise<StudentMcqAnswerEvaluation> {
    const res = await fetchWithAuth('/api/student/mcq/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionId,
        selectedOptionId,
        timeTakenSeconds,
        practiceMode,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to evaluate answer');
    }

    const data: McqEvaluationResponse = await res.json();
    return data.evaluation;
  },

  /**
   * Toggles bookmark status for a question.
   */
  async toggleBookmark(questionId: string, notes?: string): Promise<boolean> {
    const res = await fetchWithAuth('/api/student/mcq/bookmark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, notes }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to toggle bookmark');
    }

    const data: McqBookmarkResponse = await res.json();
    return data.isBookmarked;
  },

  /**
   * Retrieves all bookmarked questions for the logged-in student.
   */
  async getBookmarks(): Promise<StudentMcqQuestionDTO[]> {
    const res = await fetchWithAuth('/api/student/mcq/bookmarks');
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch bookmarks');
    }
    const data: McqBookmarksListResponse = await res.json();
    return data.bookmarks || [];
  },

  /**
   * Retrieves progress summary and topic breakdown for the student.
   */
  async getProgress(branchId?: string, subjectCode?: string): Promise<StudentMcqProgressSummary> {
    const query = new URLSearchParams();
    if (branchId) query.set('branchId', branchId);
    if (subjectCode) query.set('subjectCode', subjectCode);

    const res = await fetchWithAuth(`/api/student/mcq/progress?${query.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch progress');
    }
    const data: McqProgressResponse = await res.json();
    return data.progress;
  },
};
