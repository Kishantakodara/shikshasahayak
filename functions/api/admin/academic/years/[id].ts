// ============================================================
// ADMIN API: PUT, DELETE /api/admin/academic/years/[id]
// Update academic year, set active year, and archive
// ============================================================

import { jsonResponse, errorResponse } from "../../../../lib/json";
import { getAuthenticatedUser, isAdmin } from "../../../../lib/auth";
import { recordAdminAuditLog } from "../../../../lib/adminPlatformService";

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
      year?: string;
      startDate?: string;
      endDate?: string;
      status?: 'Active' | 'Upcoming' | 'Inactive' | 'Archived';
      description?: string;
    };

    const existing = await env.DB.prepare(`SELECT id, status FROM academic_years WHERE id = ?`).bind(id).first();
    if (!existing) {
      return errorResponse("Academic Year not found", 404);
    }

    // If status is set to Active, enforce mutual exclusivity
    if (body.status === "Active") {
      await env.DB.prepare(`
        UPDATE academic_years SET status = 'Inactive', updated_at = CURRENT_TIMESTAMP WHERE status = 'Active' AND id != ?
      `).bind(id).run();
    }

    await env.DB.prepare(`
      UPDATE academic_years SET
        year = COALESCE(?, year),
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date),
        status = COALESCE(?, status),
        description = COALESCE(?, description),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      body.year || null,
      body.startDate || null,
      body.endDate || null,
      body.status || null,
      body.description || null,
      id
    ).run();

    await recordAdminAuditLog(
      env as any,
      user.email || user.uid,
      "ACADEMIC_YEAR_UPDATE",
      "academic_year",
      id,
      body
    );

    return jsonResponse({
      success: true,
      message: `Academic year updated successfully`
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update academic year";
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

  try {
    // Instead of hard deletion, archive the academic year
    await env.DB.prepare(`
      UPDATE academic_years SET status = 'Archived', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(id).run();

    await recordAdminAuditLog(
      env as any,
      user.email || user.uid,
      "ACADEMIC_YEAR_ARCHIVE",
      "academic_year",
      id,
      { status: "Archived" }
    );

    return jsonResponse({
      success: true,
      message: `Academic year archived successfully`
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to archive academic year";
    return errorResponse(message, 500);
  }
}
