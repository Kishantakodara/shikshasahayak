// ============================================================
// SHIKSHA SAHAYAK OS - TEACHER PORTAL TYPES
// ============================================================

export interface TeacherSubjectAssignmentSpec {
  id: string;
  teacherId: string;
  subjectId: string;
  branchId: string;
  semester: number;
  className: string;
  createdAt: string;
}

export interface TeacherAnnouncementSpec {
  id: string;
  teacherId: string;
  subjectId: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface TeacherPublishMaterialPayload {
  teacherId: string;
  subjectId: string;
  branchId: string;
  semester: number;
  unitId?: string;
  title: string;
  description?: string;
  resourceType: string;
  fileUrl: string;
  fileSizeBytes: number;
}
