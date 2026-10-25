// ============================================================
// SHIKSHA SAHAYAK OS - STUDY MATERIAL PLATFORM TYPES
// ============================================================

export type AcademicResourceType =
  | 'notes'
  | 'pdf'
  | 'pyq'
  | 'syllabus'
  | 'assignment'
  | 'lab_manual'
  | 'reference'
  | 'important_qs'
  | 'practice';

export interface AcademicUnitSpec {
  id: string;
  subjectId: string;
  unitNumber: number;
  unitTitle: string;
  description?: string | null;
  topics?: AcademicTopicSpec[];
  createdAt: string;
}

export interface AcademicTopicSpec {
  id: string;
  unitId: string;
  topicName: string;
  description?: string | null;
  createdAt: string;
}

export interface StudyMaterialResourceSpec {
  id: string;
  title: string;
  description?: string | null;
  universityId: string;
  degreeId: string;
  branchId: string;
  semester: number;
  subjectId: string;
  unitId?: string | null;
  topicId?: string | null;
  resourceType: AcademicResourceType;
  fileUrl: string;
  fileSizeBytes: number;
  downloadCount: number;
  tags?: string[];
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}
