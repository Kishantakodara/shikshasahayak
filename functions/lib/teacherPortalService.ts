// ============================================================
// SHIKSHA SAHAYAK OS - TEACHER PORTAL EDGE SERVICE
// ============================================================

import {
  TeacherSubjectAssignmentSpec,
  TeacherAnnouncementSpec,
  TeacherPublishMaterialPayload,
} from "../../src/types/teacher-portal";
import { Env } from "./contentEngine";

/**
 * Fetches assigned subjects and classes for a teacher.
 */
export async function getTeacherAssignments(
  env: Env,
  teacherId: string
): Promise<TeacherSubjectAssignmentSpec[]> {
  try {
    const { results } = await env.DB.prepare(
      `SELECT id, teacher_id, subject_id, branch_id, semester, class_name, created_at
       FROM teacher_subject_assignments
       WHERE teacher_id = ?
       ORDER BY created_at DESC`
    )
      .bind(teacherId)
      .all<Record<string, unknown>>();

    return (results || []).map((row) => ({
      id: String(row.id),
      teacherId: String(row.teacher_id),
      subjectId: String(row.subject_id),
      branchId: String(row.branch_id),
      semester: Number(row.semester),
      className: String(row.class_name),
      createdAt: String(row.created_at),
    }));
  } catch (error) {
    console.error("Error in getTeacherAssignments:", error);
    return [];
  }
}

/**
 * Publishes a study material resource on behalf of a teacher.
 */
export async function publishTeacherMaterial(
  env: Env,
  payload: TeacherPublishMaterialPayload
): Promise<boolean> {
  try {
    const id = `res_t_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    await env.DB.prepare(
      `INSERT INTO study_material_resources (
        id, title, description, university_id, degree_id, branch_id, semester,
        subject_id, unit_id, resource_type, file_url, file_size_bytes, uploaded_by
      ) VALUES (?, ?, ?, 'gtu', 'btech', ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        payload.title,
        payload.description || null,
        payload.branchId,
        payload.semester,
        payload.subjectId,
        payload.unitId || null,
        payload.resourceType || "notes",
        payload.fileUrl,
        payload.fileSizeBytes || 1024,
        payload.teacherId
      )
      .run();

    return true;
  } catch (error) {
    console.error("Error in publishTeacherMaterial:", error);
    return false;
  }
}

/**
 * Publishes a class announcement for a teacher's subject.
 */
export async function createTeacherAnnouncement(
  env: Env,
  teacherId: string,
  subjectId: string,
  title: string,
  content: string
): Promise<TeacherAnnouncementSpec | null> {
  try {
    const id = `t_ann_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    await env.DB.prepare(
      `INSERT INTO teacher_announcements (id, teacher_id, subject_id, title, content)
       VALUES (?, ?, ?, ?, ?)`
    )
      .bind(id, teacherId, subjectId, title, content)
      .run();

    return {
      id,
      teacherId,
      subjectId,
      title,
      content,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error in createTeacherAnnouncement:", error);
    return null;
  }
}
