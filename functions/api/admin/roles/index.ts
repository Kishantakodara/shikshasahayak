// ============================================================
// SHIKSHA SAHAYAK OS API: /api/admin/roles
// RBAC Roles & Permissions Management, Custom Roles & User Assignments
// SECURITY: Requires Admin Authorization
// ============================================================

import { jsonResponse, errorResponse } from "../../../lib/json";
import { getAuthenticatedUser, isAdmin } from "../../../lib/auth";
import { recordAdminAuditLog } from "../../../lib/adminPlatformService";
import { Env } from "../../../lib/contentEngine";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

// Canonical Permission Master Definitions
export const MASTER_PERMISSIONS = [
  {
    category: "Platform Administration",
    permissions: [
      { key: "admin:control_center", label: "Admin Control Center Access", description: "Access the core administrative interface and dashboard metrics." },
      { key: "admin:feature_flags", label: "Feature Flag Toggles & Kill-Switches", description: "Toggle runtime platform feature flags and global killswitches." },
      { key: "admin:system_health", label: "System Health & Edge Inspection", description: "View edge server performance, memory, and database status." },
      { key: "admin:audit_logs", label: "Audit & Access Log Inspection", description: "Inspect full administrative audit logs and security traces." },
    ],
  },
  {
    category: "User & Access Governance",
    permissions: [
      { key: "users:view", label: "View User Roster & Profiles", description: "Browse registered students, teachers, and administrative accounts." },
      { key: "users:manage", label: "Manage User Roles & Account Status", description: "Promote, demote, suspend, or reactivate user accounts." },
      { key: "whitelist:teachers", label: "Teacher Whitelist Mutation", description: "Add, edit, approve, or revoke faculty members from whitelist." },
      { key: "whitelist:beta", label: "Beta User Whitelist & Flags", description: "Enroll testers and toggle experimental 2.0 AI feature flags." },
      { key: "roles:custom_rbac", label: "Create & Edit Custom Roles", description: "Define custom RBAC roles and granular permission sets." },
    ],
  },
  {
    category: "Curriculum & Academic CMS",
    permissions: [
      { key: "curriculum:view", label: "View Academic Structure", description: "Browse universities, branches, semesters, and subjects." },
      { key: "curriculum:edit", label: "Modify Universities & Subjects", description: "Create or edit syllabus versions, subject codes, and schemes." },
      { key: "curriculum:bulk_import", label: "Bulk CSV/Excel Importer", description: "Bulk import academic catalogs and curriculum structures." },
    ],
  },
  {
    category: "Content Factory & Publishing",
    permissions: [
      { key: "content:generate", label: "AI Content Factory Generation", description: "Trigger AI batch generation for notes, study guides, and PYQ solutions." },
      { key: "content:review", label: "Review & Quality Validation", description: "Validate AI generated content against academic quality thresholds." },
      { key: "content:publish", label: "Publish to Live Student Portal", description: "Promote approved study materials and solutions to live status." },
      { key: "content:delete", label: "Delete & Archive Documents", description: "Permanently delete or archive study materials and past papers." },
    ],
  },
  {
    category: "Teacher LMS & Faculty Tools",
    permissions: [
      { key: "teacher:portal", label: "Access Faculty LMS Dashboard", description: "Manage classes, student rosters, and batch assignments." },
      { key: "teacher:assignments", label: "Create & Grade Assignments", description: "Author quizzes, assignments, and grade student submissions." },
      { key: "teacher:upload", label: "Upload Faculty Lecture Notes", description: "Publish classroom materials directly to enrolled students." },
      { key: "teacher:attendance", label: "Mark & Export Attendance", description: "Track daily classroom attendance and export logs." },
    ],
  },
  {
    category: "2.0 AI Beta & Early Access",
    permissions: [
      { key: "beta:ai_copilot", label: "AI Study Copilot & Explanations", description: "Access real-time conversational AI tutor and question solver." },
      { key: "beta:quiz_2_0", label: "Interactive Practice Zone 2.0", description: "Practice adaptive GTU questions with instant AI feedback." },
      { key: "beta:code_playground", label: "Interactive Code Sandbox", description: "Run and test code snippets directly in the web browser." },
      { key: "beta:career_ats", label: "Resume Builder & ATS Scanner", description: "Generate ATS-optimized resumes and skill gap analyses." },
    ],
  },
  {
    category: "Student Public Features",
    permissions: [
      { key: "student:browse", label: "Browse Study Materials & PYQs", description: "Search and read verified GTU study notes and past exam papers." },
      { key: "student:download", label: "Download PDFs & Syllabus", description: "Download offline-ready study materials and exam solutions." },
      { key: "student:contribute", label: "Submit Notes for Review", description: "Upload study materials for community verification and reward points." },
    ],
  },
];

