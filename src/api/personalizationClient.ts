// ============================================================
// SHIKSHA SAHAYAK OS - FRONTEND PERSONALIZATION API CLIENT
// ============================================================

import {
  PersonalizedFeedPayload,
  WidgetLayoutSpec,
} from "../types/personalization";

/**
 * Fetches personalized student feed or explore mode recommendations.
 */
export async function fetchPersonalizedStudentFeed(
  userId = "guest_student",
  exploreMode = false
): Promise<PersonalizedFeedPayload | null> {
  try {
    const res = await fetch(
      `/api/personalization/feed?userId=${encodeURIComponent(userId)}&explore=${exploreMode}`
    );
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Error in PersonalizationClient.fetchPersonalizedStudentFeed:", error);
    return null;
  }
}

/**
 * Fetches student dashboard widget arrangement.
 */
export async function fetchStudentDashboardLayout(
  userId = "guest_student"
): Promise<WidgetLayoutSpec[]> {
  try {
    const res = await fetch(`/api/personalization/dashboard?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error in PersonalizationClient.fetchStudentDashboardLayout:", error);
    return [];
  }
}

/**
 * Updates student dashboard widget layout positions.
 */
export async function updateStudentDashboardLayout(
  userId: string,
  widgets: Array<{ widgetKey: any; position: number; isPinned: boolean }>
): Promise<boolean> {
  try {
    const res = await fetch("/api/personalization/dashboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, widgets }),
    });
    return res.ok;
  } catch (error) {
    console.error("Error in PersonalizationClient.updateStudentDashboardLayout:", error);
    return false;
  }
}

/**
 * Fetches Explore Mode multi-branch catalog discovery feed.
 */
export async function fetchExploreModeCatalog(
  userId = "guest_student"
): Promise<PersonalizedFeedPayload | null> {
  try {
    const res = await fetch(`/api/personalization/explore?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Error in PersonalizationClient.fetchExploreModeCatalog:", error);
    return null;
  }
}
