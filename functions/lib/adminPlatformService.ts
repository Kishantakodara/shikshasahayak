// ============================================================
// SHIKSHA SAHAYAK OS - ADMIN PLATFORM EDGE SERVICE
// ============================================================

import {
  AdminAuditLogSpec,
  PlatformMetricsSnapshotSpec,
  ManagedUserSpec,
} from "../../src/types/admin-platform";
import { Env } from "./contentEngine";

/**
 * Fetches latest platform metrics snapshot and current database counts.
 */
export async function getPlatformMetrics(env: Env): Promise<PlatformMetricsSnapshotSpec> {
  try {
    let totalResources = 0;
    let totalAssessments = 0;
    let totalStudents = 0;
    let totalTeachers = 0;
    let activeUsers = 0;

    // 1. Total Content / Study Materials & Documents
    try {
      const { results: matCount } = await env.DB.prepare(
        `SELECT COUNT(*) as count FROM documents`
      ).all<Record<string, unknown>>();
      totalResources = Number(matCount?.[0]?.count || 0);
    } catch {
      try {
        const { results: resCount } = await env.DB.prepare(
          `SELECT COUNT(*) as count FROM materials`
        ).all<Record<string, unknown>>();
        totalResources = Number(resCount?.[0]?.count || 0);
      } catch {
        totalResources = 0;
      }
    }

    // 2. Total Assessments / Quizzes
    try {
      const { results: quizCount } = await env.DB.prepare(
        `SELECT COUNT(*) as count FROM assessment_quizzes`
      ).all<Record<string, unknown>>();
      totalAssessments = Number(quizCount?.[0]?.count || 0);
    } catch {
      totalAssessments = 0;
    }

    // 3. Total Students / Unified Users
    try {
      const { results: userCount } = await env.DB.prepare(
        `SELECT COUNT(*) as count FROM unified_users WHERE user_type = 'student' OR user_type IS NULL`
      ).all<Record<string, unknown>>();
      totalStudents = Number(userCount?.[0]?.count || 0);
    } catch {
      try {
        const { results: profileCount } = await env.DB.prepare(
          `SELECT COUNT(*) as count FROM student_profiles`
        ).all<Record<string, unknown>>();
        totalStudents = Number(profileCount?.[0]?.count || 0);
      } catch {
        try {
          const db: D1Database = (env as any).ASSESSMENT_DB || env.DB;
          const { results: spCount } = await db.prepare(
            `SELECT COUNT(*) as count FROM student_profiles`
          ).all<Record<string, unknown>>();
          totalStudents = Number(spCount?.[0]?.count || 0);
        } catch {
          totalStudents = 0;
        }
      }
    }

    // 4. Total Teachers from teacher_whitelist
    try {
      const db: D1Database = (env as any).ASSESSMENT_DB || env.DB;
      const { results: teachCount } = await db.prepare(
        `SELECT COUNT(*) as count FROM teacher_whitelist`
      ).all<Record<string, unknown>>();
      totalTeachers = Number(teachCount?.[0]?.count || 0);
    } catch {
      totalTeachers = 0;
    }

    // 5. Active Users
    try {
      const { results: activeCount } = await env.DB.prepare(
        `SELECT COUNT(*) as count FROM unified_users`
      ).all<Record<string, unknown>>();
      activeUsers = Number(activeCount?.[0]?.count || 0);
    } catch {
      activeUsers = totalStudents;
    }

    return {
      id: "snap_live",
      snapshotDate: new Date().toISOString().split("T")[0],
      totalStudents,
      activeUsers,
      totalTeachers,
      totalResources,
      totalAssessments,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error in getPlatformMetrics:", error);
    return {
      id: "snap_fallback",
      snapshotDate: new Date().toISOString().split("T")[0],
      totalStudents: 0,
      activeUsers: 0,
      totalTeachers: 0,
      totalResources: 0,
      totalAssessments: 0,
      createdAt: new Date().toISOString(),
    };
  }
}

/**
 * Fetches audit log entries with optional action filter.
 */
export async function getAdminAuditLogs(
  env: Env,
  limit = 20
): Promise<AdminAuditLogSpec[]> {
  try {
    const { results } = await env.DB.prepare(
      `SELECT id, admin_id, action, resource_type, resource_id, details_json, ip_address, created_at
       FROM admin_audit_logs
       ORDER BY created_at DESC
       LIMIT ?`
    )
      .bind(limit)
      .all<Record<string, unknown>>();

    return (results || []).map((row) => ({
      id: String(row.id),
      adminId: String(row.admin_id),
      action: String(row.action),
      resourceType: String(row.resource_type),
      resourceId: row.resource_id ? String(row.resource_id) : null,
      details: row.details_json ? JSON.parse(String(row.details_json)) : null,
      ipAddress: String(row.ip_address),
      createdAt: String(row.created_at),
    }));
  } catch (error) {
    console.error("Error in getAdminAuditLogs:", error);
    return [];
  }
}

/**
 * Records an administrative audit log event.
 */
export async function recordAdminAuditLog(
  env: Env,
  adminId: string,
  action: string,
  resourceType: string,
  resourceId?: string,
  details?: Record<string, unknown>,
  ipAddress = "127.0.0.1"
): Promise<boolean> {
  try {
    const id = `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    await env.DB.prepare(
      `INSERT INTO admin_audit_logs (
        id, admin_id, action, resource_type, resource_id, details_json, ip_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        adminId,
        action,
        resourceType,
        resourceId || null,
        details ? JSON.stringify(details) : null,
        ipAddress
      )
      .run();

    return true;
  } catch (error) {
    console.error("Error in recordAdminAuditLog:", error);
    return false;
  }
}
