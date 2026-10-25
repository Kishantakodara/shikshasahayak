// ============================================================
// ADMIN API: /api/admin/pyqs/canonical-subjects
// ============================================================
// Manage Canonical Subjects: Create, Update, Merge, and Inspect.

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

  const branchId = url.searchParams.get("branchId") || "";
  const semester = url.searchParams.get("semester");
  const search = url.searchParams.get("search") || "";

  try {
    let sql = `
      SELECT 
        cs.id,
        cs.canonical_name,
        cs.normalized_name,
        cs.aliases,
        cs.semester,
        cs.degree,
        cs.branch_id,
        cs.status,
        cs.created_at,
        cs.updated_at,
        b.name AS branch_name,
        b.slug AS branch_slug,
        (SELECT COUNT(*) FROM gtu_subject_mappings sm WHERE sm.canonical_subject_id = cs.id) AS code_count,
        (SELECT COUNT(*) FROM gtu_question_papers qp WHERE qp.canonical_subject_id = cs.id) AS paper_count
      FROM canonical_subjects cs
      JOIN branches b ON b.id = cs.branch_id
      WHERE cs.status = 'active'
    `;
    const params: any[] = [];

    if (branchId) {
      sql += ` AND (cs.branch_id = ? OR b.slug = ?)`;
      params.push(branchId, branchId);
    }

    if (semester !== null && semester !== undefined && semester !== '') {
      sql += ` AND cs.semester = ?`;
      params.push(Number(semester));
    }

    if (search) {
      const q = `%${search.toLowerCase()}%`;
      sql += ` AND (LOWER(cs.canonical_name) LIKE ? OR LOWER(cs.normalized_name) LIKE ?)`;
      params.push(q, q);
    }

    sql += ` ORDER BY cs.semester ASC, cs.canonical_name ASC`;

    const { results } = await env.DB.prepare(sql).bind(...params).all<any>();

    const formatted = (results || []).map((r) => ({
      ...r,
      aliases: r.aliases ? JSON.parse(r.aliases) : [],
    }));

    return jsonResponse({
      canonicalSubjects: formatted,
      total: formatted.length,
    });
  } catch (err: any) {
    return errorResponse(err.message || "Failed to fetch canonical subjects", 500);
  }
}

export async function onRequestPost(context: {
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
    const { canonicalName, branchId, semester, degree = 'BE', aliases = [] } = body;

    if (!canonicalName || !branchId || semester === undefined) {
      return errorResponse("Missing required fields: canonicalName, branchId, semester", 400);
    }

    const normName = normalizeSubjectName(canonicalName);
    const id = `cs_${branchId}_sem${semester}_${normName.replace(/[^a-z0-9]+/g, '_')}`.slice(0, 60);

    await env.DB.prepare(
      `INSERT INTO canonical_subjects (id, university_id, degree, branch_id, semester, canonical_name, normalized_name, aliases, status)
       VALUES (?, 'gtu', ?, ?, ?, ?, ?, ?, 'active')
       ON CONFLICT(id) DO UPDATE SET
         canonical_name = excluded.canonical_name,
         aliases = excluded.aliases,
         updated_at = CURRENT_TIMESTAMP`
    )
      .bind(id, degree, branchId, Number(semester), canonicalName.trim(), normName, JSON.stringify(aliases))
      .run();

    return jsonResponse({
      success: true,
      message: `Canonical subject "${canonicalName}" created/updated successfully`,
      canonicalSubject: {
        id,
        canonicalName,
        normalizedName: normName,
        branchId,
        semester,
      },
    });
  } catch (err: any) {
    return errorResponse(err.message || "Failed to create canonical subject", 500);
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
    const { action, sourceCanonicalSubjectId, targetCanonicalSubjectId, canonicalName, aliases } = body;

    // Merge one canonical subject into another
    if (action === 'merge') {
      if (!sourceCanonicalSubjectId || !targetCanonicalSubjectId) {
        return errorResponse("Missing sourceCanonicalSubjectId or targetCanonicalSubjectId", 400);
      }

      if (sourceCanonicalSubjectId === targetCanonicalSubjectId) {
        return errorResponse("Source and target subjects cannot be the same", 400);
      }

      // Move all subject mappings from source to target
      await env.DB.prepare(
        `UPDATE gtu_subject_mappings 
         SET canonical_subject_id = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE canonical_subject_id = ?`
      ).bind(targetCanonicalSubjectId, sourceCanonicalSubjectId).run();

      // Move all question papers from source to target
      await env.DB.prepare(
        `UPDATE gtu_question_papers 
         SET canonical_subject_id = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE canonical_subject_id = ?`
      ).bind(targetCanonicalSubjectId, sourceCanonicalSubjectId).run();

      // Mark source as merged
      await env.DB.prepare(
        `UPDATE canonical_subjects 
         SET status = 'merged', updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`
      ).bind(sourceCanonicalSubjectId).run();

      return jsonResponse({
        success: true,
        message: `Successfully merged "${sourceCanonicalSubjectId}" into "${targetCanonicalSubjectId}"`,
      });
    }

    // Update canonical subject name / aliases
    if (body.id && canonicalName) {
      const normName = normalizeSubjectName(canonicalName);
      await env.DB.prepare(
        `UPDATE canonical_subjects 
         SET canonical_name = ?, normalized_name = ?, aliases = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`
      )
        .bind(canonicalName.trim(), normName, JSON.stringify(aliases || []), body.id)
        .run();

      return jsonResponse({ success: true, message: "Canonical subject updated" });
    }

    return errorResponse("Invalid request payload", 400);
  } catch (err: any) {
    return errorResponse(err.message || "Failed to update canonical subject", 500);
  }
}
