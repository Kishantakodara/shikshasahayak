// ============================================================
// SHIKSHA SAHAYAK OS EDGE SERVICE: AI Learning Ecosystem (Sprint 15)
// ============================================================

import { Env } from "./contentEngine";
import { AIStudyPlanSpec } from "../../src/types/ai-ecosystem";

export async function generateAIStudyPlan(
  env: Env,
  userId: string,
  subjectId: string,
  weakTopics: string[]
): Promise<AIStudyPlanSpec> {
  const id = `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const dailyTasks = [
    { day: 1, task: `Review foundational concepts for ${subjectId.toUpperCase()}`, durationMinutes: 30 },
    { day: 2, task: `Solve 5 PYQ problems on ${weakTopics[0] || 'Unit 1'}`, durationMinutes: 45 },
    { day: 3, task: `Take AI Practice Quiz & review weak topic explanations`, durationMinutes: 30 },
    { day: 4, task: `Mid-semester revision & formula sheet recap`, durationMinutes: 40 },
  ];

  try {
    await env.DB.prepare(
      `INSERT INTO ai_study_plans (id, user_id, subject_id, daily_tasks_json, weak_topics_json)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(id, userId, subjectId, JSON.stringify(dailyTasks), JSON.stringify(weakTopics)).run();
  } catch (error) {
    console.error("Failed to persist AI study plan:", error);
  }

  return {
    id,
    userId,
    subjectId,
    dailyTasks,
    weakTopics,
    createdAt: new Date().toISOString(),
  };
}

export async function logAIGovernanceEvent(
  env: Env,
  userId: string,
  promptType: string,
  inputTokens: number,
  latencyMs: number
): Promise<boolean> {
  try {
    const id = `aigov_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await env.DB.prepare(
      `INSERT INTO ai_governance_logs (id, user_id, prompt_type, input_tokens, latency_ms)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(id, userId, promptType, inputTokens, latencyMs).run();

    return true;
  } catch (error) {
    console.error("Failed to log AI governance event:", error);
    return false;
  }
}
