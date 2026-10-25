// ============================================================
// SHIKSHA SAHAYAK OS CLIENT: AI Learning Ecosystem (Sprint 15)
// ============================================================

import { AIStudyPlanSpec } from "../types/ai-ecosystem";

export async function requestAIStudyPlan(subjectId: string, weakTopics?: string[]): Promise<AIStudyPlanSpec | null> {
  try {
    const res = await fetch(`/api/ai/planner`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjectId, weakTopics }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
