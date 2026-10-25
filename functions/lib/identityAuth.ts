// ============================================================
// SHIKSHA SAHAYAK OS - IDENTITY & AUTHENTICATION EDGE SERVICE
// ============================================================

import {
  UnifiedUserSpec,
  AcademicProfileSpec,
  PermissionKey,
  SessionTrackSpec,
  UserType,
} from "../../src/types/identity-auth";
import { Env } from "./contentEngine";

/**
 * Hydrates full user profile, academic context, and permissions.
 */
export async function getUnifiedUserProfile(
  env: Env,
  userId: string
): Promise<UnifiedUserSpec | null> {
  try {
    const userRow = await env.DB.prepare(
      `SELECT id, uid, email, display_name, user_type, status, created_at, updated_at
       FROM unified_users
       WHERE id = ? OR uid = ? OR email = ?
       LIMIT 1`
    )
      .bind(userId, userId, userId)
      .first<Record<string, unknown>>();

    if (!userRow) return null;

    const acadRow = await env.DB.prepare(
      `SELECT user_id, university_id, college_name, degree_id, branch_id, semester_id, enrollment_year, graduation_year
       FROM academic_profiles
       WHERE user_id = ?`
    )
      .bind(userRow.id)
      .first<Record<string, unknown>>();

    const permissions = await getUserRolesAndPermissions(env, String(userRow.user_type));

    const academicProfile: AcademicProfileSpec | null = acadRow
      ? {
          userId: String(acadRow.user_id),
          universityId: acadRow.university_id ? String(acadRow.university_id) : null,
          collegeName: acadRow.college_name ? String(acadRow.college_name) : null,
          degreeId: acadRow.degree_id ? String(acadRow.degree_id) : null,
          branchId: acadRow.branch_id ? String(acadRow.branch_id) : null,
          semesterId: acadRow.semester_id ? String(acadRow.semester_id) : null,
          enrollmentYear: acadRow.enrollment_year ? Number(acadRow.enrollment_year) : null,
          graduationYear: acadRow.graduation_year ? Number(acadRow.graduation_year) : null,
        }
      : null;

    return {
      id: String(userRow.id),
      uid: String(userRow.uid),
      email: String(userRow.email),
      displayName: userRow.display_name ? String(userRow.display_name) : null,
      userType: (String(userRow.user_type || 'student').toLowerCase().trim() === 'super_admin' ? 'admin' : (String(userRow.user_type || 'student').toLowerCase().trim() === 'educator' ? 'teacher' : String(userRow.user_type || 'student').toLowerCase().trim())) as UserType,
      status: String(userRow.status) as any,
      createdAt: String(userRow.created_at),
      updatedAt: String(userRow.updated_at),
      academicProfile,
      permissions,
    };
  } catch (error) {
    console.error("Error in getUnifiedUserProfile:", error);
    return null;
  }
}

/**
 * Resolves RBAC permissions for a given user role.
 */
export async function getUserRolesAndPermissions(
  env: Env,
  userType: string
): Promise<PermissionKey[]> {
  try {
    const { results } = await env.DB.prepare(
      `SELECT permission_key FROM roles_and_permissions WHERE role_key = ?`
    )
      .bind(userType)
      .all<Record<string, unknown>>();

    return (results || []).map((r) => String(r.permission_key) as PermissionKey);
  } catch (error) {
    console.error("Error in getUserRolesAndPermissions:", error);
    return ["content:view"];
  }
}

/**
 * Fetches active sessions for a user.
 */
export async function getActiveSessions(
  env: Env,
  userId: string
): Promise<SessionTrackSpec[]> {
  try {
    const { results } = await env.DB.prepare(
      `SELECT id, user_id, device_info, ip_address, last_active_at, expires_at
       FROM user_active_sessions
       WHERE user_id = ?
       ORDER BY last_active_at DESC`
    )
      .bind(userId)
      .all<Record<string, unknown>>();

    return (results || []).map((row) => ({
      id: String(row.id),
      userId: String(row.user_id),
      deviceInfo: row.device_info ? String(row.device_info) : null,
      ipAddress: row.ip_address ? String(row.ip_address) : null,
      lastActiveAt: String(row.last_active_at),
      expiresAt: String(row.expires_at),
    }));
  } catch (error) {
    console.error("Error in getActiveSessions:", error);
    return [];
  }
}
