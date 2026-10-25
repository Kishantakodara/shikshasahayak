// ============================================================
// ADMIN API: GET, PUT, DELETE /api/admin/academic/subjects/[id]
// Single Subject detail, coverage breakdown, units/topics, & impact
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
    const subject = await env.DB.prepare(`
      SELECT 
        s.id,
        s.name,
        s.code,
        s.slug,
        s.semester,
        s.syllabus_link,
        COALESCE(s.is_active, 1) as is_active,
        CASE WHEN s.is_active = 0 THEN 'Inactive' ELSE 'Active' END as status,
        s.wef_year,
        s.created_at,
        s.updated_at,
        b.id as branch_id,
        b.name as branch_name,
        b.short_name as branch_short,
        b.code as branch_code,
        u.id as university_id,
        u.name as university_name,
        u.short_name as university_short
      FROM subjects s
      JOIN branches b ON b.id = s.branch_id
      LEFT JOIN universities u ON u.id = s.university_id OR u.id = b.university_id
      WHERE s.id = ? OR s.slug = ?
    `).bind(id, id).first<any>();

    if (!subject) {
      return errorResponse("Subject not found", 404);
    }

    // 1. Fetch Units from curriculum_nodes (fallback to subject_units)
    let { results: rawUnits } = await env.DB.prepare(`
      SELECT id, node_number as unit_no, title, description, created_at
      FROM curriculum_nodes
      WHERE subject_id = ? AND node_type = 'unit' AND is_active = 1
      ORDER BY node_number ASC, sort_order ASC
    `).bind(subject.id).all<any>();

    if (!rawUnits || rawUnits.length === 0) {
      const legacyUnits = await env.DB.prepare(`
        SELECT id, unit_no, title, description, created_at
        FROM subject_units
        WHERE subject_id = ?
        ORDER BY unit_no ASC
      `).bind(subject.id).all<any>();
      rawUnits = legacyUnits.results || [];
    }

    // 2. Fetch Topics from curriculum_nodes (fallback to subject_topics)
    const unitIds = (rawUnits || []).map(u => u.id);
    let rawTopics: any[] = [];
    if (unitIds.length > 0) {
      const placeholders = unitIds.map(() => '?').join(',');
      const { results: topics } = await env.DB.prepare(`
        SELECT id, parent_id as unit_id, node_number as topic_no, title, description
        FROM curriculum_nodes
        WHERE parent_id IN (${placeholders}) AND node_type = 'topic' AND is_active = 1
        ORDER BY node_number ASC, sort_order ASC
      `).bind(...unitIds).all<any>();
      
      if (topics && topics.length > 0) {
        rawTopics = topics;
      } else {
        const legacyTopics = await env.DB.prepare(`
          SELECT id, unit_id, topic_no, title, description
          FROM subject_topics
          WHERE unit_id IN (${placeholders})
          ORDER BY topic_no ASC
        `).bind(...unitIds).all<any>();
        rawTopics = legacyTopics.results || [];
      }
    }

    // 3. Fetch Study Materials & PYQs
    const { results: materials } = await env.DB.prepare(`
      SELECT id, title, document_type, material_kind, unit_no, chapter, topic, approval_status, created_at
      FROM documents
      WHERE subject_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `).bind(subject.id).all<any>();

    // 4. Calculate Unit Coverage Breakdown
    const unitsBreakdown = (rawUnits || []).map((u, idx) => {
      const unitDocs = (materials || []).filter(m => Number(m.unit_no) === Number(u.unit_no));
      const hasPyqs = unitDocs.some(d => d.document_type === 'pyq');
      const hasNotes = unitDocs.some(d => d.document_type === 'study-material');
      
      let percentage = 0;
      if (hasNotes && hasPyqs) percentage = 100;
      else if (hasNotes) percentage = 80;
      else if (hasPyqs) percentage = 60;
      else percentage = 0;

      return {
        unitNumber: u.unit_no,
        title: u.title,
        percentage,
        topicsCount: rawTopics.filter(t => t.unit_id === u.id).length,
        materialsCount: unitDocs.length
      };
    });

    const matCount = (materials || []).filter(m => m.document_type === 'study-material').length;
    const pyqCount = (materials || []).filter(m => m.document_type === 'pyq').length;

    return jsonResponse({
      success: true,
      subject: {
        id: subject.id,
        name: subject.name,
        code: subject.code || '',
        slug: subject.slug,
        semester: Number(subject.semester),
        credits: subject.semester <= 2 ? 3 : 4,
        status: subject.status,
        isActive: Boolean(subject.is_active),
        branchId: subject.branch_id,
        branchName: subject.branch_name,
        branchShort: subject.branch_short || subject.branch_code,
        universityId: subject.university_id,
        universityName: subject.university_name,
        universityShort: subject.university_short,
        academicYear: subject.wef_year ? `${subject.wef_year}-${String(subject.wef_year + 1).slice(-2)}` : '2026-27',
        syllabusLink: subject.syllabus_link || '',
        materialsCount: matCount,
        pyqsCount: pyqCount,
        unitsCount: rawUnits ? rawUnits.length : 0,
        createdAt: subject.created_at,
        updatedAt: subject.updated_at
      },
      units: rawUnits || [],
      topics: rawTopics || [],
      unitsBreakdown,
      recentMaterials: materials || []
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
      code?: string;
      semester?: number;
      branchId?: string;
      branch_id?: string;
      syllabusLink?: string;
      syllabus_link?: string;
      isActive?: boolean;
      status?: string;
    };

    const existing = await env.DB.prepare(`SELECT id FROM subjects WHERE id = ?`).bind(id).first();
    if (!existing) {
      return errorResponse("Subject not found", 404);
    }

    let isActiveVal = 1;
    if (body.isActive !== undefined) {
      isActiveVal = body.isActive ? 1 : 0;
    } else if (body.status !== undefined) {
      isActiveVal = body.status.toLowerCase() === "active" ? 1 : 0;
    }

    await env.DB.prepare(`
      UPDATE subjects SET
        name = COALESCE(?, name),
        code = COALESCE(?, code),
        semester = COALESCE(?, semester),
        branch_id = COALESCE(?, branch_id),
        syllabus_link = COALESCE(?, syllabus_link),
        is_active = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      body.name || null,
      body.code || null,
      body.semester !== undefined ? Number(body.semester) : null,
      body.branchId || body.branch_id || null,
      body.syllabusLink || body.syllabus_link || null,
      isActiveVal,
      id
    ).run();

    await recordAdminAuditLog(
      env as any,
      user.email || user.uid,
      "SUBJECT_UPDATE",
      "subject",
      id,
      { ...body, isActive: Boolean(isActiveVal) }
    );

    return jsonResponse({
      success: true,
      message: `Subject updated successfully`
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update subject";
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
    const docCount = await env.DB.prepare(`SELECT COUNT(*) as c FROM documents WHERE subject_id = ?`).bind(id).first<{ c: number }>();
    const documents = Number(docCount?.c || 0);

    if (hardDelete) {
      await env.DB.prepare(`DELETE FROM subjects WHERE id = ?`).bind(id).run();
      await recordAdminAuditLog(
        env as any,
        user.email || user.uid,
        "SUBJECT_DELETE_HARD",
        "subject",
        id,
        { affectedDocuments: documents }
      );
      return jsonResponse({
        success: true,
        message: `Subject and associated records deleted`
      });
    }

    // Soft deactivate
    await env.DB.prepare(`UPDATE subjects SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(id).run();
    await recordAdminAuditLog(
      env as any,
      user.email || user.uid,
      "SUBJECT_DEACTIVATE",
      "subject",
      id,
      { affectedDocuments: documents }
    );

    return jsonResponse({
      success: true,
      message: `Subject deactivated successfully`,
      impact: {
        affectedDocuments: documents
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete subject";
    return errorResponse(message, 500);
  }
}
