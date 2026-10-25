// ============================================================
// SHIKSHA SAHAYAK OS API: /api/personalization/widgets
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getStudentDashboardLayout, updateStudentDashboardLayout } from "../../lib/personalizationEngine";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId") || "guest_student";

  try {
    const layout = await getStudentDashboardLayout(env, userId);
    return jsonResponse(layout, {
      headers: { "Cache-Control": "private, no-cache" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    const body = (await request.json()) as {
      userId: string;
      widgets: Array<{ widgetKey: any; position: number; isPinned: boolean }>;
    };

    if (!body || !body.userId || !Array.isArray(body.widgets)) {
      return errorResponse("Invalid body payload", 400);
    }

    const success = await updateStudentDashboardLayout(env, body.userId, body.widgets);
    return jsonResponse({ success, userId: body.userId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
