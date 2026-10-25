// ============================================================
// SHIKSHA SAHAYAK OS - STUDY MATERIAL PLATFORM EDGE SERVICE
// ============================================================

import {
  StudyMaterialResourceSpec,
  AcademicUnitSpec,
  AcademicResourceType,
} from "../../src/types/study-material";
import { Env } from "./contentEngine";

/**
 * Fetches structured study materials with optional branch, semester, subject, unit, and resource type filters.
 */
export async function getStudyMaterialResources(
  env: Env,
  filters: {
    branchId?: string;
    semester?: number;
    subjectId?: string;
    unitId?: string;
    resourceType?: AcademicResourceType;
  }
): Promise<StudyMaterialResourceSpec[]> {
  try {
    let sql = `SELECT id, title, description, university_id, degree_id, branch_id, semester,
                      subject_id, unit_id, topic_id, resource_type, file_url, file_size_bytes,
                      download_count, tags_json, uploaded_by, created_at, updated_at
               FROM study_material_resources WHERE 1=1`;
    const params: (string | number)[] = [];

    if (filters.branchId) {
      sql += ` AND branch_id = ?`;
      params.push(filters.branchId);
    }
    if (filters.semester) {
      sql += ` AND semester = ?`;
      params.push(filters.semester);
    }
    if (filters.subjectId) {
      sql += ` AND subject_id = ?`;
      params.push(filters.subjectId);
    }
    if (filters.unitId) {
      sql += ` AND unit_id = ?`;
      params.push(filters.unitId);
    }
    if (filters.resourceType) {
      sql += ` AND resource_type = ?`;
      params.push(filters.resourceType);
    }

    sql += ` ORDER BY download_count DESC, created_at DESC LIMIT 50`;

    const stmt = env.DB.prepare(sql);
    const { results } = await (params.length > 0 ? stmt.bind(...params) : stmt).all<Record<string, unknown>>();

    return (results || []).map((row) => ({
      id: String(row.id),
      title: String(row.title),
      description: row.description ? String(row.description) : null,
      universityId: String(row.university_id),
      degreeId: String(row.degree_id),
      branchId: String(row.branch_id),
      semester: Number(row.semester),
      subjectId: String(row.subject_id),
      unitId: row.unit_id ? String(row.unit_id) : null,
      topicId: row.topic_id ? String(row.topic_id) : null,
      resourceType: String(row.resource_type) as AcademicResourceType,
      fileUrl: String(row.file_url),
      fileSizeBytes: Number(row.file_size_bytes),
      downloadCount: Number(row.download_count),
      tags: row.tags_json ? JSON.parse(String(row.tags_json)) : [],
      uploadedBy: String(row.uploaded_by),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    }));
  } catch (error) {
    console.error("Error in getStudyMaterialResources:", error);
    return [];
  }
}

/**
 * Fetches units and topics hierarchy for a subject.
 */
export async function getSubjectUnitHierarchy(
  env: Env,
  subjectId: string
): Promise<AcademicUnitSpec[]> {
  try {
    const { results: unitRows } = await env.DB.prepare(
      `SELECT id, subject_id, unit_number, unit_title, description, created_at
       FROM academic_units
       WHERE subject_id = ?
       ORDER BY unit_number ASC`
    )
      .bind(subjectId)
      .all<Record<string, unknown>>();

    return (unitRows || []).map((row) => ({
      id: String(row.id),
      subjectId: String(row.subject_id),
      unitNumber: Number(row.unit_number),
      unitTitle: String(row.unit_title),
      description: row.description ? String(row.description) : null,
      createdAt: String(row.created_at),
    }));
  } catch (error) {
    console.error("Error in getSubjectUnitHierarchy:", error);
    return [];
  }
}

/**
 * Increments download count for a study material resource.
 */
export async function incrementResourceDownloadCount(
  env: Env,
  resourceId: string
): Promise<boolean> {
  try {
    await env.DB.prepare(
      `UPDATE study_material_resources
       SET download_count = download_count + 1, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
      .bind(resourceId)
      .run();

    return true;
  } catch (error) {
    console.error("Error in incrementResourceDownloadCount:", error);
    return false;
  }
}
