// ============================================================
// SHIKSHA SAHAYAK OS - FRONTEND STUDY MATERIAL PLATFORM CLIENT
// ============================================================

import {
  StudyMaterialResourceSpec,
  AcademicUnitSpec,
  AcademicResourceType,
} from "../types/study-material";

/**
 * Fetches study material resources filtered by branch, semester, subject, unit, or resource type.
 */
export async function fetchStudyMaterialResources(filters: {
  branchId?: string;
  semester?: number;
  subjectId?: string;
  unitId?: string;
  resourceType?: AcademicResourceType;
}): Promise<StudyMaterialResourceSpec[]> {
  try {
    const params = new URLSearchParams();
    if (filters.branchId) params.append("branchId", filters.branchId);
    if (filters.semester) params.append("semester", String(filters.semester));
    if (filters.subjectId) params.append("subjectId", filters.subjectId);
    if (filters.unitId) params.append("unitId", filters.unitId);
    if (filters.resourceType) params.append("resourceType", filters.resourceType);

    const res = await fetch(`/api/study-material/resources?${params.toString()}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error in StudyMaterialPlatformClient.fetchStudyMaterialResources:", error);
    return [];
  }
}

/**
 * Fetches units and topics hierarchy for a subject.
 */
export async function fetchSubjectUnitHierarchy(
  subjectId: string
): Promise<AcademicUnitSpec[]> {
  try {
    const res = await fetch(`/api/study-material/units?subjectId=${encodeURIComponent(subjectId)}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error in StudyMaterialPlatformClient.fetchSubjectUnitHierarchy:", error);
    return [];
  }
}

/**
 * Tracks a download event for a study material resource.
 */
export async function trackResourceDownload(resourceId: string): Promise<boolean> {
  try {
    const res = await fetch("/api/study-material/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resourceId }),
    });
    return res.ok;
  } catch (error) {
    console.error("Error in StudyMaterialPlatformClient.trackResourceDownload:", error);
    return false;
  }
}
