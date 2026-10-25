// ============================================================
// SHIKSHA SAHAYAK OS API: /api/career/roadmaps
// Career roadmaps, milestones & student progress tracking
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { fetchCareerRoadmaps, toggleMilestoneProgress } from "../../lib/studentCareerService";
import { getAuthenticatedUser } from "../../lib/auth";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const user = await getAuthenticatedUser(request, env);
  const userId = user ? user.uid : "guest_student";

  const roadmaps = await fetchCareerRoadmaps(env, userId);
  return jsonResponse({ success: true, roadmaps });
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const user = await getAuthenticatedUser(request, env);
  if (!user) return errorResponse("Unauthorized", 401);

  try {
    const body = (await request.json()) as {
      milestoneId: string;
      isCompleted: boolean;
    };

    if (!body || !body.milestoneId) {
      return errorResponse("Missing milestoneId", 400);
    }

    const ok = await toggleMilestoneProgress(env, user.uid, body.milestoneId, body.isCompleted);
    return jsonResponse({ success: ok });
  } catch {
    return errorResponse("Internal Server Error", 500);
  }
}
