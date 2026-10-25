// ============================================================
// SHIKSHA SAHAYAK OS CLIENT: PWA & Offline Learning (Sprint 16)
// ============================================================

export async function registerPushSubscription(subscription: PushSubscription, categories?: string[]): Promise<boolean> {
  try {
    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys) return false;

    const res = await fetch(`/api/pwa/push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: json.keys,
        categories,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function trackPWAInstallation(platform: string): Promise<void> {
  try {
    await fetch(`/api/pwa/push?action=analytics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform,
        userAgent: navigator.userAgent,
      }),
    });
  } catch {
    // Fire and forget
  }
}
