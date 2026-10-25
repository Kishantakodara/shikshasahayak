// ============================================================
// SHIKSHA SAHAYAK OS - FRONTEND ASSESSMENT PORTAL CLIENT
// ============================================================

import {
  AssessmentQuizSpec,
  AssessmentQuestionSpec,
  AssessmentAttemptSpec,
} from "../types/assessment-portal";

/**
 * Fetches published quizzes filtered by branch, semester, or subject.
 */
export async function fetchAssessmentQuizzes(filters: {
  branchId?: string;
  semester?: number;
  subjectId?: string;
}): Promise<AssessmentQuizSpec[]> {
  try {
    const params = new URLSearchParams();
    if (filters.branchId) params.append("branchId", filters.branchId);
    if (filters.semester) params.append("semester", String(filters.semester));
    if (filters.subjectId) params.append("subjectId", filters.subjectId);

    const res = await fetch(`/api/assessment/quizzes?${params.toString()}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error in AssessmentPortalClient.fetchAssessmentQuizzes:", error);
    return [];
  }
}

/**
 * Fetches question bank for a specific quiz.
 */
export async function fetchQuizQuestions(
  quizId: string
): Promise<AssessmentQuestionSpec[]> {
  try {
    const res = await fetch(`/api/assessment/quizzes?quizId=${encodeURIComponent(quizId)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.questions || [];
  } catch (error) {
    console.error("Error in AssessmentPortalClient.fetchQuizQuestions:", error);
    return [];
  }
}

/**
 * Submits test attempt and retrieves calculated score, accuracy, and topic analytics.
 */
export async function submitAssessmentAttempt(
  userId: string,
  quizId: string,
  answers: Record<string, number>,
  timeTakenSeconds: number
): Promise<AssessmentAttemptSpec | null> {
  try {
    const res = await fetch("/api/assessment/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, quizId, answers, timeTakenSeconds }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Error in AssessmentPortalClient.submitAssessmentAttempt:", error);
    return null;
  }
}
