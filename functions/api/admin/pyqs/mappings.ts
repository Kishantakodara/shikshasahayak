// ============================================================
// ADMIN API: /api/admin/pyqs/mappings
// ============================================================
// Manage GTU Subject Code to Canonical Subject Mappings.
// Allows admin to review, approve, reassign, or create new canonical subjects.

import { jsonResponse, errorResponse } from "../../../lib/json";
import { normalizeSubjectName } from "../../../lib/canonicalSubjectEngine";
import { requireAdmin } from "../../../lib/auth";

export async function onRequestGet(context: {
  request: Request;
  env: { DB: D1Database };
}) {
  const { request, env } = context;

  const { errorResponse: authError } = await requireAdmin(request, env);
  if (authError) {
    return authError;
  }

  const url = new URL(request.url);

  const status = url.searchParams.get("status") || "all";
  const search = url.searchParams.get("search") || "";
  const branchId = url.searchParams.get("branchId") || "";
  const semester = url.searchParams.get("semester");
  const limit = Math.min(Number(url.searchParams.get("limit") || 100), 200);
  const offset = Number(url.searchParams.get("offset") || 0);

  try {
    let sql = `
      SELECT 
        sm.id,
        sm.canonical_subject_id,
        sm.subject_code,
        sm.official_subject_name,
        sm.degree,
        sm.branch_id,
        sm.semester,
        sm.syllabus_version,
        sm.effective_year,
        sm.aliases,
        sm.source,
        sm.confidence,
        sm.mapping_status,
        sm.created_at,
        sm.updated_at,
        cs.canonical_name,
        b.name AS branch_name,
        b.slug AS branch_slug,
        (SELECT COUNT(*) FROM gtu_question_papers qp WHERE qp.subject_code = sm.subject_code) AS paper_count
      FROM gtu_subject_mappings sm
      JOIN canonical_subjects cs ON cs.id = sm.canonical_subject_id
      JOIN branches b ON b.id = sm.branch_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status !== 'all') {
      sql += ` AND sm.mapping_status = ?`;
      params.push(status);
    }

    if (branchId) {
      sql += ` AND (sm.branch_id = ? OR b.slug = ?)`;
      params.push(branchId, branchId);
    }

    if (semester !== null && semester !== undefined && semester !== '') {
      sql += ` AND sm.semester = ?`;
      params.push(Number(semester));
    }

    if (search) {
      const q = `%${search.toLowerCase()}%`;
      sql += ` AND (
        LOWER(sm.subject_code) LIKE ? OR
        LOWER(sm.official_subject_name) LIKE ? OR
        LOWER(cs.canonical_name) LIKE ?
      )`;
      params.push(q, q, q);
    }

    sql += ` ORDER BY CASE sm.mapping_status WHEN 'needs_review' THEN 0 WHEN 'probable' THEN 1 ELSE 2 END, sm.updated_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const { results: mappings } = await env.DB.prepare(sql).bind(...params).all<any>();

    const totalCount = await env.DB.prepare(
      `SELECT COUNT(*) AS total FROM gtu_subject_mappings`
    ).first<{ total: number }>();

    return jsonResponse({
      mappings: mappings || [],
      total: totalCount?.total || 0,
      limit,
      offset,
    });
  } catch (err: any) {
    return errorResponse(err.message || "Failed to fetch mappings", 500);
  }
}

export async function onRequestPut(context: {
  request: Request;
  env: { DB: D1Database };
}) {
  const { request, env } = context;

  const { errorResponse: authError } = await requireAdmin(request, env);
  if (authError) {
    return authError;
  }

  try {
    const body = await request.json() as any;
    const { mappingId, action, targetCanonicalSubjectId, newCanonicalSubjectName } = body;

    if (!mappingId || !action) {
      return errorResponse("Missing mappingId or action", 400);
    }

    const mapping = await env.DB.prepare(
      `SELECT * FROM gtu_subject_mappings WHERE id = ?`
    ).bind(mappingId).first<any>();

    if (!mapping) {
      return errorResponse("Mapping not found", 404);
    }

    if (action === 'approve') {
      await env.DB.prepare(
        `UPDATE gtu_subject_mappings 
         SET mapping_status = 'confirmed', confidence = 1.0, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`
      ).bind(mappingId).run();

      return jsonResponse({ success: true, message: "Mapping approved" });
    }

    if (action === 'reassign') {
      if (!targetCanonicalSubjectId) {
        return errorResponse("targetCanonicalSubjectId is required for reassignment", 400);
      }

      const targetCs = await env.DB.prepare(
        `SELECT id, canonical_name FROM canonical_subjects WHERE id = ?`
      ).bind(targetCanonicalSubjectId).first<any>();

      if (!targetCs) {
        return errorResponse("Target canonical subject does not exist", 404);
      }

      // Update mapping
      await env.DB.prepare(
        `UPDATE gtu_subject_mappings 
         SET canonical_subject_id = ?, mapping_status = 'confirmed', confidence = 1.0, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`
      ).bind(targetCanonicalSubjectId, mappingId).run();

      // Update linked question papers
      await env.DB.prepare(
        `UPDATE gtu_question_papers 
         SET canonical_subject_id = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE subject_code = ?`
      ).bind(targetCanonicalSubjectId, mapping.subject_code).run();

      return jsonResponse({
        success: true,
        message: `Reassigned subject code ${mapping.subject_code} to "${targetCs.canonical_name}"`,
      });
    }

    if (action === 'create_new_subject') {
      const canonicalName = (newCanonicalSubjectName || mapping.official_subject_name || '').trim();
      if (!canonicalName) {
        return errorResponse("Canonical subject name is required", 400);
      }

      const normName = normalizeSubjectName(canonicalName);
      const newCsId = `cs_${mapping.branch_id}_sem${mapping.semester}_${normName.replace(/[^a-z0-9]+/g, '_')}`.slice(0, 60);

      await env.DB.prepare(
        `INSERT INTO canonical_subjects (id, university_id, degree, branch_id, semester, canonical_name, normalized_name, aliases, status)
         VALUES (?, 'gtu', ?, ?, ?, ?, ?, ?, 'active')
         ON CONFLICT(id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP`
      )
        .bind(
          newCsId,
          mapping.degree,
          mapping.branch_id,
          mapping.semester,
          canonicalName,
          normName,
          JSON.stringify([mapping.official_subject_name])
        )
        .run();

      // Update mapping
      await env.DB.prepare(
        `UPDATE gtu_subject_mappings 
         SET canonical_subject_id = ?, mapping_status = 'confirmed', confidence = 1.0, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`
      ).bind(newCsId, mappingId).run();

      // Update linked papers
      await env.DB.prepare(
        `UPDATE gtu_question_papers 
         SET canonical_subject_id = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE subject_code = ?`
      ).bind(newCsId, mapping.subject_code).run();

      return jsonResponse({
        success: true,
        message: `Created new canonical subject "${canonicalName}" and reassigned code ${mapping.subject_code}`,
        canonicalSubjectId: newCsId,
      });
    }

    if (action === 'reject') {
      await env.DB.prepare(
        `UPDATE gtu_subject_mappings 
         SET mapping_status = 'needs_review', updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`
      ).bind(mappingId).run();

      return jsonResponse({ success: true, message: "Mapping marked as rejected / needs review" });
    }

    return errorResponse(`Unknown action: ${action}`, 400);
  } catch (err: any) {
    return errorResponse(err.message || "Failed to update mapping", 500);
  }
}
