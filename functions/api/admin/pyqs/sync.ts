// ============================================================
// ADMIN API: POST & GET /api/admin/pyqs/sync
// ============================================================
// Handles discovery and synchronization of GTU Question Papers.
// Strictly protected by admin authorization.

import { jsonResponse, errorResponse } from "../../../lib/json";
import { executeGtuPyqIngestion, generateDiscoveryTargets, DiscoveredPaperMetadata } from "../../../lib/gtuPyqDiscoveryEngine";
import { KNOWN_GTU_CANONICAL_CLUSTERS } from "../../../lib/canonicalSubjectEngine";
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

  try {
    const { results: logs } = await env.DB.prepare(
      `SELECT * FROM gtu_sync_logs ORDER BY sync_started_at DESC LIMIT 20`
    ).all<any>();

    const paperCounts = await env.DB.prepare(
      `SELECT 
         COUNT(*) AS total_papers,
         COUNT(DISTINCT canonical_subject_id) AS total_canonical_subjects,
         COUNT(DISTINCT subject_code) AS total_subject_codes,
         SUM(CASE WHEN verification_status = 'verified' THEN 1 ELSE 0 END) AS verified_papers,
         SUM(CASE WHEN verification_status = 'broken' THEN 1 ELSE 0 END) AS broken_papers,
         SUM(CASE WHEN verification_status = 'unverified' THEN 1 ELSE 0 END) AS unverified_papers
       FROM gtu_question_papers WHERE is_active = 1`
    ).first<any>();

    const pendingReviewCount = await env.DB.prepare(
      `SELECT COUNT(*) AS count FROM gtu_subject_mappings WHERE mapping_status = 'needs_review'`
    ).first<{ count: number }>();

    const lastLog = logs && logs.length > 0 ? logs[0] : null;

    return jsonResponse({
      logs: logs || [],
      stats: {
        candidateUrls: lastLog?.candidates_generated ?? paperCounts?.total_papers ?? 0,
        discoveredUrls: lastLog?.discovered_count ?? paperCounts?.total_papers ?? 0,
        verifiedUrls: paperCounts?.verified_papers || 0,
        brokenUrls: paperCounts?.broken_papers || 0,
        unverifiedUrls: paperCounts?.unverified_papers || 0,
        indexedPapers: paperCounts?.total_papers || 0,
        totalCanonicalSubjects: paperCounts?.total_canonical_subjects || 0,
        totalSubjectCodes: paperCounts?.total_subject_codes || 0,
        pendingReviewCount: pendingReviewCount?.count || 0,
        // Backward-compatibility aliases
        totalPapers: paperCounts?.total_papers || 0,
        verifiedPapers: paperCounts?.verified_papers || 0,
        brokenPapers: paperCounts?.broken_papers || 0,
        unverifiedPapers: paperCounts?.unverified_papers || 0,
      },
    });
  } catch (err: any) {
    return errorResponse(err.message || "Failed to fetch sync statistics", 500);
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
    const body = await request.json().catch(() => ({})) as any;
    const branchSlug = body.branchSlug || "";
    const semester = body.semester ? Number(body.semester) : null;
    const startYear = body.startYear ? Number(body.startYear) : 2018;
    const endYear = body.endYear ? Number(body.endYear) : 2026;
    const verifyUrls = Boolean(body.verifyUrls);
    const customCodes: string[] = Array.isArray(body.subjectCodes) ? body.subjectCodes : [];

    // 1. Gather Subject Codes to sync
    let targetSubjects: Array<{
      code: string;
      name: string;
      branchSlug: string;
      semester: number;
      degree?: string;
    }> = [];

    if (customCodes.length > 0) {
      // Find names from subjects table or use provided code
      for (const code of customCodes) {
        const dbSub = await env.DB.prepare(
          `SELECT s.name, s.semester, b.slug AS branch_slug 
           FROM subjects s
           JOIN branches b ON b.id = s.branch_id
           WHERE s.code = ?`
        ).bind(code).first<any>();

        targetSubjects.push({
          code,
          name: dbSub?.name || `Subject ${code}`,
          branchSlug: dbSub?.branch_slug || branchSlug || 'computer-engineering',
          semester: dbSub?.semester ?? semester ?? 1,
          degree: 'BE',
        });
      }
    } else {
      // Fetch active subjects from subjects database
      let subQuery = `
        SELECT s.code, s.name, s.semester, b.slug AS branch_slug
        FROM subjects s
        JOIN branches b ON b.id = s.branch_id
        WHERE s.code IS NOT NULL AND s.code != ''
      `;
      const params: any[] = [];

      if (branchSlug) {
        subQuery += ` AND (b.slug = ? OR b.id = ? OR b.code = ?)`;
        params.push(branchSlug, branchSlug, branchSlug);
      }
      if (semester !== null && Number.isFinite(semester)) {
        subQuery += ` AND s.semester = ?`;
        params.push(semester);
      }

      subQuery += ` LIMIT 500`;

      const { results: dbSubs } = await env.DB.prepare(subQuery).bind(...params).all<any>();

      if (dbSubs && dbSubs.length > 0) {
        targetSubjects = dbSubs.map((s) => ({
          code: s.code,
          name: s.name,
          branchSlug: s.branch_slug,
          semester: s.semester,
          degree: 'BE',
        }));
      }

      // Also ensure known GTU clusters (like Power System - I) are included
      for (const cluster of KNOWN_GTU_CANONICAL_CLUSTERS) {
        for (const code of cluster.codes) {
          if (!targetSubjects.some((t) => t.code === code)) {
            targetSubjects.push({
              code,
              name: cluster.canonicalName,
              branchSlug: cluster.branchSlugs[0],
              semester: cluster.semester,
              degree: 'BE',
            });
          }
        }
      }
    }

    if (targetSubjects.length === 0) {
      return errorResponse("No subjects found matching sync criteria", 400);
    }

    // 2. Generate Discovery Targets
    const targets = generateDiscoveryTargets(targetSubjects, startYear, endYear);

    // 3. Execute Discovery & Ingestion
    const syncResult = await executeGtuPyqIngestion(env.DB, targets, {
      verifyUrls,
      startYear,
      endYear,
    });

    return jsonResponse({
      success: true,
      message: `GTU PYQ Sync completed. Found ${syncResult.totalFound} papers, inserted ${syncResult.inserted} new records.`,
      result: syncResult,
    });
  } catch (err: any) {
    return errorResponse(err.message || "Failed to execute GTU PYQ Sync", 500);
  }
}
