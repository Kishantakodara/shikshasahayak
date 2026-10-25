// ============================================================
// ADMIN API: GET & POST /api/admin/academic/semesters
// Manage semester structures across universities and branches
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
  const branchId = url.searchParams.get("branchId") || url.searchParams.get("branch");
  const academicYear = url.searchParams.get("academicYear") || "2026-27";
  const search = url.searchParams.get("search");
  const status = url.searchParams.get("status");

  try {
    // 1. Fetch branches to aggregate semester definitions
    let branchQuery = `
      SELECT b.id, b.name, b.short_name, b.slug, b.code, u.id as univ_id, u.name as univ_name, u.short_name as univ_short
      FROM branches b
      JOIN universities u ON u.id = b.university_id
      WHERE 1=1
    `;
    const branchBindings: any[] = [];
    if (universityId && universityId !== "all") {
      branchQuery += ` AND (u.id = ? OR u.slug = ?)`;
      branchBindings.push(universityId, universityId);
    }
    if (branchId && branchId !== "all") {
      branchQuery += ` AND (b.id = ? OR b.slug = ?)`;
      branchBindings.push(branchId, branchId);
    }
    branchQuery += ` ORDER BY u.name ASC, b.name ASC`;

    const { results: branches } = await env.DB.prepare(branchQuery).bind(...branchBindings).all<any>();

    // 2. Fetch subject counts grouped by branch and semester
    const { results: subjectCounts } = await env.DB.prepare(`
      SELECT branch_id, semester, COUNT(id) as count
      FROM subjects
      GROUP BY branch_id, semester
    `).all<{ branch_id: string; semester: number; count: number }>();

    const countMap = new Map<string, number>();
    (subjectCounts || []).forEach(sc => {
      countMap.set(`${sc.branch_id}_${sc.semester}`, Number(sc.count));
    });

    const semestersList: any[] = [];

    // For each branch, generate its semester definitions (Semester 1 to 8)
    (branches || []).forEach(b => {
      for (let sem = 1; sem <= 8; sem++) {
        const subCount = countMap.get(`${b.id}_${sem}`) || 0;
        const semId = `${b.id}_sem_${sem}`;
        const semName = `Semester ${sem}`;

        const item = {
          id: semId,
          semesterNumber: sem,
          name: semName,
          universityId: b.univ_id,
          universityName: b.univ_name,
          universityShort: b.univ_short || b.univ_name,
          branchId: b.id,
          branchName: b.name,
          branchShort: b.short_name || b.code || b.name,
          order: sem,
          academicYear: academicYear,
          subjectsCount: subCount,
          status: "Active",
          isActive: true,
          updatedAt: new Date().toISOString()
        };

        if (search) {
          const sLower = search.toLowerCase();
          if (!semName.toLowerCase().includes(sLower) && 
              !b.name.toLowerCase().includes(sLower) && 
              !b.univ_name.toLowerCase().includes(sLower)) {
            return;
          }
        }

        if (status && status !== "all" && status.toLowerCase() !== "active") {
          return;
        }

        semestersList.push(item);
      }
    });

    return jsonResponse({
      success: true,
      count: semestersList.length,
      semesters: semestersList
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
      semesterNumber: number;
      branchId: string;
      universityId?: string;
      academicYear?: string;
      status?: string;
    };

    if (!body || !body.semesterNumber || !body.branchId) {
      return errorResponse("Missing semesterNumber or branchId", 400);
    }

    const semId = `${body.branchId}_sem_${body.semesterNumber}`;

    await recordAdminAuditLog(
      env as any,
      user.email || user.uid,
      "SEMESTER_CONFIG_UPDATE",
      "semester",
      semId,
      body
    );

    return jsonResponse({
      success: true,
      message: `Semester ${body.semesterNumber} configuration updated`,
      semester: {
        id: semId,
        semesterNumber: body.semesterNumber,
        branchId: body.branchId,
        academicYear: body.academicYear || "2026-27",
        status: body.status || "Active"
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update semester";
    return errorResponse(message, 500);
  }
}
