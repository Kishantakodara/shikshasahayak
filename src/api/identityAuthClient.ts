// ============================================================
// SHIKSHA SAHAYAK OS - FRONTEND IDENTITY & AUTH API CLIENT
// ============================================================

import {
  UnifiedUserSpec,
  PermissionKey,
  SessionTrackSpec,
} from "../types/identity-auth";

/**
 * Fetches unified user profile and academic context.
 */
export async function fetchUnifiedUserProfile(
  userId = "guest_user"
): Promise<UnifiedUserSpec | null> {
  try {
    const res = await fetch(`/api/auth/profile?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Error in IdentityAuthClient.fetchUnifiedUserProfile:", error);
    return null;
  }
}

/**
 * Fetches active permissions for a user role.
 */
export async function fetchUserRolesAndPermissions(
  role = "student"
): Promise<PermissionKey[]> {
  try {
    const res = await fetch(`/api/auth/permissions?role=${encodeURIComponent(role)}`);
    if (!res.ok) return ["content:view"];
    const data = await res.json();
    return data.permissions || ["content:view"];
  } catch (error) {
    console.error("Error in IdentityAuthClient.fetchUserRolesAndPermissions:", error);
    return ["content:view"];
  }
}

/**
 * Fetches active device sessions for multi-device tracking.
 */
export async function fetchActiveUserSessions(
  userId = "guest_user"
): Promise<SessionTrackSpec[]> {
  try {
    const res = await fetch(`/api/auth/sessions?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error in IdentityAuthClient.fetchActiveUserSessions:", error);
    return [];
  }
}
