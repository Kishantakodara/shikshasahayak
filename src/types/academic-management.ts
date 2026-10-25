// ============================================================
// SHIKSHA SAHAYAK OS TYPES: ACADEMIC MANAGEMENT SUITE
// Types for Universities, Branches, Semesters, Subjects, and Years
// ============================================================

export type AcademicTabKey =
  | 'overview'
  | 'universities'
  | 'branches'
  | 'semesters'
  | 'subjects'
  | 'academic-years';

export interface AcademicKPIItem {
  total: number;
  active: number;
  inactive: number;
  draft?: number;
  withContent?: number;
  withoutContent?: number;
}

export interface HierarchyBranchNode {
  id: string;
  name: string;
  shortName: string;
  code?: string;
  subjectsCount: number;
}

export interface HierarchyUniversityNode {
  id: string;
  name: string;
  shortName: string;
  branches: HierarchyBranchNode[];
  totalSubjects: number;
}

export interface AcademicActivityItem {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  timestamp: string;
  category: 'University' | 'Branch' | 'Semester' | 'Subject' | 'Year' | 'Curriculum';
}

export interface AcademicOverviewStats {
  kpis: {
    universities: AcademicKPIItem;
    branches: AcademicKPIItem;
    semesters: AcademicKPIItem;
    subjects: AcademicKPIItem;
    academicYears: AcademicKPIItem;
    units: number;
    topics: number;
  };
  hierarchy: HierarchyUniversityNode[];
  recentActivities: AcademicActivityItem[];
}

export interface UniversityAdminItem {
  id: string;
  name: string;
  shortName: string;
  slug: string;
  country: string;
  state: string;
  type: string;
  status: 'Active' | 'Inactive' | 'Draft';
  isActive: boolean;
  totalBranches: number;
  totalSubjects: number;
  totalStudents: number;
  createdAt: string;
  updatedAt: string;
}

export interface BranchAdminItem {
  id: string;
  universityId: string;
  universityName: string;
  universityShort: string;
  name: string;
  slug: string;
  shortName: string;
  code: string;
  status: 'Active' | 'Inactive' | 'Draft';
  isActive: boolean;
  totalSemesters: number;
  totalSubjects: number;
  totalStudents: number;
  createdAt: string;
  updatedAt: string;
}

export interface SemesterAdminItem {
  id: string;
  semesterNumber: number;
  name: string;
  universityId: string;
  universityName: string;
  universityShort: string;
  branchId: string;
  branchName: string;
  branchShort: string;
  order: number;
  academicYear: string;
  subjectsCount: number;
  status: 'Active' | 'Inactive' | 'Draft';
  isActive: boolean;
  updatedAt: string;
}

export interface SubjectAdminItem {
  id: string;
  name: string;
  code: string;
  slug: string;
  semester: number;
  credits: number;
  status: 'Active' | 'Inactive' | 'Draft';
  isActive: boolean;
  branchId: string;
  branchName: string;
  branchShort: string;
  branchSlug: string;
  universityId: string;
  universityName: string;
  universityShort: string;
  academicYear: string;
  syllabusLink: string;
  materialsCount: number;
  pyqsCount: number;
  unitsCount: number;
  hasContent: boolean;
  contentCoverage: number; // 0 - 100%
  createdAt: string;
  updatedAt: string;
}

export interface AcademicYearAdminItem {
  id: string;
  year: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Upcoming' | 'Inactive' | 'Archived';
  isActive: boolean;
  description: string;
  universitiesCount: number;
  branchesCount: number;
  subjectsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicFilterState {
  university: string;
  branch: string;
  semester: string;
  academicYear: string;
  status: string;
  search: string;
}

export interface UnitCoverageItem {
  unitNumber: number;
  title: string;
  percentage: number;
  topicsCount: number;
  materialsCount: number;
}

export interface EntityChildImpact {
  affectedBranches?: number;
  affectedSemesters?: number;
  affectedSubjects?: number;
  affectedDocuments?: number;
}
