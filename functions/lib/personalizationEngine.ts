// ============================================================
// SHIKSHA SAHAYAK OS - PERSONALIZATION ENGINE EDGE SERVICE
// ============================================================

import {
  PersonalizedFeedPayload,
  WidgetLayoutSpec,
  LearningStreakSpec,
} from "../../src/types/personalization";
import { getUnifiedUserProfile } from "./identityAuth";
import { Env, queryLearningResources } from "./contentEngine";

const DEFAULT_WIDGETS: Array<{ widgetKey: WidgetLayoutSpec["widgetKey"]; position: number }> = [
  { widgetKey: "continue_learning", position: 1 },
  { widgetKey: "quick_shortcuts", position: 2 },
  { widgetKey: "recommendations", position: 3 },
  { widgetKey: "bookmarks", position: 4 },
  { widgetKey: "learning_streak", position: 5 },
];

/**
 * Evaluates student academic context and produces personalized feed or explore catalog.
 */
export async function getPersonalizedStudentFeed(
  env: Env,
  userId: string,
  exploreMode = false
): Promise<PersonalizedFeedPayload> {
  const profile = await getUnifiedUserProfile(env, userId);
  const acad = profile?.academicProfile;

  const filters = exploreMode
    ? {}
    : {
        branchId: acad?.branchId || undefined,
        semester: acad?.semesterId ? Number(acad.semesterId) : undefined,
      };

  const resourceResults = await queryLearningResources(env, {
    ...filters,
    page: 1,
    limit: 10,
  });

  const widgets = await getStudentDashboardLayout(env, userId);

  const streakInfo: LearningStreakSpec = {
    userId,
    currentStreakDays: 3,
    longestStreakDays: 7,
    lastActiveDate: new Date().toISOString().split("T")[0],
  };

  return {
    userId,
    isExploreMode: exploreMode,
    activeContext: {
      universityId: acad?.universityId || null,
      degreeId: acad?.degreeId || null,
      branchId: acad?.branchId || null,
      semesterId: acad?.semesterId || null,
    },
    recommendedResources: resourceResults.resources,
    continueLearning: resourceResults.resources.slice(0, 2),
    streakInfo,
    widgets,
  };
}

/**
 * Fetches or seeds default student dashboard widget layout.
 */
export async function getStudentDashboardLayout(
  env: Env,
  userId: string
): Promise<WidgetLayoutSpec[]> {
  try {
    const { results } = await env.DB.prepare(
      `SELECT id, user_id, widget_key, position, is_pinned, updated_at
       FROM dashboard_widget_layout
       WHERE user_id = ?
       ORDER BY position ASC`
    )
      .bind(userId)
      .all<Record<string, unknown>>();

    if (results && results.length > 0) {
      return results.map((row) => ({
        id: String(row.id),
        userId: String(row.user_id),
        widgetKey: String(row.widget_key) as any,
        position: Number(row.position),
        isPinned: Boolean(row.is_pinned),
        updatedAt: String(row.updated_at),
      }));
    }

    return DEFAULT_WIDGETS.map((w, idx) => ({
      id: `w_${userId}_${idx}`,
      userId,
      widgetKey: w.widgetKey,
      position: w.position,
      isPinned: true,
      updatedAt: new Date().toISOString(),
    }));
  } catch (error) {
    console.error("Error in getStudentDashboardLayout:", error);
    return DEFAULT_WIDGETS.map((w, idx) => ({
      id: `w_def_${idx}`,
      userId,
      widgetKey: w.widgetKey,
      position: w.position,
      isPinned: true,
      updatedAt: new Date().toISOString(),
    }));
  }
}

/**
 * Updates student dashboard widget arrangement.
 */
export async function updateStudentDashboardLayout(
  env: Env,
  userId: string,
  widgets: Array<{ widgetKey: WidgetLayoutSpec["widgetKey"]; position: number; isPinned: boolean }>
): Promise<boolean> {
  try {
    for (const w of widgets) {
      const id = `w_${userId}_${w.widgetKey}`;
      await env.DB.prepare(
        `INSERT INTO dashboard_widget_layout (id, user_id, widget_key, position, is_pinned, updated_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(user_id, widget_key) DO UPDATE SET
           position = excluded.position,
           is_pinned = excluded.is_pinned,
           updated_at = CURRENT_TIMESTAMP`
      )
        .bind(id, userId, w.widgetKey, w.position, w.isPinned ? 1 : 0)
        .run();
    }
    return true;
  } catch (error) {
    console.error("Error in updateStudentDashboardLayout:", error);
    return false;
  }
}
