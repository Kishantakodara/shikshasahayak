// ============================================================
// SHIKSHA SAHAYAK OS TYPES: Multi-University Platform (Sprint 17)
// ============================================================

export interface UniversityProfile {
  id: string;
  name: string;
  shortName: string;
  slug: string;
  country: string;
  state: string;
  isActive: boolean;
  gradingSystem: {
    scale: number;
    type: string;
  };
  passingCriteria: {
    minSubjectMarks: number;
    minAggregate: number;
  };
  academicCalendar: {
    oddSemStart: string;
    evenSemStart: string;
  };
}

export interface AcademicFaculty {
  id: string;
  universityId: string;
  name: string;
  code?: string;
  slug: string;
}

export interface AcademicProgram {
  id: string;
  universityId: string;
  facultyId?: string;
  programType: string; // 'B.Tech' | 'B.E.' | 'Diploma' | 'M.Tech' | 'MBA' | 'BCA' | 'MCA'
  name: string;
  slug: string;
  durationYears: number;
  totalSemesters: number;
  isActive: boolean;
}

export interface SubjectEquivalenceMapping {
  id: string;
  sourceSubjectId: string;
  targetSubjectId: string;
  equivalenceScore: number;
  mappingNotes?: string;
  createdBy?: string;
  createdAt: string;
}

export interface ContentGovernanceLog {
  id: string;
  resourceId: string;
  action: string;
  previousState?: string;
  newState: "draft" | "review" | "approved" | "published" | "archived";
  actorId: string;
  comments?: string;
  createdAt: string;
}

export interface AcademicContextScope {
  universityId: string;
  universityName: string;
  programId?: string;
  programName?: string;
  branchId: string;
  branchName: string;
  semester: number;
  curriculumVersionName?: string;
}
