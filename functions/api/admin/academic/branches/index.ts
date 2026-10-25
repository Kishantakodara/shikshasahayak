// ============================================================
// ADMIN API: GET & POST /api/admin/academic/branches
// Manage university branches in the Academic Management Suite
// ============================================================

import { jsonResponse, errorResponse } from "../../../../lib/json";
import { getAuthenticatedUser, isAdmin } from "../../../../lib/auth";
import { recordAdminAuditLog } from "../../../../lib/adminPlatformService";

export async function onRequestGet(context: {
  request: Request;
  env: { 
    DB: D1Database;
    FIREBASE_PROJECT_ID?: string;
    VITE_FIREBASE_PROJECT_ID?: string;
  };
}) {
  const { request, env } = context;

  // ── Auth Guard ──────────────────────────────────────────
  const user = await getAuthenticatedUser(request, env as any);
  if (!user) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(user.email, user.role) && user.role !== "admin") {
    return errorResponse("Forbidden: Admin authorization required", 403);
  }
  // ────────────────────────────────────────────────────────

  const url = new URL(request.url);
  const universityId = url.searchParams.get("universityId") || url.searchParams.get("university");
  const search = url.searchParams.get("search");
  const status = url.searchParams.get("status");

  try {
    let query = `
      SELECT 
        b.id,
        b.university_id,
        b.name,
        b.slug,
        b.short_name,
        b.code,
        CASE WHEN b.is_active = 0 THEN 'Inactive' ELSE 'Active' END as status,
        COALESCE(b.is_active, 1) as is_active,
        b.created_at,
        b.updated_at,
        u.name as university_name,
        u.short_name as university_short,
        COUNT(DISTINCT s.semester) as total_semesters,
        COUNT(DISTINCT s.id) as total_subjects
      FROM branches b
      JOIN universities u ON u.id = b.university_id
      LEFT JOIN subjects s ON s.branch_id = b.id
      WHERE 1=1
    `;
    const bindings: any[] = [];

    if (universityId && universityId !== "all") {
      query += ` AND (b.university_id = ? OR u.slug = ?)`;
      bindings.push(universityId, universityId);
    }

    if (status && status !== "all") {
      if (status.toLowerCase() === "active") {
        query += ` AND (b.is_active = 1 OR b.is_active IS NULL)`;
      } else if (status.toLowerCase() === "inactive") {
        query += ` AND b.is_active = 0`;
      }
    }

    if (search) {
      query += ` AND (b.name LIKE ? OR b.short_name LIKE ? OR b.code LIKE ? OR b.slug LIKE ?)`;
      bindings.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` GROUP BY b.id ORDER BY b.name ASC`;

    const { results } = await env.DB.prepare(query).bind(...bindings).all<any>();

    const branches = (results || []).map((row: any) => ({
      id: row.id,
      universityId: row.university_id,
      universityName: row.university_name,
      universityShort: row.university_short || row.university_name,
      name: row.name,
      slug: row.slug,
      shortName: row.short_name || row.code || row.name.slice(0, 3).toUpperCase(),
      code: row.code || row.short_name || '',
      status: row.status,
      isActive: Boolean(row.is_active),
      totalSemesters: Math.max(8, Number(row.total_semesters || 8)),
      totalSubjects: Number(row.total_subjects || 0),
      totalStudents: 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    return jsonResponse({
      success: true,
      count: branches.length,
      branches
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}

export async function onRequestPost(context: {
  request: Request;
  env: { 
    DB: D1Database;
    FIREBASE_PROJECT_ID?: string;
    VITE_FIREBASE_PROJECT_ID?: string;
  };
}) {
  const { request, env } = context;

  // ── Auth Guard ──────────────────────────────────────────
  const user = await getAuthenticatedUser(request, env as any);
  if (!user) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(user.email, user.role) && user.role !== "admin") {
    return errorResponse("Forbidden: Admin authorization required", 403);
  }
  // ────────────────────────────────────────────────────────

  try {
    const body = await request.json() as {
      id?: string;
      universityId?: string;
      university_id?: string;
      name: string;
      slug?: string;
      shortName?: string;
      short_name?: string;
      code?: string;
      isActive?: boolean;
    };

    if (!body || !body.name) {
      return errorResponse("Branch name is required", 400);
    }

    const univId = body.universityId || body.university_id || "gtu";
    
    // Ensure parent university exists
    const univ = await env.DB.prepare(`SELECT id FROM universities WHERE id = ?`).bind(univId).first();
    if (!univ) {
      return errorResponse(`Parent university '${univId}' does not exist`, 400);
    }

    const name = body.name.trim();
    const shortName = (body.shortName || body.short_name || name.slice(0, 3)).trim().toUpperCase();
    const code = (body.code || shortName).trim();
    const slug = (body.slug || name.toLowerCase().replace(/[^a-z0-9]/g, "-")).trim();
    const id = (body.id || `branch_${code.toLowerCase()}_${slug}`).trim();
    const isActive = body.isActive !== undefined ? (body.isActive ? 1 : 0) : 1;

    await env.DB.prepare(`
      INSERT INTO branches (id, university_id, name, slug, short_name, code, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        university_id = excluded.university_id,
        name = excluded.name,
        slug = excluded.slug,
        short_name = excluded.short_name,
        code = excluded.code,
        is_active = excluded.is_active,
        updated_at = CURRENT_TIMESTAMP
    `).bind(id, univId, name, slug, shortName, code, isActive).run();

    await recordAdminAuditLog(
      env as any,
      user.email || user.uid,
      "BRANCH_SAVE",
      "branch",
      id,
      { universityId: univId, name, slug, code, isActive }
    );

    return jsonResponse({
      success: true,
      message: `Branch ${name} saved successfully`,
      branch: {
        id,
        universityId: univId,
        name,
        slug,
        shortName,
        code,
        isActive: Boolean(isActive),
        status: isActive ? "Active" : "Inactive"
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create branch";
    return errorResponse(message, 500);
  }
}
