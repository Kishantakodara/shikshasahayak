// ============================================================
// SHIKSHA SAHAYAK OS API: /api/monetization/subscriptions
// SECURITY: Public GET for plans, Authenticated GET for entitlement
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getUserEntitlement, getSubscriptionPlans, getProductPacks } from "../../lib/monetizationPlatformService";
import { getAuthenticatedUser } from "../../lib/auth";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const view = url.searchParams.get("view");

  if (view === "plans") {
    const plans = await getSubscriptionPlans();
    return jsonResponse(plans, { headers: { "Cache-Control": "public, max-age=3600" } });
  }

  if (view === "packs") {
    const packs = await getProductPacks();
    return jsonResponse(packs, { headers: { "Cache-Control": "public, max-age=3600" } });
  }

  const user = await getAuthenticatedUser(request, env);
  if (!user) return errorResponse("Unauthorized", 401);

  try {
    const entitlement = await getUserEntitlement(env, user.uid);
    return jsonResponse(entitlement, { headers: { "Cache-Control": "private, max-age=60" } });
  } catch (error: unknown) {
    return errorResponse("Internal Server Error", 500);
  }
}
