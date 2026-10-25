// ============================================================
// SHIKSHA SAHAYAK OS EDGE SERVICE: Monetization System (Sprint 14)
// ============================================================

import { Env } from "./contentEngine";
import { SubscriptionPlanSpec, UserEntitlementSpec, ProductPackSpec } from "../../src/types/monetization-platform";

export async function getUserEntitlement(env: Env, userId: string): Promise<UserEntitlementSpec> {
  try {
    const res = await env.DB.prepare(
      `SELECT user_id as userId, plan_id as planId, status, expires_at as expiresAt
       FROM user_entitlements WHERE user_id = ?`
    ).bind(userId).first<UserEntitlementSpec>();

    return res || { userId, planId: "free_student", status: "active", expiresAt: "2099-12-31T23:59:59Z" };
  } catch {
    return { userId, planId: "free_student", status: "active", expiresAt: "2099-12-31T23:59:59Z" };
  }
}

export async function getSubscriptionPlans(): Promise<SubscriptionPlanSpec[]> {
  return [
    {
      planId: "free_student",
      name: "ShikshaSahayak Free",
      priceInr: 0,
      features: [
        "100% Free GTU PYQs & Notes",
        "Daily Practice Questions",
        "Streak & Leaderboard Badges",
        "Basic Doubts Assistant",
      ],
    },
    {
      planId: "pro_student",
      name: "ShikshaSahayak Pro Learner",
      priceInr: 149,
      features: [
        "Everything in Free Plan",
        "Unlimited AI Doubts & Tutor Explanations",
        "GTU Mid-Sem & Final Exam Survival Packs",
        "Advanced Weak Area Performance Analytics",
        "Ad-Free Premium Experience",
      ],
    },
  ];
}

export async function getProductPacks(): Promise<ProductPackSpec[]> {
  return [
    {
      packId: "gtu_sem5_survival",
      title: "GTU Sem 5 Survival Pack",
      category: "exam_pack",
      priceInr: 199,
      items: ["Last 5 Year Solved PYQs", "Topic Formula Sheets", "10 Mock Test Series"],
    },
    {
      packId: "gate_2027_starter",
      title: "GATE 2027 CSE Mastery Pack",
      category: "gate_pack",
      priceInr: 499,
      items: ["15 High-Yield Subject Practice Tests", "GATE BM25 AI Tutor Notes", "Video Solutions"],
    },
  ];
}
