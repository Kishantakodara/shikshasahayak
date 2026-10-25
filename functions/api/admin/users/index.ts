// ============================================================
// SHIKSHA SAHAYAK OS API: /api/admin/users
// Comprehensive User Management CRUD, Role Mutation, Status & Search
// SECURITY: Requires Admin Authorization
// ============================================================

import { jsonResponse, errorResponse } from "../../../lib/json";
import { getAuthenticatedUser, isAdmin } from "../../../lib/auth";
import { recordAdminAuditLog } from "../../../lib/adminPlatformService";

interface Env {
  DB: D1Database;
  ASSESSMENT_DB?: D1Database;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

function getDbs(env: Env): D1Database[] {
  const list: D1Database[] = [];
  if (env.DB) list.push(env.DB);
  if (env.ASSESSMENT_DB && env.ASSESSMENT_DB !== env.DB) list.push(env.ASSESSMENT_DB);
  return list;
}

async function ensureTables(db: D1Database) {
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS unified_users (
        id TEXT PRIMARY KEY,
        uid TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        display_name TEXT,
        user_type TEXT NOT NULL DEFAULT 'student',
        status TEXT NOT NULL DEFAULT 'active',
        ai_beta_enabled INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS academic_profiles (
        user_id TEXT PRIMARY KEY,
        university_id TEXT,
        college_name TEXT,
        degree_id TEXT,
        branch_id TEXT,
        semester_id TEXT,
        enrollment_year INTEGER,
        graduation_year INTEGER,
        enrollment_number TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    try {
      await db.prepare(`ALTER TABLE academic_profiles ADD COLUMN enrollment_number TEXT`).run();
    } catch {}

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS user_beta_access (
        user_id TEXT PRIMARY KEY,
        is_beta_tester INTEGER NOT NULL DEFAULT 1,
        custom_flags_json TEXT,
        notes TEXT,
        granted_by TEXT,
        granted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_active_at TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS teacher_whitelist (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        name TEXT,
        department TEXT,
        college TEXT,
        status TEXT NOT NULL DEFAULT 'approved',
        notes TEXT,
        added_by TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    const twCols = await db.prepare(`PRAGMA table_info(teacher_whitelist)`).all<any>();
    const twColNames = new Set((twCols.results || []).map((c: any) => String(c.name).toLowerCase()));
    if (!twColNames.has("id")) await db.prepare(`ALTER TABLE teacher_whitelist ADD COLUMN id TEXT`).run().catch(() => null);
    if (!twColNames.has("name")) await db.prepare(`ALTER TABLE teacher_whitelist ADD COLUMN name TEXT`).run().catch(() => null);
    if (!twColNames.has("department")) await db.prepare(`ALTER TABLE teacher_whitelist ADD COLUMN department TEXT`).run().catch(() => null);
    if (!twColNames.has("college")) await db.prepare(`ALTER TABLE teacher_whitelist ADD COLUMN college TEXT`).run().catch(() => null);
    if (!twColNames.has("status")) await db.prepare(`ALTER TABLE teacher_whitelist ADD COLUMN status TEXT DEFAULT 'approved'`).run().catch(() => null);
    if (!twColNames.has("notes")) await db.prepare(`ALTER TABLE teacher_whitelist ADD COLUMN notes TEXT`).run().catch(() => null);
    if (!twColNames.has("added_by")) await db.prepare(`ALTER TABLE teacher_whitelist ADD COLUMN added_by TEXT`).run().catch(() => null);
    if (!twColNames.has("created_at")) await db.prepare(`ALTER TABLE teacher_whitelist ADD COLUMN created_at TEXT`).run().catch(() => null);
    if (!twColNames.has("updated_at")) await db.prepare(`ALTER TABLE teacher_whitelist ADD COLUMN updated_at TEXT`).run().catch(() => null);
  } catch {}
}

/**
 * GET /api/admin/users
 * Returns list of unified users with their academic profile and beta status
 */
export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;

  const user = await getAuthenticatedUser(request, env as any);
  if (!user) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(user.email, user.role) && user.role !== "admin") {
    return errorResponse("Forbidden: Admin access required", 403);
  }

  const dbs = getDbs(env);
  if (dbs.length === 0) {
    return errorResponse("Database not available", 500);
  }

  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.toLowerCase().trim() || "";
  const role = url.searchParams.get("role") || "all";
  const status = url.searchParams.get("status") || "all";
  const betaOnly = url.searchParams.get("betaOnly") === "true";
  const limit = Math.min(Number(url.searchParams.get("limit")) || 100, 500);

  try {
    for (const db of dbs) {
      await ensureTables(db);
    }

    let query = `
      SELECT 
        u.id,
        u.uid,
        u.email,
        u.display_name,
        u.user_type AS role,
        u.status,
        COALESCE(b.is_beta_tester, u.ai_beta_enabled, 0) AS is_beta_tester,
        b.custom_flags_json,
        b.last_active_at,
        ap.university_id,
        ap.branch_id,
        ap.semester_id,
        ap.enrollment_number,
        ap.college_name,
        u.created_at,
        u.updated_at
      FROM unified_users u
      LEFT JOIN academic_profiles ap ON u.id = ap.user_id OR u.uid = ap.user_id
      LEFT JOIN user_beta_access b ON u.id = b.user_id OR u.uid = b.user_id OR LOWER(u.email) = LOWER(b.user_id)
      WHERE 1=1
    `;

    const bindings: unknown[] = [];

    if (search) {
      query += ` AND (LOWER(u.email) LIKE ? OR LOWER(u.display_name) LIKE ? OR LOWER(u.uid) LIKE ? OR LOWER(COALESCE(ap.enrollment_number, '')) LIKE ?)`;
      const s = `%${search}%`;
      bindings.push(s, s, s, s);
    }

    if (role && role !== "all") {
      query += ` AND u.user_type = ?`;
      bindings.push(role);
    }

    if (status && status !== "all") {
      query += ` AND u.status = ?`;
      bindings.push(status);
    }

    if (betaOnly) {
      query += ` AND (b.is_beta_tester = 1 OR u.ai_beta_enabled = 1)`;
    }

    query += ` ORDER BY u.created_at DESC LIMIT ?`;
    bindings.push(limit);

    const userMap = new Map<string, any>();

    for (const db of dbs) {
      try {
        const { results } = await db.prepare(query).bind(...bindings).all<Record<string, unknown>>();
        for (const row of results || []) {
          const em = String(row.email || "").toLowerCase();
          const key = em || String(row.id || row.uid);
          if (key && !userMap.has(key)) {
            let customFlags = {};
            try {
              if (row.custom_flags_json) {
                customFlags = JSON.parse(String(row.custom_flags_json));
              }
            } catch {}

            userMap.set(key, {
              id: String(row.id || row.uid || ""),
              uid: String(row.uid || row.id || ""),
              email: em,
              displayName: String(row.display_name || em.split("@")[0] || "User"),
              role: (row.role as any) || "student",
              status: (row.status as any) || "active",
              isBetaTester: Number(row.is_beta_tester) === 1,
              customFlags,
              lastActiveAt: row.last_active_at ? String(row.last_active_at) : undefined,
              universityId: row.university_id ? String(row.university_id) : undefined,
              branchId: row.branch_id ? String(row.branch_id) : undefined,
              semester: row.semester_id ? String(row.semester_id) : undefined,
              enrollmentNo: row.enrollment_number ? String(row.enrollment_number) : undefined,
              collegeName: row.college_name ? String(row.college_name) : undefined,
              createdAt: String(row.created_at || new Date().toISOString()),
              updatedAt: row.updated_at ? String(row.updated_at) : String(row.created_at || ""),
            });
          }
        }
      } catch (err) {
        console.warn("Error querying unified_users:", err);
      }
    }

    const usersList = Array.from(userMap.values());

    return jsonResponse(
      {
        success: true,
        total: usersList.length,
        users: usersList,
      },
      { headers: corsHeaders }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch users";
    return errorResponse(message, 500);
  }
}

/**
 * POST /api/admin/users
 * Creates or invites a new user with role and profile across all D1 DBs
 */
export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  const admin = await getAuthenticatedUser(request, env as any);
  if (!admin) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(admin.email, admin.role) && admin.role !== "admin") {
    return errorResponse("Forbidden: Admin access required", 403);
  }

  const dbs = getDbs(env);
  if (dbs.length === 0) {
    return errorResponse("Database not available", 500);
  }

  try {
    const body = (await request.json()) as any;
    const email = body.email?.toLowerCase().trim();
    const displayName = body.displayName?.trim() || email?.split("@")[0] || "User";
    const role = body.role || "student";
    const status = body.status || "active";
    const isBetaTester = body.isBetaTester ? 1 : 0;
    const universityId = body.universityId || "gtu";
    const branchId = body.branchId || "";
    const semester = body.semester || null;
    const enrollmentNo = body.enrollmentNo || body.enrollment_number || body.enrollmentNumber || "";

    if (!email || !email.includes("@")) {
      return errorResponse("Valid email address is required", 400);
    }

    const id = body.id || `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const uid = body.uid || id;

    for (const db of dbs) {
      await ensureTables(db);

      // 1. Insert into unified_users safely
      const existing = await db.prepare(`SELECT id FROM unified_users WHERE LOWER(email) = LOWER(?) LIMIT 1`).bind(email).first();
      let targetUserId = id;
      if (existing && existing.id) {
        targetUserId = String(existing.id);
        await db.prepare(`
          UPDATE unified_users
          SET display_name = ?, user_type = ?, status = ?, ai_beta_enabled = ?, updated_at = CURRENT_TIMESTAMP
          WHERE LOWER(email) = LOWER(?)
        `).bind(displayName, role, status, isBetaTester, email).run();
      } else {
        await db.prepare(`
          INSERT INTO unified_users (id, uid, email, display_name, user_type, status, ai_beta_enabled, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `).bind(id, uid, email, displayName, role, status, isBetaTester).run();
      }

      // 2. Insert into academic_profiles
      if (universityId || branchId || enrollmentNo) {
        const existingProf = await db.prepare(`SELECT user_id FROM academic_profiles WHERE user_id = ? LIMIT 1`).bind(targetUserId).first();
        if (existingProf) {
          await db.prepare(`
            UPDATE academic_profiles
            SET university_id = ?, branch_id = ?, semester_id = ?, enrollment_number = ?, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
          `).bind(universityId, branchId, semester, enrollmentNo, targetUserId).run();
        } else {
          await db.prepare(`
            INSERT INTO academic_profiles (user_id, university_id, branch_id, semester_id, enrollment_number, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `).bind(targetUserId, universityId, branchId, semester, enrollmentNo).run();
        }
      }

      // 3. If teacher role, ensure teacher_whitelist has entry
      if (role === "teacher") {
        const existingTeacher = await db.prepare(`SELECT id FROM teacher_whitelist WHERE LOWER(email) = LOWER(?) LIMIT 1`).bind(email).first();
        if (existingTeacher) {
          await db.prepare(`UPDATE teacher_whitelist SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE LOWER(email) = LOWER(?)`).bind(email).run();
        } else {
          await db.prepare(`
            INSERT INTO teacher_whitelist (id, email, name, status, added_by, created_at, updated_at)
            VALUES (?, ?, ?, 'approved', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `).bind(`tw_${Date.now()}`, email, displayName, admin.email || "Admin").run();
        }
      }

      // 4. If beta enabled, sync user_beta_access
      if (isBetaTester) {
        const existingBeta = await db.prepare(`SELECT user_id FROM user_beta_access WHERE LOWER(user_id) = LOWER(?) OR user_id = ? LIMIT 1`).bind(email, targetUserId).first();
        if (existingBeta) {
          await db.prepare(`UPDATE user_beta_access SET is_beta_tester = 1, granted_by = ?, granted_at = CURRENT_TIMESTAMP WHERE LOWER(user_id) = LOWER(?) OR user_id = ?`).bind(admin.email || "Admin", email, targetUserId).run();
        } else {
          await db.prepare(`
            INSERT INTO user_beta_access (user_id, is_beta_tester, granted_by, granted_at)
            VALUES (?, 1, ?, CURRENT_TIMESTAMP)
          `).bind(targetUserId, admin.email || "Admin").run();
        }
      }
    }

    await recordAdminAuditLog(
      env as any,
      admin.uid,
      "USER_CREATE",
      "unified_users",
      id,
      { email, displayName, role, status, isBetaTester }
    );

    return jsonResponse(
      {
        success: true,
        message: `User ${email} created successfully.`,
        user: { id, uid, email, displayName, role, status, isBetaTester },
      },
      { headers: corsHeaders }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create user";
    return errorResponse(message, 500);
  }
}

/**
 * PUT /api/admin/users
 * Updates existing user role, status, profile, or beta status across all D1 DBs
 */
export async function onRequestPut(context: { request: Request; env: Env }) {
  const { request, env } = context;

  const admin = await getAuthenticatedUser(request, env as any);
  if (!admin) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(admin.email, admin.role) && admin.role !== "admin") {
    return errorResponse("Forbidden: Admin access required", 403);
  }

  const dbs = getDbs(env);
  if (dbs.length === 0) {
    return errorResponse("Database not available", 500);
  }

  try {
    const body = (await request.json()) as any;
    const { id, uid, email, displayName, role, status, isBetaTester, universityId, branchId, semester, enrollmentNo } = body;

    const targetKey = id || uid || email;
    if (!targetKey) {
      return errorResponse("User identifier (id, uid, or email) is required", 400);
    }

    for (const db of dbs) {
      await ensureTables(db);

      // Update unified_users
      await db.prepare(`
        UPDATE unified_users
        SET 
          display_name = COALESCE(?, display_name),
          user_type = COALESCE(?, user_type),
          status = COALESCE(?, status),
          ai_beta_enabled = COALESCE(?, ai_beta_enabled),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ? OR uid = ? OR LOWER(email) = LOWER(?)
      `)
        .bind(
          displayName || null,
          role || null,
          status || null,
          isBetaTester !== undefined ? (isBetaTester ? 1 : 0) : null,
          targetKey,
          targetKey,
          targetKey
        )
        .run();

      // Sync user_beta_access if beta status passed
      if (isBetaTester !== undefined) {
        const betaVal = isBetaTester ? 1 : 0;
        await db.prepare(`
          INSERT INTO user_beta_access (user_id, is_beta_tester, granted_by, granted_at)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(user_id) DO UPDATE SET is_beta_tester = ?, granted_by = ?, granted_at = CURRENT_TIMESTAMP
        `).bind(targetKey, betaVal, admin.email || "Admin", betaVal, admin.email || "Admin").run().catch(() => null);
      }
    }

    await recordAdminAuditLog(
      env as any,
      admin.uid,
      "USER_UPDATE",
      "unified_users",
      targetKey,
      { displayName, role, status, isBetaTester }
    );

    return jsonResponse(
      {
        success: true,
        message: `User ${targetKey} updated successfully.`,
      },
      { headers: corsHeaders }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update user";
    return errorResponse(message, 500);
  }
}

/**
 * DELETE /api/admin/users
 * Deletes a user across all D1 DBs
 */
export async function onRequestDelete(context: { request: Request; env: Env }) {
  const { request, env } = context;

  const admin = await getAuthenticatedUser(request, env as any);
  if (!admin) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(admin.email, admin.role) && admin.role !== "admin") {
    return errorResponse("Forbidden: Admin access required", 403);
  }

  const dbs = getDbs(env);
  if (dbs.length === 0) {
    return errorResponse("Database not available", 500);
  }

  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId") || url.searchParams.get("id");

    if (!userId) {
      return errorResponse("userId parameter is required", 400);
    }

    for (const db of dbs) {
      try {
        await db.prepare(`DELETE FROM unified_users WHERE id = ? OR uid = ? OR LOWER(email) = LOWER(?)`).bind(userId, userId, userId).run();
        await db.prepare(`DELETE FROM academic_profiles WHERE user_id = ?`).bind(userId).run();
        await db.prepare(`DELETE FROM user_beta_access WHERE user_id = ? OR LOWER(user_id) = LOWER(?)`).bind(userId, userId).run();
        await db.prepare(`DELETE FROM teacher_whitelist WHERE LOWER(email) = LOWER(?)`).bind(userId).run();
      } catch {}
    }

    await recordAdminAuditLog(
      env as any,
      admin.uid,
      "USER_DELETE",
      "unified_users",
      userId,
      { deletedUserId: userId }
    );

    return jsonResponse(
      {
        success: true,
        message: `User ${userId} deleted successfully.`,
      },
      { headers: corsHeaders }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete user";
    return errorResponse(message, 500);
  }
}
