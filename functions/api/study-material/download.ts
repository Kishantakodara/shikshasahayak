// ============================================================
// SHIKSHA SAHAYAK OS API: /api/study-material/download
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { incrementResourceDownloadCount } from "../../lib/studyMaterialService";
import { Env } from "../../lib/contentEngine";

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    const body = (await request.json()) as { resourceId: string };

    if (!body || !body.resourceId) {
      return errorResponse("Missing resourceId", 400);
    }

    const success = await incrementResourceDownloadCount(env, body.resourceId);
    return jsonResponse({ success, resourceId: body.resourceId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