const DEFAULT_SYSTEM_ROLES = [
  {
    id: "role_super_admin",
    roleKey: "super_admin",
    roleName: "Super Administrator",
    badgeColor: "bg-red-500/15 text-red-400 border-red-500/30",
    description: "Full unrestricted governance across all database tables, users, feature flags, content factory, and edge settings.",
    iconName: "Shield",
    isSystem: true,
    permissions: ["*"],
  },
  {
    id: "role_admin",
    roleKey: "admin",
    roleName: "Platform Administrator",
    badgeColor: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    description: "Full management of academic catalogs, CMS documents, teacher whitelists, and platform settings.",
    iconName: "ShieldCheck",
    isSystem: true,
    permissions: [
      "admin:control_center",
      "admin:feature_flags",
      "admin:system_health",
      "admin:audit_logs",
      "users:view",
      "users:manage",
      "whitelist:teachers",
      "whitelist:beta",
      "roles:custom_rbac",
      "curriculum:view",
      "curriculum:edit",
      "curriculum:bulk_import",
      "content:generate",
      "content:review",
      "content:publish",
      "content:delete",
    ],
  },
  {
    id: "role_teacher",
    roleKey: "teacher",
    roleName: "Faculty / Verified Educator",
    badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    description: "Whitelisted educators managing classroom batches, assignments, student attendance, quizzes, and study material uploads.",
    iconName: "GraduationCap",
    isSystem: true,
    permissions: [
      "teacher:portal",
      "teacher:assignments",
      "teacher:upload",
      "teacher:attendance",
      "student:browse",
      "student:download",
    ],
  },
  {
    id: "role_beta_tester",
    roleKey: "beta_tester",
    roleName: "2.0 Beta Tester Student",
    badgeColor: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    description: "Enrolled students with early access privileges to experimental AI Copilot, interactive quiz 2.0, and career mentor tools.",
    iconName: "Sparkles",
    isSystem: true,
    permissions: [
      "student:browse",
      "student:download",
      "student:contribute",
      "beta:ai_copilot",
      "beta:quiz_2_0",
      "beta:code_playground",
      "beta:career_ats",
    ],
  },
  {
    id: "role_student",
    roleKey: "student",
    roleName: "Standard Student",
    badgeColor: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    description: "Regular student accounts browsing GTU previous year papers, syllabus, verified notes, and academic updates.",
    iconName: "Users",
    isSystem: true,
    permissions: [
      "student:browse",
      "student:download",
      "student:contribute",
    ],
  },
  {
    id: "role_moderator",
    roleKey: "moderator",
    roleName: "Content Moderator",
    badgeColor: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    description: "Content review and approval for study material submissions, PYQs, and student-contributed resources.",
    iconName: "CheckCircle2",
    isSystem: false,
    permissions: [
      "content:review",
      "content:publish",
      "curriculum:view",
      "student:browse",
      "student:download",
    ],
  },
];

/**
 * GET /api/admin/roles
 * Fetches all roles, custom roles, permission definitions, and user counts
 */
