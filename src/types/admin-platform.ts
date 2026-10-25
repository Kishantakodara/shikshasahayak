// ============================================================
// SHIKSHA SAHAYAK OS - ADMIN PLATFORM TYPES
// ============================================================

export interface AdminAuditLogSpec {
  id: string;
  adminId: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  details?: Record<string, unknown> | null;
  ipAddress: string;
  createdAt: string;
}

export interface PlatformMetricsSnapshotSpec {
  id: string;
  snapshotDate: string;
  totalStudents: number;
  activeUsers: number;
  totalTeachers: number;
  totalResources: number;
  totalAssessments: number;
  createdAt: string;
}

export interface ManagedUserSpec {
  id: string;
  email: string;
  displayName: string;
  role: 'student' | 'teacher' | 'admin' | 'super_admin';
  status: 'active' | 'suspended' | 'pending';
  branchId?: string;
  semester?: number;
  createdAt: string;
}
