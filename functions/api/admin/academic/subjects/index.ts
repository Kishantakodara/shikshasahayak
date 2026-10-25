// ============================================================
// ADMIN API: GET & POST /api/admin/academic/subjects
// Search, filter, paginate, and manage the master Subject catalog
// ============================================================

import { jsonResponse, errorResponse } from "../../../../lib/json";
import { resolveBranch, resolveSubject } from "../../../../lib/materialUpload";
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
  const university = url.searchParams.get("university") || url.searchParams.get("universityId");
  const branch = url.searchParams.get("branch") || url.searchParams.get("branchId");
  const semester = url.searchParams.get("semester");
  const code = url.searchParams.get("code");
  const search = url.searchParams.get("search");
  const status = url.searchParams.get("status");

  try {
    let query = `
      SELECT
        s.id,
        s.name AS subject_name,
        s.code AS subject_code,
        s.slug AS subject_slug,
        s.semester,
        s.syllabus_link,
        COALESCE(s.is_active, 1) as is_active,
        CASE WHEN s.is_active = 0 THEN 'Inactive' ELSE 'Active' END as status,
        s.wef_year,
        s.created_at,
        s.updated_at,
        b.id AS branch_id,
        b.name AS branch_name,
        b.slug AS branch_slug,
        b.short_name AS branch_short,
        b.code AS branch_code,
        u.id AS university_id,
        u.name AS university_name,
        u.short_name AS university_short,
        (SELECT COUNT(id) FROM documents WHERE subject_id = s.id AND document_type = 'study-material') as materials_count,
        (SELECT COUNT(id) FROM documents WHERE subject_id = s.id AND document_type = 'pyq') as pyqs_count,
        (SELECT COUNT(id) FROM subject_units WHERE subject_id = s.id) as units_count
      FROM subjects s
      JOIN branches b ON b.id = s.branch_id
      LEFT JOIN universities u ON u.id = s.university_id OR u.id = b.university_id
      WHERE 1=1
    `;
    const bindings: any[] = [];

    if (university && university !== "all") {
      query += ` AND (u.id = ? OR u.slug = ?)`;
      bindings.push(university, university);
    }

    if (branch && branch !== "all") {
      query += ` AND (b.slug = ? OR b.id = ? OR b.name LIKE ?)`;
      bindings.push(branch, branch, `%${branch}%`);
    }

    if (semester && semester !== "all" && Number.isFinite(Number(semester))) {
      query += ` AND s.semester = ?`;
      bindings.push(Number(semester));
    }

    if (status && status !== "all") {
      if (status.toLowerCase() === "active") {
        query += ` AND (s.is_active = 1 OR s.is_active IS NULL)`;
      } else if (status.toLowerCase() === "inactive") {
        query += ` AND s.is_active = 0`;
      }
    }

    if (code) {
      query += ` AND s.code LIKE ?`;
      bindings.push(`%${code}%`);
    }

    if (search) {
      query += ` AND (s.name LIKE ? OR s.code LIKE ? OR s.slug LIKE ?)`;
      bindings.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY b.name ASC, s.semester ASC, s.name ASC`;

    const { results } = await env.DB.prepare(query).bind(...bindings).all<any>();

    const subjects = (results || []).map((row: any) => {
      const matCount = Number(row.materials_count || 0);
      const pyqCount = Number(row.pyqs_count || 0);
      const unitCount = Number(row.units_count || 0);
      const hasContent = matCount > 0 || pyqCount > 0 || row.syllabus_link;
      
      // Calculate content coverage percentage based on actual materials & syllabus
      let coveragePercent = 0;
      if (row.syllabus_link) coveragePercent += 20;
      if (matCount > 0) coveragePercent += Math.min(50, matCount * 10);
      if (pyqCount > 0) coveragePercent += Math.min(30, pyqCount * 6);
      if (unitCount > 0) coveragePercent = Math.min(100, Math.max(coveragePercent, unitCount * 20));

      return {
        id: row.id,
        name: row.subject_name,
        code: row.subject_code || '',
        slug: row.subject_slug,
        semester: Number(row.semester),
        credits: row.semester <= 2 ? 3 : 4,
        status: row.status,
        isActive: Boolean(row.is_active),
        branchId: row.branch_id,
        branchName: row.branch_name,
        branchShort: row.branch_short || row.branch_code || 'BR',
        branchSlug: row.branch_slug,
        universityId: row.university_id || 'gtu',
        universityName: row.university_name || 'Gujarat Technological University',
        universityShort: row.university_short || 'GTU',
        academicYear: row.wef_year ? `${row.wef_year}-${String(row.wef_year + 1).slice(-2)}` : '2026-27',
        syllabusLink: row.syllabus_link || '',
        materialsCount: matCount,
        pyqsCount: pyqCount,
        unitsCount: unitCount,
        hasContent,
        contentCoverage: coveragePercent,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    });

    return jsonResponse({
      success: true,
      count: subjects.length,
      subjects,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
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
    const data = await request.json() as any;
    const { name, code, branch_id, branchId, semester, syllabus_link, syllabusLink, is_active, isActive } = data;

    const bId = branch_id || branchId;
    if (!name || !bId || semester === undefined) {
      return errorResponse("Missing required fields: name, branchId, semester", 400);
    }

    const branch = await resolveBranch(env as any, { branchId: bId });
    if (!branch) {
      return errorResponse("Branch not found", 404);
    }

    const subject = await resolveSubject(env as any, {
      branchId: branch.id,
      universityId: branch.university_id || 'gtu',
      semester: Number(semester),
      subjectName: name.trim(),
      subjectCode: code ? code.trim() : "",
    });

    // Update extra properties if provided
    const link = syllabus_link || syllabusLink;
    const activeFlag = isActive !== undefined ? (isActive ? 1 : 0) : (is_active !== undefined ? Number(is_active) : 1);

    if (link || activeFlag !== undefined) {
      await env.DB.prepare(`
        UPDATE subjects SET 
          syllabus_link = COALESCE(?, syllabus_link),
          is_active = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(link || null, activeFlag, subject.id).run();
    }

    await recordAdminAuditLog(
      env as any,
      user.email || user.uid,
      "SUBJECT_SAVE",
      "subject",
      subject.id,
      { name, code, branchId: branch.id, semester: Number(semester), syllabusLink: link, isActive: Boolean(activeFlag) }
    );

    return jsonResponse({ 
      success: true, 
      id: subject.id,
      offeringId: subject.id,
      message: `Subject ${name} created/updated successfully` 
    });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
