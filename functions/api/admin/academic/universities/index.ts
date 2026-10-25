// ============================================================
// ADMIN API: GET & POST /api/admin/academic/universities
// Manage universities in the Academic Management Suite
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
  const search = url.searchParams.get("search");
  const status = url.searchParams.get("status");

  try {
    let query = `
      SELECT 
        u.id,
        u.name,
        u.short_name,
        u.slug,
        COALESCE(u.country, 'India') as country,
        COALESCE(u.state, 'Gujarat') as state,
        CASE WHEN u.is_active = 0 THEN 'Inactive' ELSE 'Active' END as status,
        COALESCE(u.is_active, 1) as is_active,
        u.created_at,
        u.updated_at,
        COUNT(DISTINCT b.id) as total_branches,
        COUNT(DISTINCT s.id) as total_subjects,
        (SELECT COUNT(id) FROM unified_users WHERE user_type = 'student' OR user_type IS NULL) as total_students
      FROM universities u
      LEFT JOIN branches b ON b.university_id = u.id
      LEFT JOIN subjects s ON s.university_id = u.id
      WHERE 1=1
    `;
    const bindings: any[] = [];

    if (status && status !== "all") {
      if (status.toLowerCase() === "active") {
        query += ` AND (u.is_active = 1 OR u.is_active IS NULL)`;
      } else if (status.toLowerCase() === "inactive") {
        query += ` AND u.is_active = 0`;
      }
    }

    if (search) {
      query += ` AND (u.name LIKE ? OR u.short_name LIKE ? OR u.slug LIKE ?)`;
      bindings.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` GROUP BY u.id ORDER BY u.is_active DESC, u.name ASC`;

    const { results } = await env.DB.prepare(query).bind(...bindings).all<any>();

    const universities = (results || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      shortName: row.short_name || row.name,
      slug: row.slug,
      country: row.country,
      state: row.state,
      type: row.id === 'gtu' ? 'State University' : 'University',
      status: row.status,
      isActive: Boolean(row.is_active),
      totalBranches: Number(row.total_branches || 0),
      totalSubjects: Number(row.total_subjects || 0),
      totalStudents: Number(row.total_students || 0),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return jsonResponse({
      success: true,
      count: universities.length,
      universities,
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
      name: string;
      shortName?: string;
      short_name?: string;
      slug?: string;
      country?: string;
      state?: string;
      type?: string;
      isActive?: boolean;
    };

    if (!body || !body.name) {
      return errorResponse("University name is required", 400);
    }

    const name = body.name.trim();
    const shortName = (body.shortName || body.short_name || name.slice(0, 4)).trim().toUpperCase();
    const slug = (body.slug || shortName.toLowerCase().replace(/[^a-z0-9]/g, "-")).trim();
    const id = (body.id || `univ_${slug.replace(/-/g, "_")}`).trim();
    const country = body.country || "India";
    const state = body.state || "Gujarat";
    const isActive = body.isActive !== undefined ? (body.isActive ? 1 : 0) : 1;

    await env.DB.prepare(`
      INSERT INTO universities (id, name, short_name, slug, country, state, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        short_name = excluded.short_name,
        slug = excluded.slug,
        country = excluded.country,
        state = excluded.state,
        is_active = excluded.is_active,
        updated_at = CURRENT_TIMESTAMP
    `).bind(id, name, shortName, slug, country, state, isActive).run();

    await recordAdminAuditLog(
      env as any,
      user.email || user.uid,
      "UNIVERSITY_SAVE",
      "university",
      id,
      { name, shortName, slug, isActive }
    );

    return jsonResponse({
      success: true,
      message: `University ${name} saved successfully`,
      university: {
        id,
        name,
        shortName,
        slug,
        country,
        state,
        isActive: Boolean(isActive),
        status: isActive ? "Active" : "Inactive"
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create university";
    return errorResponse(message, 500);
  }
}
