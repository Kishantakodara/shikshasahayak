// ============================================================
// SHIKSHA SAHAYAK OS CLIENT: Institution Success Platform (Sprint 19)
// ============================================================

import {
  InstitutionTenant,
  InstitutionDepartment,
  InstitutionalLibraryResource,
  AccreditationRecord,
  SaasSubscription,
} from "../types/institution-saas";

export async function getInstitutions(): Promise<InstitutionTenant[]> {
  try {
    const res = await fetch(`/api/institution/portal`);
    if (!res.ok) throw new Error("Failed to fetch institutions");
    const data = await res.json();
    return data.institutions || [];
  } catch (error) {
    console.error(error);
    return [
      {
        id: "inst_ldce",
        universityId: "gtu",
        name: "L.D. College of Engineering",
        code: "LDCE",
        slug: "ld-college-engineering",
        domain: "ldce.ac.in",
        branding: { primaryColor: "#0F172A", accentColor: "#f97316" },
        isActive: true,
      },
      {
        id: "inst_vgec",
        universityId: "gtu",
        name: "Vishwakarma Government Engineering College",
        code: "VGEC",
        slug: "vgec-chandkheda",
        domain: "vgec.ac.in",
        branding: { primaryColor: "#0F172A", accentColor: "#06B6D4" },
        isActive: true,
      },
    ];
  }
}

export async function getInstitutionDepartments(institutionId: string): Promise<InstitutionDepartment[]> {
  try {
    const res = await fetch(`/api/institution/portal?action=departments&institutionId=${institutionId}`);
    if (!res.ok) throw new Error("Failed to fetch departments");
    const data = await res.json();
    return data.departments || [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getInstitutionalLibrary(institutionId: string): Promise<InstitutionalLibraryResource[]> {
  try {
    const res = await fetch(`/api/institution/portal?action=library&institutionId=${institutionId}`);
    if (!res.ok) throw new Error("Failed to fetch library resources");
    const data = await res.json();
    return data.library || [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getAccreditationRecords(institutionId: string): Promise<AccreditationRecord[]> {
  try {
    const res = await fetch(`/api/institution/portal?action=accreditation&institutionId=${institutionId}`);
    if (!res.ok) throw new Error("Failed to fetch accreditation records");
    const data = await res.json();
    return data.records || [];
  } catch (error) {
    console.error(error);
    return [
      {
        id: "acc_naac",
        institutionId,
        bodyName: "NAAC",
        academicYear: "2025-2026",
        status: "accredited",
        grade: "A+",
        evidenceCollectedScore: 92,
      },
      {
        id: "acc_nba",
        institutionId,
        bodyName: "NBA",
        academicYear: "2025-2026",
        status: "in_progress",
        evidenceCollectedScore: 84,
      },
    ];
  }
}

export async function getSaasSubscription(institutionId: string): Promise<SaasSubscription | null> {
  try {
    const res = await fetch(`/api/institution/portal?action=subscription&institutionId=${institutionId}`);
    if (!res.ok) throw new Error("Failed to fetch subscription");
    const data = await res.json();
    return data.subscription || null;
  } catch (error) {
    console.error(error);
    return {
      id: "sub_demo",
      institutionId,
      planTier: "Campus Enterprise",
      status: "active",
      studentLimit: 5000,
      facultyLimit: 250,
      priceInr: 250000,
      renewsAt: "2027-08-04",
    };
  }
}
