// ============================================================
// PUBLIC API: GET /api/pyqs/canonical-tree
// ============================================================
// Returns the Canonical ShikshaSahayak Subject -> GTU Subject Code ->
// Exam Year/Session -> Official GTU PDF URL hierarchy.

import { jsonResponse, errorResponse } from "../../lib/json";
import { convertLegacyGtuUrl } from "../../lib/gtuPyqDiscoveryEngine";

export async function onRequestGet(context: {
  request: Request;
  env: { DB: D1Database };
}) {
  const { request, env } = context;
  const url = new URL(request.url);

  const branchSlug = url.searchParams.get("branch") || url.searchParams.get("branchSlug") || "";
  const semParam = url.searchParams.get("semester") || url.searchParams.get("sem") || "";
  const semester = semParam ? (semParam === '1-or-2-common' ? 0 : Number(semParam)) : null;
  const query = url.searchParams.get("query") || url.searchParams.get("q") || "";
  const codeFilter = url.searchParams.get("code") || "";
  const limit = Math.min(Number(url.searchParams.get("limit") || 50), 100);

  try {
    // 1. Fetch Canonical Subjects matching filters
    let sql = `
      SELECT 
        cs.id,
        cs.canonical_name,
        cs.normalized_name,
        cs.aliases,
        cs.semester,
        cs.degree,
        cs.branch_id,
        b.slug AS branch_slug,
        b.name AS branch_name,
        b.short_name AS branch_short_name
      FROM canonical_subjects cs
      JOIN branches b ON b.id = cs.branch_id
      WHERE cs.status = 'active'
    `;
    const params: any[] = [];

    if (branchSlug) {
      sql += ` AND (b.slug = ? OR b.id = ? OR b.code = ?)`;
      params.push(branchSlug, branchSlug, branchSlug);
    }

    if (semester !== null && Number.isFinite(semester)) {
      sql += ` AND cs.semester = ?`;
      params.push(semester);
    }

    if (query) {
      const qWildcard = `%${query.toLowerCase()}%`;
      sql += ` AND (
        LOWER(cs.canonical_name) LIKE ? OR
        LOWER(cs.normalized_name) LIKE ? OR
        EXISTS (
          SELECT 1 FROM gtu_subject_mappings sm
          WHERE sm.canonical_subject_id = cs.id
            AND (LOWER(sm.subject_code) LIKE ? OR LOWER(sm.official_subject_name) LIKE ?)
        )
      )`;
      params.push(qWildcard, qWildcard, qWildcard, qWildcard);
    }

    if (codeFilter) {
      sql += ` AND EXISTS (
        SELECT 1 FROM gtu_subject_mappings sm
        WHERE sm.canonical_subject_id = cs.id AND sm.subject_code = ?
      )`;
      params.push(codeFilter);
    }

    sql += ` ORDER BY cs.semester ASC, cs.canonical_name ASC LIMIT ?`;
    params.push(limit);

    const { results: canonicalRows } = await env.DB.prepare(sql).bind(...params).all<any>();

    if (!canonicalRows || canonicalRows.length === 0) {
      return jsonResponse({
        canonicalSubjects: [],
        total: 0,
      });
    }

    const canonicalIds = canonicalRows.map((r) => r.id);
    const placeholders = canonicalIds.map(() => "?").join(",");

    // 2. Fetch all mapped GTU Subject Codes for these canonical subjects
    const { results: mappingRows } = await env.DB.prepare(
      `SELECT 
         sm.id,
         sm.canonical_subject_id,
         sm.subject_code,
         sm.official_subject_name,
         sm.syllabus_version,
         sm.effective_year,
         sm.mapping_status,
         sm.confidence
       FROM gtu_subject_mappings sm
       WHERE sm.canonical_subject_id IN (${placeholders})
       ORDER BY sm.effective_year DESC NULLS LAST, sm.subject_code ASC`
    )
      .bind(...canonicalIds)
      .all<any>();

    // 3. Fetch all active GTU Question Papers for these canonical subjects
    const { results: paperRows } = await env.DB.prepare(
      `SELECT 
         p.id,
         p.canonical_subject_id,
         p.gtu_subject_mapping_id,
         p.subject_code,
         p.title,
         p.official_subject_name,
         p.exam_year,
         p.exam_session,
         p.source,
         p.source_url,
         p.canonical_url,
         p.verification_status
       FROM gtu_question_papers p
       WHERE p.canonical_subject_id IN (${placeholders}) AND p.is_active = 1
       ORDER BY p.exam_year DESC, CASE p.exam_session WHEN 'WINTER' THEN 0 ELSE 1 END`
    )
      .bind(...canonicalIds)
      .all<any>();

    // 4. Assemble the Canonical Hierarchy
    // Canonical Subject -> Subject Codes -> Year/Session Papers
    const mappingsByCsId = new Map<string, any[]>();
    (mappingRows || []).forEach((m) => {
      if (!mappingsByCsId.has(m.canonical_subject_id)) {
        mappingsByCsId.set(m.canonical_subject_id, []);
      }
      mappingsByCsId.get(m.canonical_subject_id)!.push(m);
    });

    const papersByCode = new Map<string, any[]>();
    (paperRows || []).forEach((p) => {
      const key = `${p.canonical_subject_id}:${p.subject_code}`;
      if (!papersByCode.has(key)) {
        papersByCode.set(key, []);
      }
      const canonicalUrl = convertLegacyGtuUrl(p.canonical_url);
      const sourceUrl = convertLegacyGtuUrl(p.source_url);
      papersByCode.get(key)!.push({
        id: p.id,
        title: p.title,
        examYear: p.exam_year,
        examSession: p.exam_session,
        sessionLabel: p.exam_session === 'WINTER' ? `Winter ${p.exam_year}` : `Summer ${p.exam_year}`,
        source: 'Gujarat Technological University (GTU)',
        sourceUrl: sourceUrl || canonicalUrl,
        canonicalUrl: canonicalUrl || sourceUrl,
        verificationStatus: p.verification_status,
      });
    });

    const assembledTree = canonicalRows.map((cs) => {
      const mappedCodes = mappingsByCsId.get(cs.id) || [];
      
      const codesData = mappedCodes.map((m) => {
        const codePapersKey = `${cs.id}:${m.subject_code}`;
        const codePapers = papersByCode.get(codePapersKey) || [];

        const verifiedInCode = codePapers.filter((p) => p.verificationStatus === 'verified').length;

        return {
          id: m.id,
          subjectCode: m.subject_code,
          officialSubjectName: m.official_subject_name,
          syllabusVersion: m.syllabus_version || 'GTU Curriculum',
          effectiveYear: m.effective_year,
          mappingStatus: m.mapping_status,
          totalPapers: verifiedInCode,
          totalVerifiedPapers: verifiedInCode,
          totalIndexedPapers: codePapers.length,
          papers: codePapers,
        };
      });

      const totalVerifiedPapers = codesData.reduce((sum, c) => sum + c.totalVerifiedPapers, 0);
      const totalIndexedPapers = codesData.reduce((sum, c) => sum + c.totalIndexedPapers, 0);

      return {
        id: cs.id,
        canonicalName: cs.canonical_name,
        normalizedName: cs.normalized_name,
        aliases: cs.aliases ? JSON.parse(cs.aliases) : [],
        degree: cs.degree,
        branchId: cs.branch_id,
        branchSlug: cs.branch_slug,
        branchName: cs.branch_name,
        branchShortName: cs.branch_short_name,
        semester: cs.semester,
        totalSubjectCodes: codesData.length,
        totalPapers: totalVerifiedPapers,
        totalVerifiedPapers,
        totalIndexedPapers,
        subjectCodes: codesData,
      };
    });

    return jsonResponse({
      canonicalSubjects: assembledTree,
      total: assembledTree.length,
    }, {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300",
      },
    });
  } catch (err: any) {
    return errorResponse(err.message || "Failed to fetch canonical PYQ tree", 500);
  }
}
