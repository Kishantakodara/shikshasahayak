// ============================================================
// SHIKSHA SAHAYAK OS CLIENT: Monetization System (Sprint 14)
// ============================================================

import { SubscriptionPlanSpec, UserEntitlementSpec, ProductPackSpec } from "../types/monetization-platform";

export async function fetchSubscriptionPlans(): Promise<SubscriptionPlanSpec[]> {
  try {
    const res = await fetch(`/api/monetization/subscriptions?view=plans`);
    if (!res.ok) throw new Error("Failed");
    return await res.json();
  } catch {
    return [
      {
        planId: "free_student",
        name: "ShikshaSahayak Free",
        priceInr: 0,
        features: ["100% Free GTU PYQs & Notes", "Daily Practice Questions", "Streak & Leaderboard Badges"],
      },
      {
        planId: "pro_student",
        name: "ShikshaSahayak Pro Learner",
        priceInr: 149,
        features: ["Unlimited AI Doubts & Tutor", "GTU Exam Survival Packs", "Advanced Analytics"],
      },
    ];
  }
}

export async function fetchProductPacks(): Promise<ProductPackSpec[]> {
  try {
    const res = await fetch(`/api/monetization/subscriptions?view=packs`);
    if (!res.ok) throw new Error("Failed");
    return await res.json();
  } catch {
    return [
      {
        packId: "gtu_sem5_survival",
        title: "GTU Sem 5 Survival Pack",
        category: "exam_pack",
        priceInr: 199,
        items: ["Last 5 Year Solved PYQs", "Topic Formula Sheets", "10 Mock Test Series"],
      },
    ];
  }
}

export async function fetchUserEntitlement(): Promise<UserEntitlementSpec | null> {
  try {
    const res = await fetch(`/api/monetization/subscriptions`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