export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;

  const user = await getAuthenticatedUser(request, env);
  if (!user) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(user.email, user.role) && user.role !== "admin") {
    return errorResponse("Forbidden: Admin access required", 403);
  }

  try {
    // Ensure table exists
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS custom_roles (
        id TEXT PRIMARY KEY,
        role_key TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        badge_color TEXT DEFAULT 'bg-blue-500/15 text-blue-400 border-blue-500/30',
        icon_name TEXT DEFAULT 'Shield',
        is_system INTEGER NOT NULL DEFAULT 0,
        permissions_json TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Query custom roles from database
    const { results } = await env.DB.prepare(
      `SELECT id, role_key, name, description, badge_color, icon_name, is_system, permissions_json, created_at, updated_at
       FROM custom_roles
       ORDER BY is_system DESC, created_at ASC`
    ).all<Record<string, unknown>>();

    let roles = (results || []).map((row) => {
      let perms: string[] = [];
      try {
        perms = JSON.parse(String(row.permissions_json || "[]"));
      } catch {
        perms = [];
      }
      return {
        id: String(row.id),
        roleKey: String(row.role_key),
        roleName: String(row.name),
        badgeColor: String(row.badge_color || "bg-blue-500/15 text-blue-400 border-blue-500/30"),
        description: String(row.description || ""),
        iconName: String(row.icon_name || "Shield"),
        isSystem: Number(row.is_system) === 1,
        permissions: perms,
        createdAt: String(row.created_at || ""),
        updatedAt: String(row.updated_at || ""),
      };
    });

    // If custom_roles table is empty, seed defaults
    if (roles.length === 0) {
      for (const defRole of DEFAULT_SYSTEM_ROLES) {
        await env.DB.prepare(`
          INSERT INTO custom_roles (id, role_key, name, description, badge_color, icon_name, is_system, permissions_json, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT(role_key) DO NOTHING
        `).bind(
          defRole.id, defRole.roleKey, defRole.roleName, defRole.description,
          defRole.badgeColor, defRole.iconName, defRole.isSystem ? 1 : 0,
          JSON.stringify(defRole.permissions)
        ).run();
      }
      roles = DEFAULT_SYSTEM_ROLES as any;
    }

    // Fetch user counts for each role from unified_users
    const countsResult = await env.DB.prepare(
      `SELECT user_type AS role, COUNT(*) as count FROM unified_users GROUP BY user_type`
    ).all<Record<string, unknown>>();

    const countMap: Record<string, number> = {};
    (countsResult.results || []).forEach((row) => {
      countMap[String(row.role)] = Number(row.count || 0);
    });

    // Also count beta testers for beta_tester role
    const betaCount = (await env.DB.prepare(`SELECT COUNT(*) as count FROM unified_users WHERE ai_beta_enabled = 1`).first<{ count: number }>())?.count || 0;
    countMap["beta_tester"] = betaCount;

    const rolesWithCounts = roles.map((r) => ({
      ...r,
      usersCount: countMap[r.roleKey] || 0,
    }));

    return jsonResponse(
      {
        success: true,
        roles: rolesWithCounts,
        masterPermissions: MASTER_PERMISSIONS,
      },
      { headers: corsHeaders }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch roles";
    return errorResponse(message, 500);
  }
}

/**
 * POST /api/admin/roles
 * Creates or updates a role definition
 */
export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  const admin = await getAuthenticatedUser(request, env);
  if (!admin) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(admin.email, admin.role) && admin.role !== "admin") {
    return errorResponse("Forbidden: Admin access required", 403);
  }

  try {
    const body = (await request.json()) as any;
    const { action, roleKey, roleName, description, badgeColor, iconName, permissions, targetUserId, newRole } = body;

    // Action: Assign user role
    if (action === "assign_user_role" || (targetUserId && newRole)) {
      const uId = targetUserId;
      const r = newRole;

      await env.DB.prepare(`
        UPDATE unified_users
        SET user_type = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? OR uid = ? OR LOWER(email) = LOWER(?)
      `).bind(r, uId, uId, uId).run();

      await recordAdminAuditLog(
        env,
        admin.uid,
        "ROLE_ASSIGNMENT",
        "unified_users",
        uId,
        { targetUserId: uId, assignedRole: r, actorEmail: admin.email }
      );

      return jsonResponse(
        {
          success: true,
          message: `User ${uId} assigned role ${r}.`,
        },
        { headers: corsHeaders }
      );
    }

    // Action: Create or Update role definition
    const key = (roleKey || roleName?.toLowerCase().replace(/[^a-z0-9]/g, "_"))?.trim();
    if (!key || !roleName) {
      return errorResponse("Role key and role name are required", 400);
    }

    const id = body.id || `role_${key}`;
    const permsJson = JSON.stringify(permissions || []);
    const isSystem = body.isSystem ? 1 : 0;

    await env.DB.prepare(`
      INSERT INTO custom_roles (id, role_key, name, description, badge_color, icon_name, is_system, permissions_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(role_key) DO UPDATE SET
        name = excluded.name,
        description = excluded.description,
        badge_color = excluded.badge_color,
        icon_name = excluded.icon_name,
        permissions_json = excluded.permissions_json,
        updated_at = CURRENT_TIMESTAMP
    `)
      .bind(
        id,
        key,
        roleName,
        description || "",
        badgeColor || "bg-blue-500/15 text-blue-400 border-blue-500/30",
        iconName || "Shield",
        isSystem,
        permsJson
      )
      .run();

    await recordAdminAuditLog(
      env,
      admin.uid,
      "ROLE_DEFINITION_MUTATION",
      "custom_roles",
      key,
      { roleKey: key, roleName, permissionsCount: (permissions || []).length, actorEmail: admin.email }
    );

    return jsonResponse(
      {
        success: true,
        message: `Role ${roleName} (${key}) saved successfully.`,
        role: { id, roleKey: key, roleName, description, permissions },
      },
      { headers: corsHeaders }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save role";
    return errorResponse(message, 500);
  }
}

/**
 * DELETE /api/admin/roles
 * Deletes a custom role (prevents deleting system roles)
 */
export async function onRequestDelete(context: { request: Request; env: Env }) {
  const { request, env } = context;

  const admin = await getAuthenticatedUser(request, env);
  if (!admin) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(admin.email, admin.role) && admin.role !== "admin") {
    return errorResponse("Forbidden: Admin access required", 403);
  }

  try {
    const url = new URL(request.url);
    const roleKey = url.searchParams.get("roleKey");

    if (!roleKey) {
      return errorResponse("roleKey is required", 400);
    }

    // Verify it's not a system role
    const existing = await env.DB.prepare(`SELECT is_system FROM custom_roles WHERE role_key = ?`)
      .bind(roleKey)
      .first<{ is_system: number }>();

    if (existing && existing.is_system === 1) {
      return errorResponse("System roles cannot be deleted", 400);
    }

    await env.DB.prepare(`DELETE FROM custom_roles WHERE role_key = ?`).bind(roleKey).run();

    await recordAdminAuditLog(
      env,
      admin.uid,
      "ROLE_DELETE",
      "custom_roles",
      roleKey,
      { deletedRoleKey: roleKey, actorEmail: admin.email }
    );

    return jsonResponse(
      {
        success: true,
        message: `Custom role ${roleKey} deleted successfully.`,
      },
      { headers: corsHeaders }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete role";
    return errorResponse(message, 500);
  }
}
