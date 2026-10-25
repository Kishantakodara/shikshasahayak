// ============================================================
// SHIKSHA SAHAYAK OS TYPES: Institution Success Platform (Sprint 19)
// ============================================================

export interface InstitutionTenant {
  id: string;
  universityId: string;
  name: string;
  code: string;
  slug: string;
  logoUrl?: string;
  domain?: string;
  branding: {
    primaryColor: string;
    accentColor: string;
  };
  isActive: boolean;
}

export interface InstitutionDepartment {
  id: string;
  institutionId: string;
  name: string;
  code: string;
  headOfDeptUserId?: string;
  facultyCount?: number;
  studentCount?: number;
}

export interface FacultyAllocation {
  id: string;
  userId: string;
  institutionId: string;
  departmentId: string;
  designation: string;
  workloadHours: number;
  subjects: string[];
}

export interface InstitutionalLibraryResource {
  id: string;
  institutionId: string;
  departmentId?: string;
  title: string;
  resourceType: "lab_manual" | "research_paper" | "lecture_note" | "question_bank" | "policy";
  fileUrl: string;
  fileSizeBytes: number;
  uploadedBy: string;
  isPublic: boolean;
  createdAt: string;
}

export interface AccreditationRecord {
  id: string;
  institutionId: string;
  bodyName: "NAAC" | "NBA" | "NIRF";
  academicYear: string;
  status: "draft" | "in_progress" | "submitted" | "accredited";
  grade?: string;
  evidenceCollectedScore: number;
  reportUrl?: string;
}

export interface SaasSubscription {
  id: string;
  institutionId: string;
  planTier: "Starter" | "Department Pro" | "Campus Enterprise";
  status: "active" | "trial" | "past_due" | "canceled";
  studentLimit: number;
  facultyLimit: number;
  priceInr: number;
  renewsAt: string;
}
