// ============================================================
// ADMIN API: GET & POST /api/admin/academic/years
// Manage Academic Years & enforce single active year rule
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
  const status = url.searchParams.get("status");

  try {
    let query = `
      SELECT 
        ay.id,
        ay.year,
        ay.start_date,
        ay.end_date,
        ay.status,
        ay.description,
        ay.created_at,
        ay.updated_at,
        (SELECT COUNT(id) FROM universities) as universities_count,
        (SELECT COUNT(id) FROM branches) as branches_count,
        (SELECT COUNT(id) FROM subjects) as subjects_count
      FROM academic_years ay
      WHERE 1=1
    `;
    const bindings: any[] = [];

    if (status && status !== "all") {
      query += ` AND ay.status = ?`;
      bindings.push(status);
    }

    query += ` ORDER BY ay.year DESC`;

    const { results } = await env.DB.prepare(query).bind(...bindings).all<any>();

    const academicYears = (results || []).map((row: any) => ({
      id: row.id,
      year: row.year,
      name: `Academic Year ${row.year}`,
      startDate: row.start_date,
      endDate: row.end_date,
      status: row.status, // 'Active' | 'Upcoming' | 'Inactive' | 'Archived'
      isActive: row.status === 'Active',
      description: row.description || '',
      universitiesCount: Number(row.universities_count || 0),
      branchesCount: Number(row.branches_count || 0),
      subjectsCount: Number(row.subjects_count || 0),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    return jsonResponse({
      success: true,
      count: academicYears.length,
      academicYears
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
      year: string;
      startDate: string;
      endDate: string;
      status?: string;
      description?: string;
    };

    if (!body || !body.year || !body.startDate || !body.endDate) {
      return errorResponse("Missing required fields: year, startDate, endDate", 400);
    }

    const year = body.year.trim();
    const id = `ay_${year.replace(/[^a-zA-Z0-9]/g, "_")}`;
    const status = body.status || "Upcoming";
    const desc = body.description || `Academic Session ${year}`;

    // If setting to Active, set all other active years to Inactive to enforce single active year
    if (status === "Active") {
      await env.DB.prepare(`
        UPDATE academic_years SET status = 'Inactive', updated_at = CURRENT_TIMESTAMP WHERE status = 'Active'
      `).run();
    }

    await env.DB.prepare(`
      INSERT INTO academic_years (id, year, start_date, end_date, status, description)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        year = excluded.year,
        start_date = excluded.start_date,
        end_date = excluded.end_date,
        status = excluded.status,
        description = excluded.description,
        updated_at = CURRENT_TIMESTAMP
    `).bind(id, year, body.startDate, body.endDate, status, desc).run();

    await recordAdminAuditLog(
      env as any,
      user.email || user.uid,
      "ACADEMIC_YEAR_SAVE",
      "academic_year",
      id,
      { year, status, startDate: body.startDate, endDate: body.endDate }
    );

    return jsonResponse({
      success: true,
      message: `Academic Year ${year} saved successfully`,
      academicYear: {
        id,
        year,
        startDate: body.startDate,
        endDate: body.endDate,
        status,
        isActive: status === "Active",
        description: desc
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create academic year";
    return errorResponse(message, 500);
  }
}
