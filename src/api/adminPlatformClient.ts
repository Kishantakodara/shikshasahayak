// ============================================================
// SHIKSHA SAHAYAK OS - FRONTEND ADMIN PLATFORM CLIENT
// ============================================================

import {
  PlatformMetricsSnapshotSpec,
  AdminAuditLogSpec,
  ManagedUserSpec,
} from "../types/admin-platform";
import { fetchWithAuth } from "./client";

/**
 * Fetches platform health metrics and usage counts.
 */
export async function fetchPlatformMetrics(): Promise<PlatformMetricsSnapshotSpec | null> {
  try {
    const res = await fetchWithAuth("/api/admin/metrics");
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Error in AdminPlatformClient.fetchPlatformMetrics:", error);
    return null;
  }
}

/**
 * Fetches administrative audit log entries.
 */
export async function fetchAdminAuditLogs(limit = 20): Promise<AdminAuditLogSpec[]> {
  try {
    const res = await fetchWithAuth(`/api/admin/audit-logs?limit=${limit}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error in AdminPlatformClient.fetchAdminAuditLogs:", error);
    return [];
  }
}

/**
 * Records an administrative audit log event.
 */
export async function recordAdminAuditLog(
  adminId: string,
  action: string,
  resourceType: string,
  resourceId?: string,
  details?: Record<string, unknown>
): Promise<boolean> {
  try {
    const res = await fetchWithAuth("/api/admin/audit-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminId, action, resourceType, resourceId, details }),
    });
    return res.ok;
  } catch (error) {
    console.error("Error in AdminPlatformClient.recordAdminAuditLog:", error);
    return false;
  }
}

/**
 * Fetches managed user accounts for administration.
 */
export async function fetchManagedUsers(): Promise<ManagedUserSpec[]> {
  try {
    const res = await fetchWithAuth("/api/admin/users-manage");
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error in AdminPlatformClient.fetchManagedUsers:", error);
    return [];
  }
}

/**
 * Updates a user role or account status.
 */
export async function updateUserRoleOrStatus(
  adminId: string,
  targetUserId: string,
  newRole?: string,
  newStatus?: string
): Promise<boolean> {
  try {
    const res = await fetchWithAuth("/api/admin/users-manage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminId, targetUserId, newRole, newStatus }),
    });
    return res.ok;
  } catch (error) {
    console.error("Error in AdminPlatformClient.updateUserRoleOrStatus:", error);
    return false;
  }
}

export const adminPlatformClient = {
  fetchPlatformMetrics,
  fetchAdminAuditLogs,
  recordAdminAuditLog,
  fetchManagedUsers,
  updateUserRoleOrStatus,
};

export default adminPlatformClient;

