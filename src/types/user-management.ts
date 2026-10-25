// ============================================================
// SHIKSHA SAHAYAK OS: USER & ACCESS MANAGEMENT TYPE DEFINITIONS
// Canonical types for Users, Whitelists, Roles, Permissions, & Audit Logs
// ============================================================

export type UserTabKey =
  | 'users'
  | 'teacher-whitelist'
  | 'beta-whitelist'
  | 'roles-permissions'
  | 'audit-logs';

export type UserRole =
  | 'student'
  | 'teacher'
  | 'admin'
  | 'super_admin'
  | 'moderator'
  | 'guest'
  | string;

export type UserStatus = 'active' | 'suspended' | 'deactivated' | 'pending';

export type WhitelistStatus = 'approved' | 'pending' | 'suspended';

export interface AdminUserItem {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  isBetaTester: boolean;
  aiBetaEnabled?: boolean;
  avatarUrl?: string;
  university?: string;
  universityId?: string;
  branch?: string;
  branchId?: string;
  semester?: number | string;
  enrollmentNo?: string;
  collegeName?: string;
  createdAt: string;
  updatedAt?: string;
  lastActiveAt?: string;
  customFlags?: Record<string, boolean | string | number>;
}

export interface TeacherWhitelistItem {
  id?: string;
  email: string;
  name?: string;
  department?: string;
  college?: string;
  status: WhitelistStatus;
  notes?: string;
  addedBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BetaUserItem {
  id: string;
  uid?: string;
  email: string;
  displayName?: string;
  userType?: string;
  isBetaTester: boolean;
  grantedAt?: string;
  grantedBy?: string;
  notes?: string;
  lastActiveAt?: string;
  createdAt?: string;
  customFlags?: Record<string, boolean>;
}

export interface PermissionItem {
  id: string;
  key: string;
  label: string;
  description: string;
  category: string;
}

export interface PermissionCategory {
  id: string;
  title: string;
  category?: string;
  description: string;
  iconName?: string;
  permissions: PermissionItem[];
}

export interface RoleDefinition {
  id: string;
  roleKey: string;
  roleName: string;
  badgeColor: string;
  description: string;
  iconName: string;
  isSystem: boolean;
  usersCount?: number;
  permissions: string[]; // List of permission keys
  createdAt?: string;
  updatedAt?: string;
}

export interface AuditLogEntry {
  id: string;
  adminId: string;
  adminEmail?: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  details?: Record<string, any> | null;
  ipAddress?: string;
  createdAt: string;
}

export interface UserManagementFilterState {
  search: string;
  role: string;
  status: string;
  university: string;
  branch: string;
  betaOnly: boolean;
  dateRange: 'all' | 'today' | 'week' | 'month';
  page: number;
  limit: number;
}

export interface UserManagementKPICard {
  label: string;
  value: number | string;
  subtext?: string;
  trend?: string;
  color?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface UserManagementStats {
  totalUsers: number;
  activeStudents: number;
  verifiedTeachers: number;
  adminsCount: number;
  betaUsersCount: number;
  newThisMonth: number;
  whitelistedTeachersTotal: number;
  activeLmsTeachers: number;
  pendingTeacherApprovals: number;
  activeBetaTesters: number;
  totalAuditLogs: number;
  adminActionsToday: number;
}
