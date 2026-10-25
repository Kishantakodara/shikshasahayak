// ============================================================
// SHIKSHA SAHAYAK OS API: /api/pwa/push
// SECURITY: Authenticated user for subscription registration
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { saveWebPushSubscription, logPWAInstallation } from "../../lib/pwaOfflineService";
import { getAuthenticatedUser } from "../../lib/auth";
import { Env } from "../../lib/contentEngine";

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  if (action === "analytics") {
    try {
      const body = (await request.json()) as { platform: string; userAgent: string };
      const user = await getAuthenticatedUser(request, env);
      await logPWAInstallation(env, user ? user.uid : null, body.platform || "unknown", body.userAgent || "");
      return jsonResponse({ success: true });
    } catch {
      return jsonResponse({ success: false });
    }
  }

  const user = await getAuthenticatedUser(request, env);
  if (!user) return errorResponse("Unauthorized", 401);

  try {
    const body = (await request.json()) as {
      endpoint: string;
      keys: { p256dh: string; auth: string };
      categories?: string[];
    };

    if (!body || !body.endpoint || !body.keys) {
      return errorResponse("Missing required subscription keys", 400);
    }

    const success = await saveWebPushSubscription(env, {
      userId: user.uid,
      endpoint: body.endpoint,
      keys: body.keys,
      deviceInfo: request.headers.get("User-Agent") || undefined,
      categories: body.categories,
    });

    return jsonResponse({ success });
  } catch (error: unknown) {
    return errorResponse("Internal Server Error", 500);
  }
}
