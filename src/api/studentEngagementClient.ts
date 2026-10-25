// ============================================================
// SHIKSHA SAHAYAK OS CLIENT: Student Engagement & Gamification (Sprint 12)
// ============================================================

import { StudentStreakSpec, StudentXPAchievementSpec, LeaderboardUserSpec } from "../types/engagement-gamification";

export async function fetchStudentGamificationStatus(): Promise<{ streak: StudentStreakSpec; xp: StudentXPAchievementSpec } | null> {
  try {
    const res = await fetch(`/api/student/gamification`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchLeaderboard(): Promise<LeaderboardUserSpec[]> {
  try {
    const res = await fetch(`/api/student/gamification?view=leaderboard`);
    if (!res.ok) throw new Error("Failed");
    return await res.json();
  } catch {
    return [];
  }
}

export async function claimActivityXP(xpEarned: number, activityType: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/student/gamification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ xpEarned, activityType }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
