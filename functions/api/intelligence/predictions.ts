// ============================================================
// SHIKSHA SAHAYAK OS API: /api/intelligence/predictions
// Predictive learning analytics & adaptive study path generation
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { fetchPredictiveLearningScores, generateAdaptiveLearningPath } from "../../lib/educationIntelligenceService";
import { getAuthenticatedUser } from "../../lib/auth";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const user = await getAuthenticatedUser(request, env);
  const userId = user ? user.uid : "guest_student";

  const scores = await fetchPredictiveLearningScores(env, userId);
  return jsonResponse({ success: true, scores });
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const user = await getAuthenticatedUser(request, env);
  const userId = user ? user.uid : "guest_student";

  try {
    const body = (await request.json()) as {
      subjectId: string;
      targetExamDate: string;
      dailyHours: number;
    };

    if (!body || !body.subjectId || !body.targetExamDate) {
      return errorResponse("Missing subjectId or targetExamDate", 400);
    }

    const path = await generateAdaptiveLearningPath(env, userId, body.subjectId, body.targetExamDate, body.dailyHours || 2.5);
    return jsonResponse({ success: true, path });
  } catch {
    return errorResponse("Internal Server Error", 500);
  }
}
