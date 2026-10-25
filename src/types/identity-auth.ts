// ============================================================
// SHIKSHA SAHAYAK OS - IDENTITY, AUTHENTICATION & AUTHORIZATION TYPES
// ============================================================

/** Supported User Types */
export type UserType =
  | 'guest'
  | 'student'
  | 'teacher'
  | 'moderator'
  | 'admin'
  | 'super_admin'
  | 'parent'
  | 'alumni';

/** Permission Keys */
export type PermissionKey =
  | 'content:view'
  | 'content:bookmark'
  | 'content:create'
  | 'assessment:manage'
  | 'governance:review'
  | 'system:manage';

/** Academic Profile Context */
export interface AcademicProfileSpec {
  userId: string;
  universityId?: string | null;
  collegeName?: string | null;
  degreeId?: string | null;
  branchId?: string | null;
  semesterId?: string | null;
  enrollmentYear?: number | null;
  graduationYear?: number | null;
}

/** Unified User Entity Payload */
export interface UnifiedUserSpec {
  id: string;
  uid: string;
  email: string;
  displayName?: string | null;
  userType: UserType;
  status: 'active' | 'suspended' | 'deactivated';
  createdAt: string;
  updatedAt: string;
  academicProfile?: AcademicProfileSpec | null;
  permissions?: PermissionKey[];
}

/** Active Device Session Specification */
export interface SessionTrackSpec {
  id: string;
  userId: string;
  deviceInfo?: string | null;
  ipAddress?: string | null;
  lastActiveAt: string;
  expiresAt: string;
}

/** Security Audit Log Entry */
export interface AuthAuditLogEntry {
  id: string;
  userId?: string | null;
  eventType: 'login' | 'logout' | 'register' | 'password_change' | 'profile_update' | 'role_change' | 'security_alert';
  ipAddress?: string | null;
  details?: Record<string, unknown> | null;
  createdAt: string;
}
