// ============================================================
// SHIKSHA SAHAYAK OS - FRONTEND TEACHER PORTAL CLIENT
// ============================================================

import {
  TeacherSubjectAssignmentSpec,
  TeacherAnnouncementSpec,
  TeacherPublishMaterialPayload,
} from "../types/teacher-portal";

/**
 * Fetches assigned subjects and classes for a teacher.
 */
export async function fetchTeacherSubjectAssignments(
  teacherId = "teacher_101"
): Promise<TeacherSubjectAssignmentSpec[]> {
  try {
    const res = await fetch(`/api/teacher/assignments-list?teacherId=${encodeURIComponent(teacherId)}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error in TeacherPortalClient.fetchTeacherSubjectAssignments:", error);
    return [];
  }
}

/**
 * Publishes a study material resource on behalf of a teacher.
 */
export async function publishStudyMaterialResource(
  payload: TeacherPublishMaterialPayload
): Promise<boolean> {
  try {
    const res = await fetch("/api/teacher/publish-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (error) {
    console.error("Error in TeacherPortalClient.publishStudyMaterialResource:", error);
    return false;
  }
}

/**
 * Fetches teacher announcements for a subject.
 */
export async function fetchSubjectTeacherAnnouncements(
  subjectId: string
): Promise<TeacherAnnouncementSpec[]> {
  try {
    const res = await fetch(`/api/teacher/announcements?subjectId=${encodeURIComponent(subjectId)}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error in TeacherPortalClient.fetchSubjectTeacherAnnouncements:", error);
    return [];
  }
}

/**
 * Creates a new teacher class announcement.
 */
export async function createTeacherClassAnnouncement(
  teacherId: string,
  subjectId: string,
  title: string,
  content: string
): Promise<TeacherAnnouncementSpec | null> {
  try {
    const res = await fetch("/api/teacher/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId, subjectId, title, content }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Error in TeacherPortalClient.createTeacherClassAnnouncement:", error);
    return null;
  }
}
