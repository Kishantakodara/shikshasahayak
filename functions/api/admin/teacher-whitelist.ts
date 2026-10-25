// ============================================================
// SHIKSHA SAHAYAK OS API: /api/admin/teacher-whitelist
// Teacher Whitelist Governance with Department, College, Status, & Bulk Add
// SECURITY: Requires Admin Authorization
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getAuthenticatedUser, isAdmin } from "../../lib/auth";
import { recordAdminAuditLog } from "../../lib/adminPlatformService";
import {
  syncTeacherToFirestoreREST,
  deleteTeacherFromFirestoreREST,
  fetchFirestoreCollectionREST,
} from "../../lib/firestoreRestService";

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

async function ensureTable(db: D1Database) {
  try {
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
    await db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS idx_teacher_whitelist_email_unique ON teacher_whitelist(email)`).run().catch(() => null);

    // Dynamic column check to ensure older databases (e.g. 0007_add_teacher_whitelist.sql) have all required columns
    const cols = await db.prepare(`PRAGMA table_info(teacher_whitelist)`).all<any>();
    const colNames = new Set((cols.results || []).map((c: any) => String(c.name).toLowerCase()));

    if (!colNames.has("id")) {
      await db.prepare(`ALTER TABLE teacher_whitelist ADD COLUMN id TEXT`).run().catch(() => null);
    }
    if (!colNames.has("name")) {
      await db.prepare(`ALTER TABLE teacher_whitelist ADD COLUMN name TEXT`).run().catch(() => null);
    }
    if (!colNames.has("department")) {
      await db.prepare(`ALTER TABLE teacher_whitelist ADD COLUMN department TEXT`).run().catch(() => null);
    }
    if (!colNames.has("college")) {
      await db.prepare(`ALTER TABLE teacher_whitelist ADD COLUMN college TEXT`).run().catch(() => null);
    }
    if (!colNames.has("status")) {
      await db.prepare(`ALTER TABLE teacher_whitelist ADD COLUMN status TEXT DEFAULT 'approved'`).run().catch(() => null);
    }
    if (!colNames.has("notes")) {
      await db.prepare(`ALTER TABLE teacher_whitelist ADD COLUMN notes TEXT`).run().catch(() => null);
    }
    if (!colNames.has("added_by")) {
      await db.prepare(`ALTER TABLE teacher_whitelist ADD COLUMN added_by TEXT`).run().catch(() => null);
    }
    if (!colNames.has("created_at")) {
      await db.prepare(`ALTER TABLE teacher_whitelist ADD COLUMN created_at TEXT`).run().catch(() => null);
    }
    if (!colNames.has("updated_at")) {
      await db.prepare(`ALTER TABLE teacher_whitelist ADD COLUMN updated_at TEXT`).run().catch(() => null);
    }
  } catch (err) {
    console.error("ensureTable teacher_whitelist error:", err);
  }
}

async function upsertTeacher(
  db: D1Database,
  item: { id: string; email: string; name: string; department: string; college: string; status: string; notes: string; addedBy: string }
) {
  await ensureTable(db);
  // Check existing safely via email which is guaranteed across all DDL versions
  const existing = await db.prepare(`SELECT email FROM teacher_whitelist WHERE LOWER(email) = LOWER(?) LIMIT 1`).bind(item.email).first();
  if (existing) {
    await db.prepare(`
      UPDATE teacher_whitelist
      SET
        id = COALESCE(NULLIF(?, ''), id),
        name = COALESCE(NULLIF(?, ''), name),
        department = COALESCE(NULLIF(?, ''), department),
        college = COALESCE(NULLIF(?, ''), college),
        status = COALESCE(NULLIF(?, ''), status),
        notes = COALESCE(NULLIF(?, ''), notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE LOWER(email) = LOWER(?)
    `).bind(item.id, item.name, item.department, item.college, item.status, item.notes, item.email).run();
  } else {
    await db.prepare(`
      INSERT INTO teacher_whitelist (id, email, name, department, college, status, notes, added_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(item.id, item.email, item.name, item.department, item.college, item.status, item.notes, item.addedBy).run();
  }

  // Server-side Firestore REST Sync
  await syncTeacherToFirestoreREST({
    email: item.email,
    name: item.name,
    department: item.department,
    college: item.college,
    status: item.status,
    addedBy: item.addedBy,
  });
}

/**
 * GET /api/admin/teacher-whitelist
 * Returns full list of whitelisted teachers with metadata & filtering
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
  const status = url.searchParams.get("status") || "all";
  const department = url.searchParams.get("department") || "all";

  try {
    for (const db of dbs) {
      await ensureTable(db);
    }

    let query = `
      SELECT id, email, name, department, college, status, notes, added_by, created_at, updated_at
      FROM teacher_whitelist
      WHERE 1=1
    `;
    const bindings: unknown[] = [];

    if (search) {
      query += ` AND (LOWER(email) LIKE ? OR LOWER(COALESCE(name, '')) LIKE ? OR LOWER(COALESCE(college, '')) LIKE ? OR LOWER(COALESCE(department, '')) LIKE ?)`;
      const s = `%${search}%`;
      bindings.push(s, s, s, s);
    }

    if (status && status !== "all") {
      query += ` AND status = ?`;
      bindings.push(status);
    }

    if (department && department !== "all") {
      query += ` AND department = ?`;
      bindings.push(department);
    }

    query += ` ORDER BY created_at DESC`;

    const teacherMap = new Map<string, any>();

    for (const db of dbs) {
      try {
        const { results } = await db.prepare(query).bind(...bindings).all<Record<string, unknown>>();
        for (const row of results || []) {
          const em = String(row.email || "").toLowerCase();
          if (em && !teacherMap.has(em)) {
            teacherMap.set(em, {
              id: String(row.id || `tw_${em}`),
              email: em,
              name: String(row.name || ""),
              department: String(row.department || ""),
              college: String(row.college || ""),
              status: (row.status as any) || "approved",
              notes: row.notes ? String(row.notes) : "",
              addedBy: row.added_by ? String(row.added_by) : "Admin",
              createdAt: String(row.created_at || new Date().toISOString()),
              updatedAt: row.updated_at ? String(row.updated_at) : String(row.created_at || ""),
            });
          }
        }
      } catch (err) {
        console.warn("Error querying teacher_whitelist:", err);
      }
    }

    const teachers = Array.from(teacherMap.values());

    return jsonResponse(
      {
        success: true,
        total: teachers.length,
        teachers,
      },
      { headers: corsHeaders }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Database error";
    return errorResponse(message, 500);
  }
}

/**
 * POST /api/admin/teacher-whitelist
 * Adds single or bulk teacher whitelist records
 */
export async function onRequestPost(context: { request: Request; env: Env }) {
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

  try {
    const body = (await request.json()) as any;

    // Handle Bulk Add
    if (Array.isArray(body.teachers) || Array.isArray(body.emails)) {
      const items = body.teachers || body.emails.map((em: string) => ({ email: em }));
      let addedCount = 0;

      for (const item of items) {
        const email = (typeof item === "string" ? item : item.email)?.toLowerCase().trim();
        if (!email || !email.includes("@")) continue;

        const record = {
          id: item.id || `tw_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          email,
          name: item.name || email.split("@")[0],
          department: item.department || "",
          college: item.college || "",
          status: item.status || "approved",
          notes: item.notes || "",
          addedBy: user.email || "Admin",
        };

        for (const db of dbs) {
          await upsertTeacher(db, record);
        }

        addedCount++;
      }

      await recordAdminAuditLog(
        env as any,
        user.uid,
        "TEACHER_WHITELIST_BULK_ADD",
        "teacher_whitelist",
        `bulk_${addedCount}`,
        { addedCount, actorEmail: user.email }
      );

      return jsonResponse(
        {
          success: true,
          addedCount,
          message: `Successfully whitelisted ${addedCount} teachers.`,
        },
        { headers: corsHeaders }
      );
    }

    // Handle Single Add
    const email = body.email?.toLowerCase().trim();
    if (!email || !email.includes("@")) {
      return errorResponse("Valid email address is required", 400);
    }

    const record = {
      id: body.id || `tw_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      email,
      name: body.name || email.split("@")[0],
      department: body.department || "",
      college: body.college || "",
      status: body.status || "approved",
      notes: body.notes || "",
      addedBy: user.email || "Admin",
    };

    for (const db of dbs) {
      await upsertTeacher(db, record);
    }

    await recordAdminAuditLog(
      env as any,
      user.uid,
      "TEACHER_WHITELIST_ADD",
      "teacher_whitelist",
      email,
      { email, name: record.name, department: record.department, college: record.college, status: record.status, actorEmail: user.email }
    );

    return jsonResponse(
      {
        success: true,
        email,
        message: `Teacher ${email} successfully added to whitelist.`,
      },
      { headers: corsHeaders }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Database error";
    return errorResponse(message, 500);
  }
}

/**
 * PUT /api/admin/teacher-whitelist
 * Updates teacher whitelist metadata (name, department, college, status, notes)
 */
export async function onRequestPut(context: { request: Request; env: Env }) {
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

  try {
    const body = (await request.json()) as any;
    const email = body.email?.toLowerCase().trim();

    if (!email) {
      return errorResponse("Teacher email is required", 400);
    }

    const record = {
      id: body.id || `tw_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      email,
      name: body.name || "",
      department: body.department || "",
      college: body.college || "",
      status: body.status || "approved",
      notes: body.notes || "",
      addedBy: user.email || "Admin",
    };

    for (const db of dbs) {
      await upsertTeacher(db, record);
    }

    await recordAdminAuditLog(
      env as any,
      user.uid,
      "TEACHER_WHITELIST_UPDATE",
      "teacher_whitelist",
      email,
      { email, name: record.name, department: record.department, college: record.college, status: record.status, actorEmail: user.email }
    );

    return jsonResponse(
      {
        success: true,
        email,
        message: `Teacher ${email} details updated successfully.`,
      },
      { headers: corsHeaders }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Database error";
    return errorResponse(message, 500);
  }
}

/**
 * DELETE /api/admin/teacher-whitelist
 * Removes an email address from the teacher whitelist.
 */
export async function onRequestDelete(context: { request: Request; env: Env }) {
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

  try {
    let email: string | undefined;

    const url = new URL(request.url);
    email = url.searchParams.get("email")?.toLowerCase().trim();

    if (!email) {
      try {
        const body = (await request.json()) as { email?: string };
        email = body.email?.toLowerCase().trim();
      } catch {
        // no body passed
      }
    }

    if (!email) {
      return errorResponse("Email parameter is required", 400);
    }

    for (const db of dbs) {
      try {
        await db.prepare(`DELETE FROM teacher_whitelist WHERE LOWER(email) = LOWER(?)`).bind(email).run();
      } catch {}
    }

    // Server-side Firestore REST Sync (Delete)
    await deleteTeacherFromFirestoreREST(email);

    await recordAdminAuditLog(
      env as any,
      user.uid,
      "TEACHER_WHITELIST_REVOKE",
      "teacher_whitelist",
      email,
      { actorEmail: user.email, revokedEmail: email }
    );

    return jsonResponse(
      {
        success: true,
        email,
        message: `Teacher ${email} removed from whitelist.`,
      },
      { headers: corsHeaders }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Database error";
    return errorResponse(message, 500);
  }
}
