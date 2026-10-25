// ============================================================
// SHIKSHA SAHAYAK OS API: /api/student/gamification
// SECURITY: Authenticated user only
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getStudentStreakStatus, getStudentXPAchievements, recordXPActivity, getTopLeaderboard } from "../../lib/studentEngagementService";
import { getAuthenticatedUser } from "../../lib/auth";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const view = url.searchParams.get("view");

  if (view === "leaderboard") {
    const leaderboard = await getTopLeaderboard(env);
    return jsonResponse(leaderboard, { headers: { "Cache-Control": "private, max-age=60" } });
  }

  const user = await getAuthenticatedUser(request, env);
  if (!user) return errorResponse("Unauthorized", 401);

  try {
    const streak = await getStudentStreakStatus(env, user.uid);
    const xp = await getStudentXPAchievements(env, user.uid);

    return jsonResponse({ streak, xp });
  } catch (error: unknown) {
    return errorResponse("Internal Server Error", 500);
  }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  const user = await getAuthenticatedUser(request, env);
  if (!user) return errorResponse("Unauthorized", 401);

  try {
    const body = (await request.json()) as {
      xpEarned: number;
      activityType: string;
    };

    if (!body || !body.xpEarned) {
      return errorResponse("Missing xpEarned", 400);
    }

    const xp = Math.min(Math.max(Number(body.xpEarned), 1), 500);
    const success = await recordXPActivity(env, user.uid, xp, body.activityType || "study_session");

    return jsonResponse({ success, userId: user.uid, xpEarned: xp });
  } catch (error: unknown) {
    return errorResponse("Internal Server Error", 500);
  }
}
