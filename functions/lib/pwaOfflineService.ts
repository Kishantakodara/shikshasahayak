// ============================================================
// SHIKSHA SAHAYAK OS EDGE SERVICE: PWA & Push Notifications (Sprint 16)
// ============================================================

import { Env } from "./contentEngine";
import { WebPushSubscriptionSpec } from "../../src/types/pwa-offline";

export async function saveWebPushSubscription(
  env: Env,
  sub: WebPushSubscriptionSpec
): Promise<boolean> {
  try {
    const id = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const categories = JSON.stringify(sub.categories || ["reminders", "materials", "announcements"]);

    await env.DB.prepare(
      `INSERT INTO pwa_push_subscriptions (id, user_id, endpoint, p256dh, auth, device_info, categories_json)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(endpoint) DO UPDATE SET
         user_id = excluded.user_id,
         p256dh = excluded.p256dh,
         auth = excluded.auth,
         categories_json = excluded.categories_json`
    ).bind(id, sub.userId, sub.endpoint, sub.keys.p256dh, sub.keys.auth, sub.deviceInfo || null, categories).run();

    return true;
  } catch (error) {
    console.error("Failed to save push subscription:", error);
    return false;
  }
}

export async function logPWAInstallation(
  env: Env,
  userId: string | null,
  platform: string,
  userAgent: string
): Promise<boolean> {
  try {
    const id = `inst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await env.DB.prepare(
      `INSERT INTO pwa_installation_analytics (id, user_id, platform, user_agent)
       VALUES (?, ?, ?, ?)`
    ).bind(id, userId, platform, userAgent).run();

    return true;
  } catch (error) {
    console.error("Failed to log PWA installation:", error);
    return false;
  }
}
