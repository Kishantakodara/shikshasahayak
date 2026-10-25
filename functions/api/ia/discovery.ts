// ============================================================
// SHIKSHA SAHAYAK OS API: /api/ia/discovery
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getDiscoveryFeed } from "../../lib/informationArchitecture";
import { Env } from "../../lib/contentEngine";
import { DiscoveryChannel } from "../../../src/types/information-architecture";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);

  const channel = (url.searchParams.get("channel") as DiscoveryChannel) || "popular";

  const searchParams = {
    universityId: url.searchParams.get("universityId") || undefined,
    branchId: url.searchParams.get("branchId") || undefined,
    branchSlug: url.searchParams.get("branchSlug") || undefined,
    semester: url.searchParams.get("semester") ? Number(url.searchParams.get("semester")) : undefined,
    subjectId: url.searchParams.get("subjectId") || undefined,
    limit: url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : 12,
  };

  try {
    const feed = await getDiscoveryFeed(env, channel, searchParams);
    return jsonResponse(feed, {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
