// ============================================================
// SHIKSHA SAHAYAK OS API: /api/intelligence/recommendations
// Recommendation Engine 2.0 contextual recommendations
// ============================================================

import { jsonResponse } from "../../lib/json";
import { fetchContextualRecommendations } from "../../lib/educationIntelligenceService";
import { getAuthenticatedUser } from "../../lib/auth";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const user = await getAuthenticatedUser(request, env);
  const userId = user ? user.uid : "guest_student";

  const recommendations = await fetchContextualRecommendations(env, userId);
  return jsonResponse({ success: true, recommendations });
}
