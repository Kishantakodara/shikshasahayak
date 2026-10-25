// ============================================================
// ADMIN API: GET /api/admin/academic/overview
// Real Academic Management hierarchy & aggregated KPI metrics
// ============================================================

import { jsonResponse, errorResponse } from "../../../lib/json";
import { getAuthenticatedUser, isAdmin } from "../../../lib/auth";

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

  try {
    // 1. Universities metrics
    const univStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_active = 1 OR is_active IS NULL THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive
      FROM universities
    `).first<{ total: number; active: number; inactive: number }>();

    // 2. Branches metrics
    const branchStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_active = 1 OR is_active IS NULL THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive
      FROM branches
    `).first<{ total: number; active: number; inactive: number }>();

    // 3. Subjects metrics
    const subjectStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_active = 1 OR is_active IS NULL THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive
      FROM subjects
    `).first<{ total: number; active: number; inactive: number }>();

    let withContentCount = 0;
    try {
      const withContentRes = await env.DB.prepare(`
        SELECT COUNT(DISTINCT subject_id) as count 
        FROM documents 
        WHERE approval_status = 'approved' OR approval_status = 'pending'
      `).first<{ count: number }>();
      withContentCount = withContentRes ? Number(withContentRes.count) : 0;
    } catch {}

    // 4. Academic Years metrics
    let yearStats = { total: 4, active: 1 };
    try {
      const dbYears = await env.DB.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active
        FROM academic_years
      `).first<{ total: number; active: number }>();
      if (dbYears && dbYears.total > 0) {
        yearStats = { total: Number(dbYears.total), active: Number(dbYears.active) };
      }
    } catch {
      // Table may not exist in unmigrated environment; fallback gracefully
    }

    // 5. Units & Topics counts (from subject_units and subject_topics if populated, or estimated from documents)
    let totalUnits = 0;
    let totalTopics = 0;
    try {
      const uRes = await env.DB.prepare(`SELECT COUNT(*) as c FROM subject_units`).first<{ c: number }>();
      totalUnits = uRes ? Number(uRes.c) : 0;
    } catch {}

    try {
      const tRes = await env.DB.prepare(`SELECT COUNT(*) as c FROM subject_topics`).first<{ c: number }>();
      totalTopics = tRes ? Number(tRes.c) : 0;
    } catch {}

    // Fallback calculation from documents if subject_units is 0
    if (totalUnits === 0) {
      try {
        const docUnits = await env.DB.prepare(`
          SELECT COUNT(DISTINCT subject_id || '_' || unit_no) as c 
          FROM documents 
          WHERE unit_no IS NOT NULL AND unit_no > 0
        `).first<{ c: number }>();
        totalUnits = docUnits ? Number(docUnits.c) : 0;
      } catch {}
    }

    // 6. Distinct semesters count across branches
    const semesterCountRes = await env.DB.prepare(`
      SELECT COUNT(DISTINCT branch_id || '_' || semester) as c FROM subjects
    `).first<{ c: number }>();
    const totalSemesters = semesterCountRes && semesterCountRes.c > 0 ? Number(semesterCountRes.c) : (branchStats?.total || 1) * 8;

    // 7. Structure Hierarchy (Universities with Branches & Subject counts)
    const { results: rawHierarchy } = await env.DB.prepare(`
      SELECT 
        u.id as university_id,
        u.name as university_name,
        u.short_name as university_short,
        b.id as branch_id,
        b.name as branch_name,
        b.short_name as branch_short,
        b.code as branch_code,
        COUNT(s.id) as subjects_count
      FROM universities u
      LEFT JOIN branches b ON b.university_id = u.id
      LEFT JOIN subjects s ON s.branch_id = b.id
      GROUP BY u.id, b.id
      ORDER BY u.name ASC, b.name ASC
    `).all<{
      university_id: string;
      university_name: string;
      university_short: string;
      branch_id: string;
      branch_name: string;
      branch_short: string;
      branch_code: string;
      subjects_count: number;
    }>();

    // Group hierarchy structure
    const hierarchyMap = new Map<string, any>();
    (rawHierarchy || []).forEach(row => {
      if (!row.university_id) return;
      if (!hierarchyMap.has(row.university_id)) {
        hierarchyMap.set(row.university_id, {
          id: row.university_id,
          name: row.university_name,
          shortName: row.university_short || row.university_name,
          branches: [],
          totalSubjects: 0
        });
      }

      if (row.branch_id) {
        const univ = hierarchyMap.get(row.university_id);
        const subCount = Number(row.subjects_count || 0);
        univ.branches.push({
          id: row.branch_id,
          name: row.branch_name,
          shortName: row.branch_short || row.branch_code || 'BR',
          code: row.branch_code,
          subjectsCount: subCount
        });
        univ.totalSubjects += subCount;
      }
    });

    const hierarchy = Array.from(hierarchyMap.values());

    // 8. Recent Real Academic Activity
    const recentActivities: any[] = [];

    // Check recent subjects
    try {
      const { results: recentSubs } = await env.DB.prepare(`
        SELECT s.id, s.name, s.code, s.semester, b.name as branch_name, u.short_name as univ_name, s.created_at
        FROM subjects s
        JOIN branches b ON b.id = s.branch_id
        JOIN universities u ON u.id = s.university_id
        ORDER BY s.created_at DESC
        LIMIT 5
      `).all<any>();

      (recentSubs || []).forEach(sub => {
        recentActivities.push({
          id: `act_sub_${sub.id}`,
          type: 'subject_created',
          title: `New subject cataloged: ${sub.name} (${sub.code || 'N/A'})`,
          subtitle: `${sub.branch_name} • Sem ${sub.semester} • ${sub.univ_name || 'GTU'}`,
          timestamp: sub.created_at,
          category: 'Subject'
        });
      });
    } catch {}

    // Check recent branches
    try {
      const { results: recentBr } = await env.DB.prepare(`
        SELECT b.id, b.name, b.short_name, u.name as univ_name, b.created_at
        FROM branches b
        JOIN universities u ON u.id = b.university_id
        ORDER BY b.created_at DESC
        LIMIT 3
      `).all<any>();

      (recentBr || []).forEach(br => {
        recentActivities.push({
          id: `act_br_${br.id}`,
          type: 'branch_added',
          title: `Branch configured: ${br.name}`,
          subtitle: `Linked under ${br.univ_name}`,
          timestamp: br.created_at,
          category: 'Branch'
        });
      });
    } catch {}

    // Sort recent activities by timestamp
    recentActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return jsonResponse({
      success: true,
      kpis: {
        universities: {
          total: Number(univStats?.total || 0),
          active: Number(univStats?.active || 0),
          inactive: Number(univStats?.inactive || 0),
          draft: 0
        },
        branches: {
          total: Number(branchStats?.total || 0),
          active: Number(branchStats?.active || 0),
          inactive: Number(branchStats?.inactive || 0),
          draft: 0
        },
        semesters: {
          total: totalSemesters,
          active: totalSemesters,
          inactive: 0,
          draft: 0
        },
        subjects: {
          total: Number(subjectStats?.total || 0),
          active: Number(subjectStats?.active || 0),
          inactive: Number(subjectStats?.inactive || 0),
          withContent: withContentCount,
          withoutContent: Math.max(0, Number(subjectStats?.total || 0) - withContentCount),
          draft: 0
        },
        academicYears: {
          total: yearStats.total,
          active: yearStats.active,
          inactive: Math.max(0, yearStats.total - yearStats.active),
          draft: 0
        },
        units: totalUnits,
        topics: totalTopics
      },
      hierarchy,
      recentActivities: recentActivities.slice(0, 8)
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
