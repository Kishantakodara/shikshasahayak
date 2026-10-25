// ============================================================
// SHIKSHA SAHAYAK OS: USER MANAGEMENT API CLIENT
// Typed client methods for Users, Whitelists, Roles, Permissions, & Audit Logs
// ============================================================

import { fetchWithAuth } from './client';
import {
  AdminUserItem,
  TeacherWhitelistItem,
  BetaUserItem,
  RoleDefinition,
  PermissionCategory,
  AuditLogEntry,
  UserManagementFilterState,
  UserManagementStats,
} from '../types/user-management';
import {
  fetchFirestoreBetaWhitelist,
  ensureInitialBetaWhitelist,
  addBetaUserToFirestore,
  updateBetaUserInFirestore,
  deleteBetaUserFromFirestore,
  fetchFirestoreTeacherWhitelist,
  ensureInitialTeacherWhitelist,
  addTeacherToFirestore,
  updateTeacherInFirestore,
  deleteTeacherFromFirestore,
} from '../utils/firestoreWhitelistService';

export const userManagementClient = {
  // ─── 1. Users API ──────────────────────────────────────────
  async getUsers(filters?: Partial<UserManagementFilterState>): Promise<{
    users: AdminUserItem[];
    total: number;
    stats?: Partial<UserManagementStats>;
  }> {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.role && filters.role !== 'all') params.set('role', filters.role);
    if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
    if (filters?.betaOnly) params.set('betaOnly', 'true');
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.page && filters?.limit) params.set('offset', String((filters.page - 1) * filters.limit));

    const res = await fetchWithAuth(`/api/admin/users?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch users: ${res.statusText}`);
    }
    const data = await res.json();
    return {
      users: data.users || [],
      total: data.total || (data.users || []).length,
      stats: data.stats,
    };
  },

  async createUser(userData: Partial<AdminUserItem>): Promise<{ success: boolean; user: any; message?: string }> {
    const res = await fetchWithAuth('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to create user');
    }
    return data;
  },

  async updateUser(userData: Partial<AdminUserItem>): Promise<{ success: boolean; message?: string }> {
    const res = await fetchWithAuth('/api/admin/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to update user');
    }
    return data;
  },

  async deleteUser(userId: string): Promise<{ success: boolean; message?: string }> {
    const res = await fetchWithAuth(`/api/admin/users?userId=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to delete user');
    }
    return data;
  },

  // ─── 2. Teacher Whitelist API ──────────────────────────────
  async getTeachers(filters?: { search?: string; status?: string; department?: string }): Promise<{
    teachers: TeacherWhitelistItem[];
    total: number;
  }> {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
    if (filters?.department && filters.department !== 'all') params.set('department', filters.department);

    let d1Teachers: TeacherWhitelistItem[] = [];
    try {
      const res = await fetchWithAuth(`/api/admin/teacher-whitelist?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        d1Teachers = data.teachers || [];
      }
    } catch (err) {
      console.warn('D1 teacher fetch warning:', err);
    }

    // Fetch Firestore teacher_whitelist collection (ensuring initial default teachers if empty)
    const fsTeachers = await ensureInitialTeacherWhitelist().catch(() => []);

    // Merge and deduplicate by lowercased email
    const teacherMap = new Map<string, TeacherWhitelistItem>();

    for (const fsT of fsTeachers) {
      const lower = fsT.email.toLowerCase();
      teacherMap.set(lower, {
        id: fsT.id || `tw_${Date.now()}`,
        email: fsT.email,
        name: fsT.name,
        department: fsT.department || 'General',
        college: fsT.college || 'GTU Affiliated',
        status: fsT.status as any,
        addedBy: (fsT as any).added_by || 'Admin',
        createdAt: fsT.created_at || new Date().toISOString(),
        updatedAt: fsT.updated_at || new Date().toISOString(),
      });
    }

    for (const d1T of d1Teachers) {
      const lower = d1T.email.toLowerCase();
      teacherMap.set(lower, d1T);
    }

    const merged = Array.from(teacherMap.values());
    return {
      teachers: merged,
      total: merged.length,
    };
  },

  async addTeacher(teacherData: Partial<TeacherWhitelistItem>): Promise<{ success: boolean; email?: string; message?: string }> {
    const res = await fetchWithAuth('/api/admin/teacher-whitelist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teacherData),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to add teacher');
    }

    // Direct Firestore Sync (teacher_whitelist collection)
    if (teacherData.email) {
      await addTeacherToFirestore({
        email: teacherData.email,
        name: teacherData.name || teacherData.email.split('@')[0],
        department: teacherData.department,
        college: teacherData.college,
        status: (teacherData.status as any) || 'approved',
        added_by: teacherData.addedBy || 'Admin',
      }).catch((err) => console.error('Firestore teacher sync error:', err));
    }

    return data;
  },

  async bulkAddTeachers(teachers: Partial<TeacherWhitelistItem>[]): Promise<{ success: boolean; addedCount: number; message?: string }> {
    const res = await fetchWithAuth('/api/admin/teacher-whitelist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teachers }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to bulk add teachers');
    }

    // Direct Firestore Sync for bulk teachers
    for (const t of teachers) {
      if (t.email) {
        await addTeacherToFirestore({
          email: t.email,
          name: t.name || t.email.split('@')[0],
          department: t.department,
          college: t.college,
          status: (t.status as any) || 'approved',
        }).catch((err) => console.error('Firestore bulk teacher sync error:', err));
      }
    }

    return data;
  },

  async updateTeacher(teacherData: Partial<TeacherWhitelistItem>): Promise<{ success: boolean; message?: string }> {
    const res = await fetchWithAuth('/api/admin/teacher-whitelist', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teacherData),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to update teacher');
    }

    // Direct Firestore Sync (teacher_whitelist collection)
    if (teacherData.email) {
      await updateTeacherInFirestore(teacherData.email, {
        name: teacherData.name,
        department: teacherData.department,
        college: teacherData.college,
        status: teacherData.status as any,
        approved: teacherData.status === 'approved',
      }).catch((err) => console.error('Firestore update teacher sync error:', err));
    }

    return data;
  },

  async deleteTeacher(email: string): Promise<{ success: boolean; message?: string }> {
    const res = await fetchWithAuth(`/api/admin/teacher-whitelist?email=${encodeURIComponent(email)}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to remove teacher');
    }

    // Direct Firestore Sync (delete from Firestore teacher_whitelist)
    await deleteTeacherFromFirestore(email).catch((err) => console.error('Firestore delete teacher sync error:', err));

    return data;
  },

  // ─── 3. Beta Whitelist API ─────────────────────────────────
  async getBetaUsers(): Promise<{
    users: BetaUserItem[];
    featureFlags: any[];
    betaStats: any;
  }> {
    let d1Users: BetaUserItem[] = [];
    let featureFlags: any[] = [];
    let betaStats: any = {};

    try {
      const res = await fetchWithAuth('/api/v1/admin/beta');
      if (res.ok) {
        const data = await res.json();
        d1Users = data.users || [];
        featureFlags = data.featureFlags || [];
        betaStats = data.betaStats || {};
      }
    } catch (err) {
      console.warn('D1 beta fetch warning:', err);
    }

    // Fetch Firestore beta_whitelist collection (ensuring initial default beta users if empty)
    const fsBeta = await ensureInitialBetaWhitelist().catch(() => []);

    const userMap = new Map<string, BetaUserItem>();

    for (const fsItem of fsBeta) {
      const lower = fsItem.email.toLowerCase();
      userMap.set(lower, {
        id: fsItem.email,
        uid: fsItem.email,
        email: fsItem.email,
        displayName: fsItem.email.split('@')[0],
        isBetaTester: fsItem.approved,
        notes: fsItem.notes || 'Firestore Beta Whitelist',
        grantedBy: (fsItem as any).added_by || 'Admin',
        grantedAt: fsItem.created_at || new Date().toISOString(),
      });
    }

    for (const d1Item of d1Users) {
      const lower = (d1Item.email || (d1Item as any).user_id || d1Item.id || '').toLowerCase();
      if (lower) {
        userMap.set(lower, {
          id: d1Item.id || (d1Item as any).user_id || d1Item.email,
          uid: d1Item.uid || (d1Item as any).user_id,
          email: d1Item.email,
          displayName: d1Item.displayName || (d1Item as any).display_name,
          userType: d1Item.userType || (d1Item as any).user_type,
          isBetaTester: d1Item.isBetaTester ?? (d1Item as any).is_beta_tester ?? false,
          grantedAt: d1Item.grantedAt || (d1Item as any).granted_at,
          grantedBy: d1Item.grantedBy || (d1Item as any).granted_by,
          notes: d1Item.notes,
        });
      }
    }

    const mergedUsers = Array.from(userMap.values());
    return {
      users: mergedUsers,
      featureFlags,
      betaStats: {
        totalBetaUsers: mergedUsers.filter((u) => u.isBetaTester).length,
        activeThisWeek: betaStats.activeThisWeek || 0,
        pendingRequests: betaStats.pendingRequests || 0,
      },
    };
  },

  async toggleBetaUser(
    userId: string,
    enabled: boolean,
    customFlags?: Record<string, boolean>,
    notes?: string
  ): Promise<{ success: boolean; is_beta_tester: boolean; granted_by?: string }> {
    const res = await fetchWithAuth('/api/v1/admin/beta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        enabled,
        customFlags,
        notes,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to toggle beta access');
    }

    // Direct Firestore Sync (beta_whitelist collection)
    if (enabled) {
      await addBetaUserToFirestore({
        email: userId,
        notes,
        status: 'approved',
        added_by: 'Admin',
      }).catch((err) => console.error('Firestore beta sync error:', err));
    } else {
      await deleteBetaUserFromFirestore(userId).catch((err) => console.error('Firestore beta delete sync error:', err));
    }

    return data;
  },

  async bulkToggleBeta(bulkUsers: string[], enabled: boolean): Promise<{ success: boolean; updatedCount: number }> {
    const res = await fetchWithAuth('/api/v1/admin/beta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'bulk_toggle_beta',
        bulkUsers,
        enabled,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to bulk update beta access');
    }

    // Direct Firestore Sync for bulk beta users
    for (const email of bulkUsers) {
      if (enabled) {
        await addBetaUserToFirestore({
          email,
          status: 'approved',
          added_by: 'Admin',
        }).catch((err) => console.error('Firestore bulk beta sync error:', err));
      } else {
        await deleteBetaUserFromFirestore(email).catch((err) => console.error('Firestore bulk beta delete sync error:', err));
      }
    }

    return data;
  },

  async updateFeatureFlag(flagKey: string, enabled: boolean): Promise<{ success: boolean; flagKey: string; enabled: boolean }> {
    const res = await fetchWithAuth('/api/v1/admin/beta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_feature_flag',
        flagKey,
        enabled,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to update feature flag');
    }
    return data;
  },

  // ─── 4. Roles & Permissions API ────────────────────────────
  async getRoles(): Promise<{
    roles: RoleDefinition[];
    masterPermissions: PermissionCategory[];
  }> {
    const res = await fetchWithAuth('/api/admin/roles');
    if (!res.ok) {
      throw new Error(`Failed to fetch roles: ${res.statusText}`);
    }
    const data = await res.json();
    return {
      roles: data.roles || [],
      masterPermissions: data.masterPermissions || [],
    };
  },

  async saveRole(roleData: Partial<RoleDefinition>): Promise<{ success: boolean; message?: string }> {
    const res = await fetchWithAuth('/api/admin/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roleData),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to save role');
    }
    return data;
  },

  async deleteRole(roleKey: string): Promise<{ success: boolean; message?: string }> {
    const res = await fetchWithAuth(`/api/admin/roles?roleKey=${encodeURIComponent(roleKey)}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to delete role');
    }
    return data;
  },

  async assignUserRole(targetUserId: string, newRole: string): Promise<{ success: boolean; message?: string }> {
    const res = await fetchWithAuth('/api/admin/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'assign_user_role',
        targetUserId,
        newRole,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to assign role');
    }
    return data;
  },

  // ─── 5. Access Logs API ────────────────────────────────────
  async getAuditLogs(filters?: {
    search?: string;
    action?: string;
    resourceType?: string;
    dateRange?: string;
    limit?: number;
    page?: number;
  }): Promise<{
    logs: AuditLogEntry[];
    total: number;
    todayCount?: number;
  }> {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.action && filters.action !== 'all') params.set('action', filters.action);
    if (filters?.resourceType && filters.resourceType !== 'all') params.set('resourceType', filters.resourceType);
    if (filters?.dateRange && filters.dateRange !== 'all') params.set('dateRange', filters.dateRange);
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.page && filters?.limit) params.set('offset', String((filters.page - 1) * filters.limit));

    const res = await fetchWithAuth(`/api/admin/audit-logs?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch audit logs: ${res.statusText}`);
    }
    const data = await res.json();
    return {
      logs: data.logs || [],
      total: data.total || (data.logs || []).length,
      todayCount: data.todayCount,
    };
  },
};
