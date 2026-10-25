// ============================================================
// SHIKSHA SAHAYAK OS EDGE SERVICE: Institution Success Platform (Sprint 19)
// ============================================================

import { Env } from "./contentEngine";
import { InstitutionTenant, InstitutionDepartment, InstitutionalLibraryResource, AccreditationRecord, SaasSubscription } from "../../src/types/institution-saas";

export async function fetchInstitutions(env: Env): Promise<InstitutionTenant[]> {
  try {
    const { results } = await env.DB.prepare(
      `SELECT id, university_id as universityId, name, code, slug, logo_url as logoUrl, domain,
              branding_json, is_active as isActive
       FROM institutions ORDER BY name ASC`
    ).all();

    return (results || []).map((row: any) => ({
      id: row.id,
      universityId: row.universityId,
      name: row.name,
      code: row.code,
      slug: row.slug,
      logoUrl: row.logoUrl,
      domain: row.domain,
      branding: JSON.parse(row.branding_json || '{"primary_color": "#0F172A", "accent_color": "#f97316"}'),
      isActive: Boolean(row.isActive),
    }));
  } catch (error) {
    console.error("Failed to fetch institutions:", error);
    return [];
  }
}

export async function fetchInstitutionDepartments(env: Env, institutionId: string): Promise<InstitutionDepartment[]> {
  try {
    const { results } = await env.DB.prepare(
      `SELECT id, institution_id as institutionId, name, code, head_of_dept_user_id as headOfDeptUserId
       FROM institution_departments WHERE institution_id = ? ORDER BY name ASC`
    ).bind(institutionId).all();

    return (results || []).map((row: any) => ({
      id: row.id,
      institutionId: row.institutionId,
      name: row.name,
      code: row.code,
      headOfDeptUserId: row.headOfDeptUserId,
      facultyCount: 12,
      studentCount: 450,
    }));
  } catch (error) {
    console.error("Failed to fetch departments:", error);
    return [];
  }
}

export async function fetchInstitutionalLibrary(env: Env, institutionId: string): Promise<InstitutionalLibraryResource[]> {
  try {
    const { results } = await env.DB.prepare(
      `SELECT id, institution_id as institutionId, department_id as departmentId, title,
              resource_type as resourceType, file_url as fileUrl, file_size_bytes as fileSizeBytes,
              uploaded_by as uploadedBy, is_public as isPublic, created_at as createdAt
       FROM institutional_library_resources WHERE institution_id = ? ORDER BY created_at DESC`
    ).bind(institutionId).all();

    return (results || []).map((row: any) => ({
      id: row.id,
      institutionId: row.institutionId,
      departmentId: row.departmentId,
      title: row.title,
      resourceType: row.resourceType,
      fileUrl: row.fileUrl,
      fileSizeBytes: row.fileSizeBytes,
      uploadedBy: row.uploadedBy,
      isPublic: Boolean(row.isPublic),
      createdAt: row.createdAt,
    }));
  } catch (error) {
    console.error("Failed to fetch library resources:", error);
    return [];
  }
}

export async function addInstitutionalLibraryResource(
  env: Env,
  institutionId: string,
  resource: Omit<InstitutionalLibraryResource, "id" | "institutionId" | "createdAt">
): Promise<boolean> {
  try {
    const id = `lib_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await env.DB.prepare(
      `INSERT INTO institutional_library_resources (id, institution_id, department_id, title, resource_type, file_url, file_size_bytes, uploaded_by, is_public)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      institutionId,
      resource.departmentId || null,
      resource.title,
      resource.resourceType,
      resource.fileUrl,
      resource.fileSizeBytes || 1048576,
      resource.uploadedBy,
      resource.isPublic ? 1 : 0
    ).run();

    return true;
  } catch (error) {
    console.error("Failed to add library resource:", error);
    return false;
  }
}

export async function fetchAccreditationRecords(env: Env, institutionId: string): Promise<AccreditationRecord[]> {
  try {
    const { results } = await env.DB.prepare(
      `SELECT id, institution_id as institutionId, body_name as bodyName, academic_year as academicYear,
              status, grade, score_json, report_url as reportUrl
       FROM accreditation_records WHERE institution_id = ?`
    ).bind(institutionId).all();

    return (results || []).map((row: any) => ({
      id: row.id,
      institutionId: row.institutionId,
      bodyName: row.bodyName,
      academicYear: row.academicYear,
      status: row.status,
      grade: row.grade,
      evidenceCollectedScore: JSON.parse(row.score_json || "{}").evidence_collected || 85,
      reportUrl: row.reportUrl,
    }));
  } catch (error) {
    console.error("Failed to fetch accreditation records:", error);
    return [];
  }
}

export async function fetchSaasSubscription(env: Env, institutionId: string): Promise<SaasSubscription | null> {
  try {
    const row = await env.DB.prepare(
      `SELECT id, institution_id as institutionId, plan_tier as planTier, status,
              student_limit as studentLimit, faculty_limit as facultyLimit, price_inr as priceInr, renews_at as renewsAt
       FROM saas_subscriptions WHERE institution_id = ?`
    ).bind(institutionId).first() as any;

    if (!row) return null;

    return {
      id: row.id,
      institutionId: row.institutionId,
      planTier: row.planTier,
      status: row.status,
      studentLimit: row.studentLimit,
      facultyLimit: row.facultyLimit,
      priceInr: row.priceInr,
      renewsAt: row.renewsAt,
    };
  } catch (error) {
    console.error("Failed to fetch SaaS subscription:", error);
    return null;
  }
}
