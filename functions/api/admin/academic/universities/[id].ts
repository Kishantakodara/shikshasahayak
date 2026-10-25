// ============================================================
// ADMIN API: GET, PUT, DELETE /api/admin/academic/universities/[id]
// Single University operations & child impact calculation
// ============================================================

import { jsonResponse, errorResponse } from "../../../../lib/json";
import { getAuthenticatedUser, isAdmin } from "../../../../lib/auth";
import { recordAdminAuditLog } from "../../../../lib/adminPlatformService";

export async function onRequestGet(context: {
  params: { id: string };
  request: Request;
  env: { 
    DB: D1Database;
    FIREBASE_PROJECT_ID?: string;
    VITE_FIREBASE_PROJECT_ID?: string;
  };
}) {
  const { params, request, env } = context;
  const id = params.id;

  // ── Auth Guard ──────────────────────────────────────────
  const user = await getAuthenticatedUser(request, env as any);
  if (!user) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(user.email, user.role) && user.role !== "admin") {
    return errorResponse("Forbidden: Admin authorization required", 403);
  }
  // ────────────────────────────────────────────────────────

  try {
    const university = await env.DB.prepare(`
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
        u.updated_at
      FROM universities u
      WHERE u.id = ?
    `).bind(id).first<any>();

    if (!university) {
      return errorResponse("University not found", 404);
    }

    // Fetch branches and subjects count
    const branchCount = await env.DB.prepare(`SELECT COUNT(*) as c FROM branches WHERE university_id = ?`).bind(id).first<{ c: number }>();
    const subjectCount = await env.DB.prepare(`SELECT COUNT(*) as c FROM subjects WHERE university_id = ?`).bind(id).first<{ c: number }>();

    // Fetch list of branches
    const { results: branches } = await env.DB.prepare(`
      SELECT id, name, slug, short_name, code, created_at
      FROM branches 
      WHERE university_id = ?
      ORDER BY name ASC
    `).bind(id).all<any>();

    return jsonResponse({
      success: true,
      university: {
        ...university,
        shortName: university.short_name || university.name,
        isActive: Boolean(university.is_active),
        totalBranches: Number(branchCount?.c || 0),
        totalSubjects: Number(subjectCount?.c || 0),
        branches: branches || []
      },
      impact: {
        branchesCount: Number(branchCount?.c || 0),
        subjectsCount: Number(subjectCount?.c || 0),
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}

export async function onRequestPut(context: {
  params: { id: string };
  request: Request;
  env: { 
    DB: D1Database;
    FIREBASE_PROJECT_ID?: string;
    VITE_FIREBASE_PROJECT_ID?: string;
  };
}) {
  const { params, request, env } = context;
  const id = params.id;

  // ── Auth Guard ──────────────────────────────────────────
  const user = await getAuthenticatedUser(request, env as any);
  if (!user) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(user.email, user.role) && user.role !== "admin") {
    return errorResponse("Forbidden: Admin authorization required", 403);
  }
  // ────────────────────────────────────────────────────────

  try {
    const body = await request.json() as {
      name?: string;
      shortName?: string;
      short_name?: string;
      slug?: string;
      country?: string;
      state?: string;
      isActive?: boolean;
      status?: string;
    };

    const existing = await env.DB.prepare(`SELECT id, name FROM universities WHERE id = ?`).bind(id).first();
    if (!existing) {
      return errorResponse("University not found", 404);
    }

    let isActiveVal = 1;
    if (body.isActive !== undefined) {
      isActiveVal = body.isActive ? 1 : 0;
    } else if (body.status !== undefined) {
      isActiveVal = body.status.toLowerCase() === "active" ? 1 : 0;
    }

    await env.DB.prepare(`
      UPDATE universities SET
        name = COALESCE(?, name),
        short_name = COALESCE(?, short_name),
        slug = COALESCE(?, slug),
        country = COALESCE(?, country),
        state = COALESCE(?, state),
        is_active = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      body.name || null,
      body.shortName || body.short_name || null,
      body.slug || null,
      body.country || null,
      body.state || null,
      isActiveVal,
      id
    ).run();

    await recordAdminAuditLog(
      env as any,
      user.email || user.uid,
      "UNIVERSITY_UPDATE",
      "university",
      id,
      { ...body, isActive: Boolean(isActiveVal) }
    );

    return jsonResponse({
      success: true,
      message: `University updated successfully`
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update university";
    return errorResponse(message, 500);
  }
}

export async function onRequestDelete(context: {
  params: { id: string };
  request: Request;
  env: { 
    DB: D1Database;
    FIREBASE_PROJECT_ID?: string;
    VITE_FIREBASE_PROJECT_ID?: string;
  };
}) {
  const { params, request, env } = context;
  const id = params.id;

  // ── Auth Guard ──────────────────────────────────────────
  const user = await getAuthenticatedUser(request, env as any);
  if (!user) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(user.email, user.role) && user.role !== "admin") {
    return errorResponse("Forbidden: Admin authorization required", 403);
  }
  // ────────────────────────────────────────────────────────

  const url = new URL(request.url);
  const hardDelete = url.searchParams.get("hard") === "true";

  try {
    // Check affected child records
    const branchCount = await env.DB.prepare(`SELECT COUNT(*) as c FROM branches WHERE university_id = ?`).bind(id).first<{ c: number }>();
    const subjectCount = await env.DB.prepare(`SELECT COUNT(*) as c FROM subjects WHERE university_id = ?`).bind(id).first<{ c: number }>();

    const branches = Number(branchCount?.c || 0);
    const subjects = Number(subjectCount?.c || 0);

    if (hardDelete) {
      await env.DB.prepare(`DELETE FROM universities WHERE id = ?`).bind(id).run();
      await recordAdminAuditLog(
        env as any,
        user.email || user.uid,
        "UNIVERSITY_DELETE_HARD",
        "university",
        id,
        { affectedBranches: branches, affectedSubjects: subjects }
      );
      return jsonResponse({
        success: true,
        message: `University and associated cascading records removed`
      });
    }

    // Soft deactivate preferred to preserve data integrity
    await env.DB.prepare(`UPDATE universities SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(id).run();
    await recordAdminAuditLog(
      env as any,
      user.email || user.uid,
      "UNIVERSITY_DEACTIVATE",
      "university",
      id,
      { affectedBranches: branches, affectedSubjects: subjects }
    );

    return jsonResponse({
      success: true,
      message: `University deactivated successfully`,
      impact: {
        affectedBranches: branches,
        affectedSubjects: subjects
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to remove university";
    return errorResponse(message, 500);
  }
}
