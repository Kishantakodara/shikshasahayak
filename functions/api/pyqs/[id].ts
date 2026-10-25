// ============================================================
// PUBLIC API: GET /api/pyqs/:id
// ============================================================
// Fetches detailed information about a specific question paper or
// canonical subject by ID with its official GTU URL and sibling codes.

import { jsonResponse, errorResponse } from "../../lib/json";
import { convertLegacyGtuUrl } from "../../lib/gtuPyqDiscoveryEngine";

export async function onRequestGet(context: {
  request: Request;
  env: { DB: D1Database };
  params: { id?: string };
}) {
  const { env, params } = context;
  const id = params.id;

  if (!id) {
    return errorResponse("Missing ID parameter", 400);
  }

  try {
    // 1. Try finding as a single question paper first
    const idParam = id;
    const legacyUrl = idParam.includes('/api/v1/question-papers/archive/file/')
      ? idParam.replace('https://www.gtu.ac.in/api/v1/question-papers/archive/file/', 'https://gtu.ac.in/uploads/')
      : idParam;
    const newUrl = convertLegacyGtuUrl(idParam);

    const paper = await env.DB.prepare(
      `SELECT 
         p.id,
         p.canonical_subject_id,
         p.gtu_subject_mapping_id,
         p.subject_code,
         p.title,
         p.official_subject_name,
         p.degree,
         p.branch_id,
         p.semester,
         p.exam_year,
         p.exam_session,
         p.source,
         p.source_url,
         p.canonical_url,
         p.verification_status,
         p.first_discovered_at,
         p.last_seen_at,
         cs.canonical_name,
         b.slug AS branch_slug,
         b.name AS branch_name,
         b.short_name AS branch_short_name
       FROM gtu_question_papers p
       JOIN canonical_subjects cs ON cs.id = p.canonical_subject_id
       JOIN branches b ON b.id = p.branch_id
       WHERE p.id = ? OR p.source_url = ? OR p.canonical_url = ? OR p.source_url = ? OR p.canonical_url = ?`
    )
      .bind(idParam, idParam, idParam, legacyUrl, newUrl)
      .first<any>();

    if (paper) {
      // Find sibling codes for this canonical subject
      const { results: siblingCodes } = await env.DB.prepare(
        `SELECT subject_code, official_subject_name, syllabus_version, effective_year
         FROM gtu_subject_mappings
         WHERE canonical_subject_id = ?`
      )
        .bind(paper.canonical_subject_id)
        .all<any>();

      return jsonResponse({
        type: 'paper',
        paper: {
          id: paper.id,
          title: paper.title,
          canonicalSubjectId: paper.canonical_subject_id,
          canonicalName: paper.canonical_name,
          subjectCode: paper.subject_code,
          officialSubjectName: paper.official_subject_name,
          degree: paper.degree,
          branchSlug: paper.branch_slug,
          branchName: paper.branch_name,
          branchShortName: paper.branch_short_name,
          semester: paper.semester,
          examYear: paper.exam_year,
          examSession: paper.exam_session,
          sessionLabel: paper.exam_session === 'WINTER' ? `Winter ${paper.exam_year}` : `Summer ${paper.exam_year}`,
          source: 'Gujarat Technological University (GTU)',
          sourceUrl: convertLegacyGtuUrl(paper.source_url),
          canonicalUrl: convertLegacyGtuUrl(paper.canonical_url),
          verificationStatus: paper.verification_status,
          siblingSubjectCodes: siblingCodes || [],
        },
      });
    }

    // 2. Try finding as a canonical subject ID
    const canonical = await env.DB.prepare(
      `SELECT 
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
       WHERE cs.id = ?`
    )
      .bind(id)
      .first<any>();

    if (!canonical) {
      return errorResponse("Question paper or canonical subject not found", 404);
    }

    // Fetch mapped codes
    const { results: codes } = await env.DB.prepare(
      `SELECT id, subject_code, official_subject_name, syllabus_version, effective_year, mapping_status
       FROM gtu_subject_mappings
       WHERE canonical_subject_id = ?
       ORDER BY effective_year DESC NULLS LAST, subject_code ASC`
    )
      .bind(canonical.id)
      .all<any>();

    // Fetch papers
    const { results: papers } = await env.DB.prepare(
      `SELECT id, subject_code, title, exam_year, exam_session, source_url, canonical_url, verification_status
       FROM gtu_question_papers
       WHERE canonical_subject_id = ? AND is_active = 1
       ORDER BY exam_year DESC, CASE exam_session WHEN 'WINTER' THEN 0 ELSE 1 END`
    )
      .bind(canonical.id)
      .all<any>();

    return jsonResponse({
      type: 'canonical_subject',
      canonicalSubject: {
        id: canonical.id,
        canonicalName: canonical.canonical_name,
        normalizedName: canonical.normalized_name,
        aliases: canonical.aliases ? JSON.parse(canonical.aliases) : [],
        degree: canonical.degree,
        branchSlug: canonical.branch_slug,
        branchName: canonical.branch_name,
        branchShortName: canonical.branch_short_name,
        semester: canonical.semester,
        subjectCodes: (codes || []).map((c) => ({
          ...c,
          papers: (papers || [])
            .filter((p) => p.subject_code === c.subject_code)
            .map((p) => ({
              ...p,
              source_url: convertLegacyGtuUrl(p.source_url),
              canonical_url: convertLegacyGtuUrl(p.canonical_url),
            })),
        })),
        totalPapers: papers?.length || 0,
      },
    });
  } catch (err: any) {
    return errorResponse(err.message || "Failed to fetch resource", 500);
  }
}
