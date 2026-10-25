// ============================================================
// SHIKSHA SAHAYAK OS - FRONTEND AI INTELLIGENCE CLIENT
// ============================================================

import {
  AIExplanationResult,
  AIQuizDraftSpec,
} from "../types/ai-intelligence";

/**
 * Requests an AI study explanation for a concept or problem.
 */
export async function fetchAIStudyExplanation(
  userId: string,
  topicOrQuestion: string,
  contextSubject = "os"
): Promise<AIExplanationResult | null> {
  try {
    const res = await fetch("/api/ai/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, topicOrQuestion, contextSubject }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Error in AIIntelligenceClient.fetchAIStudyExplanation:", error);
    return null;
  }
}

/**
 * Generates an AI practice quiz draft for teachers/admins to review before publishing.
 */
export async function generateAIQuizDraft(
  subjectId: string,
  topicName: string,
  questionCount = 3
): Promise<AIQuizDraftSpec | null> {
  try {
    const res = await fetch("/api/ai/quiz-generator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjectId, topicName, questionCount }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Error in AIIntelligenceClient.generateAIQuizDraft:", error);
    return null;
  }
}
