// ============================================================
// ADMIN API: GET, PUT, DELETE /api/admin/academic/branches/[id]
// Single Branch operations & child impact calculation
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
    const branch = await env.DB.prepare(`
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
        u.short_name as university_short
      FROM branches b
      JOIN universities u ON u.id = b.university_id
      WHERE b.id = ?
    `).bind(id).first<any>();

    if (!branch) {
      return errorResponse("Branch not found", 404);
    }

    const subjectCount = await env.DB.prepare(`SELECT COUNT(*) as c FROM subjects WHERE branch_id = ?`).bind(id).first<{ c: number }>();
    const docCount = await env.DB.prepare(`SELECT COUNT(*) as c FROM documents WHERE branch_id = ?`).bind(id).first<{ c: number }>();

    // Fetch list of subjects under branch
    const { results: subjects } = await env.DB.prepare(`
      SELECT id, name, code, semester, slug, created_at
      FROM subjects 
      WHERE branch_id = ?
      ORDER BY semester ASC, name ASC
    `).bind(id).all<any>();

    return jsonResponse({
      success: true,
      branch: {
        ...branch,
        universityId: branch.university_id,
        universityName: branch.university_name,
        shortName: branch.short_name || branch.code,
        isActive: Boolean(branch.is_active),
        totalSemesters: 8,
        totalSubjects: Number(subjectCount?.c || 0),
        totalDocuments: Number(docCount?.c || 0),
        subjects: subjects || []
      },
      impact: {
        subjectsCount: Number(subjectCount?.c || 0),
        documentsCount: Number(docCount?.c || 0)
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
      code?: string;
      slug?: string;
      universityId?: string;
      isActive?: boolean;
      status?: string;
    };

    const existing = await env.DB.prepare(`SELECT id FROM branches WHERE id = ?`).bind(id).first();
    if (!existing) {
      return errorResponse("Branch not found", 404);
    }

    let isActiveVal = 1;
    if (body.isActive !== undefined) {
      isActiveVal = body.isActive ? 1 : 0;
    } else if (body.status !== undefined) {
      isActiveVal = body.status.toLowerCase() === "active" ? 1 : 0;
    }

    await env.DB.prepare(`
      UPDATE branches SET
        name = COALESCE(?, name),
        short_name = COALESCE(?, short_name),
        code = COALESCE(?, code),
        slug = COALESCE(?, slug),
        university_id = COALESCE(?, university_id),
        is_active = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      body.name || null,
      body.shortName || body.short_name || null,
      body.code || null,
      body.slug || null,
      body.universityId || null,
      isActiveVal,
      id
    ).run();

    await recordAdminAuditLog(
      env as any,
      user.email || user.uid,
      "BRANCH_UPDATE",
      "branch",
      id,
      { ...body, isActive: Boolean(isActiveVal) }
    );

    return jsonResponse({
      success: true,
      message: `Branch updated successfully`
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update branch";
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
    const subjectCount = await env.DB.prepare(`SELECT COUNT(*) as c FROM subjects WHERE branch_id = ?`).bind(id).first<{ c: number }>();
    const subjects = Number(subjectCount?.c || 0);

    if (hardDelete) {
      await env.DB.prepare(`DELETE FROM branches WHERE id = ?`).bind(id).run();
      await recordAdminAuditLog(
        env as any,
        user.email || user.uid,
        "BRANCH_DELETE_HARD",
        "branch",
        id,
        { affectedSubjects: subjects }
      );
      return jsonResponse({
        success: true,
        message: `Branch and associated cascading records removed`
      });
    }

    // Soft deactivate
    await env.DB.prepare(`UPDATE branches SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(id).run();
    await recordAdminAuditLog(
      env as any,
      user.email || user.uid,
      "BRANCH_DEACTIVATE",
      "branch",
      id,
      { affectedSubjects: subjects }
    );

    return jsonResponse({
      success: true,
      message: `Branch deactivated successfully`,
      impact: {
        affectedSubjects: subjects
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to remove branch";
    return errorResponse(message, 500);
  }
}
