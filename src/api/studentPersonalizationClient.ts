// ============================================================
// SHIKSHA SAHAYAK OS - FRONTEND STUDENT PERSONALIZATION CLIENT
// ============================================================

import {
  StudentBookmarkSpec,
  StudentRecentActivitySpec,
  WidgetCustomizationSpec,
} from "../types/student-personalization";

/**
 * Fetches bookmarked study materials for a student.
 */
export async function fetchStudentBookmarks(
  userId = "guest_student"
): Promise<StudentBookmarkSpec[]> {
  try {
    const res = await fetch(`/api/student/bookmarks?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error in StudentPersonalizationClient.fetchStudentBookmarks:", error);
    return [];
  }
}

/**
 * Adds a new bookmark for a student.
 */
export async function addStudentBookmark(
  userId: string,
  bookmark: { resourceId: string; resourceType?: string; title: string; url: string; subjectName?: string }
): Promise<boolean> {
  try {
    const res = await fetch("/api/student/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...bookmark }),
    });
    return res.ok;
  } catch (error) {
    console.error("Error in StudentPersonalizationClient.addStudentBookmark:", error);
    return false;
  }
}

/**
 * Removes a bookmark for a student.
 */
export async function removeStudentBookmark(
  userId: string,
  resourceId: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `/api/student/bookmarks?userId=${encodeURIComponent(userId)}&resourceId=${encodeURIComponent(resourceId)}`,
      { method: "DELETE" }
    );
    return res.ok;
  } catch (error) {
    console.error("Error in StudentPersonalizationClient.removeStudentBookmark:", error);
    return false;
  }
}

/**
 * Fetches recent learning activity for a student.
 */
export async function fetchStudentRecentActivity(
  userId = "guest_student"
): Promise<StudentRecentActivitySpec[]> {
  try {
    const res = await fetch(`/api/student/activity?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error in StudentPersonalizationClient.fetchStudentRecentActivity:", error);
    return [];
  }
}

/**
 * Records a new learning activity event for a student.
 */
export async function recordStudentActivity(
  userId: string,
  activity: { actionType?: string; resourceId: string; resourceTitle: string; url: string; subjectName?: string }
): Promise<boolean> {
  try {
    const res = await fetch("/api/student/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...activity }),
    });
    return res.ok;
  } catch (error) {
    console.error("Error in StudentPersonalizationClient.recordStudentActivity:", error);
    return false;
  }
}

/**
 * Fetches reorderable dashboard widget layout customization.
 */
export async function fetchWidgetCustomization(
  userId = "guest_student"
): Promise<WidgetCustomizationSpec[]> {
  try {
    const res = await fetch(`/api/personalization/widgets?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error in StudentPersonalizationClient.fetchWidgetCustomization:", error);
    return [];
  }
}

/**
 * Saves reorderable dashboard widget layout customization.
 */
export async function saveWidgetCustomization(
  userId: string,
  widgets: WidgetCustomizationSpec[]
): Promise<boolean> {
  try {
    const res = await fetch("/api/personalization/widgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, widgets }),
    });
    return res.ok;
  } catch (error) {
    console.error("Error in StudentPersonalizationClient.saveWidgetCustomization:", error);
    return false;
  }
}
