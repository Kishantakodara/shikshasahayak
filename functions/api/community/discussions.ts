// ============================================================
// SHIKSHA SAHAYAK OS API: /api/community/discussions
// SECURITY: Authenticated user only
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getCommunityDiscussions, createCommunityDiscussion, getStudentAmbassadorStats } from "../../lib/communityDistributionService";
import { getAuthenticatedUser } from "../../lib/auth";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const communityId = url.searchParams.get("communityId") || "gtu_cse_sem5";
  const type = url.searchParams.get("type");

  const user = await getAuthenticatedUser(request, env);
  if (!user) return errorResponse("Unauthorized", 401);

  try {
    if (type === "ambassador") {
      const stats = await getStudentAmbassadorStats(env, user.uid);
      return jsonResponse(stats, { headers: { "Cache-Control": "private, max-age=60" } });
    }

    const discussions = await getCommunityDiscussions(env, communityId);
    return jsonResponse(discussions, { headers: { "Cache-Control": "private, max-age=60" } });
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
      communityId: string;
      title: string;
      content: string;
    };

    if (!body || !body.communityId || !body.title || !body.content) {
      return errorResponse("Missing required fields: communityId, title, content", 400);
    }

    const title = String(body.title).trim().slice(0, 200);
    const content = String(body.content).trim().slice(0, 2000);

    const success = await createCommunityDiscussion(
      env,
      body.communityId,
      user.uid,
      user.email?.split("@")[0] || user.name || "Student",
      title,
      content
    );

    return jsonResponse({ success });
  } catch (error: unknown) {
    return errorResponse("Internal Server Error", 500);
  }
}
