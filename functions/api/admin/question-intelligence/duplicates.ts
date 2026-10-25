// ============================================================
// GET /api/admin/question-intelligence/duplicates
// Duplicate & Recurrence Intelligence for Admin Reviewers
// ============================================================

import { getAuthenticatedUser, isAdmin } from '../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../lib/json';
import { getSubjectRecurrenceIntelligence } from '../../../lib/questionIntelligence';

export async function onRequestGet(context: { request: Request; env: WorkerBindings }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
    if (!isAdmin(user.email, user.role) && user.role !== "admin" && user.role !== "reviewer") {
      return errorResponse('Forbidden: Admin or Reviewer access required', 403);
    }

    const url = new URL(context.request.url);
    const subjectCode = url.searchParams.get('subjectCode') || undefined;

    let summaryRow = {
      total_clusters: 0,
      very_high_count: 0,
      high_count: 0,
      medium_count: 0,
      unique_count: 0,
    };
    let clusterDetails: any[] = [];

    try {
      const sRow = await context.env.DB.prepare(
        `SELECT 
          COUNT(*) as total_clusters,
          SUM(CASE WHEN repeat_frequency_band = 'VERY_HIGH_REPEAT' THEN 1 ELSE 0 END) as very_high_count,
          SUM(CASE WHEN repeat_frequency_band = 'HIGH_REPEAT' THEN 1 ELSE 0 END) as high_count,
          SUM(CASE WHEN repeat_frequency_band = 'MEDIUM_REPEAT' THEN 1 ELSE 0 END) as medium_count,
          SUM(CASE WHEN repeat_frequency_band = 'LOW_REPEAT' OR repeat_frequency_band = 'UNIQUE' THEN 1 ELSE 0 END) as unique_count
         FROM question_duplicate_clusters`
      ).first<{
        total_clusters: number;
        very_high_count: number;
        high_count: number;
        medium_count: number;
        unique_count: number;
      }>();
      if (sRow) summaryRow = sRow;

      let sql = `
        SELECT 
          id, cluster_hash, canonical_question_text, subject_code, semester,
          total_occurrences, first_appeared_session, first_appeared_year,
          last_appeared_session, last_appeared_year, repeat_frequency_band
        FROM question_duplicate_clusters
        WHERE 1=1
      `;
      const params: any[] = [];
      if (subjectCode) {
        sql += ` AND subject_code = ?`;
        params.push(subjectCode);
      }
      sql += ` ORDER BY total_occurrences DESC LIMIT 30`;

      const clusters = await context.env.DB.prepare(sql).bind(...params).all<Record<string, unknown>>();

      clusterDetails = await Promise.all(
        (clusters.results || []).map(async (c) => {
          const members = await context.env.DB.prepare(
            `SELECT 
              m.question_id, m.similarity_score, m.exam_session, m.exam_year,
              q.question_text, q.verification_status, q.source_type, q.provenance_id as paper_id
             FROM question_duplicate_cluster_members m
             JOIN master_question_bank q ON m.question_id = q.id
             WHERE m.cluster_id = ?`
          )
            .bind(c.id)
            .all<Record<string, unknown>>();

          return {
            clusterId: c.id,
            canonicalQuestionText: c.canonical_question_text,
            subjectCode: c.subject_code,
            semester: Number(c.semester || 1),
            repeatCount: Number(c.total_occurrences || 1),
            repeatFrequencyBand: c.repeat_frequency_band,
            firstSeen: `${c.first_appeared_session || ''} ${c.first_appeared_year || ''}`.trim(),
            lastSeen: `${c.last_appeared_session || ''} ${c.last_appeared_year || ''}`.trim(),
            members: (members.results || []).map(m => ({
              questionId: m.question_id,
              questionText: m.question_text,
              session: `${m.exam_session || ''} ${m.exam_year || ''}`.trim(),
              verificationStatus: m.verification_status,
              similarityScore: Number(m.similarity_score || 1.0),
              sourcePaperId: m.paper_id,
            })),
          };
        })
      );
    } catch {
      // Fallback: derive duplicate clusters from parent_question_id links in master_question_bank
      const qSql = subjectCode
        ? `SELECT parent_question_id, COUNT(*) as cnt, MIN(question_text) as q_text, subject_code, semester FROM master_question_bank WHERE parent_question_id IS NOT NULL AND subject_code = ? GROUP BY parent_question_id LIMIT 30`
        : `SELECT parent_question_id, COUNT(*) as cnt, MIN(question_text) as q_text, subject_code, semester FROM master_question_bank WHERE parent_question_id IS NOT NULL GROUP BY parent_question_id LIMIT 30`;
      const qParams = subjectCode ? [subjectCode] : [];
      const fallbackRows = await context.env.DB.prepare(qSql).bind(...qParams).all<Record<string, unknown>>();
      const res = fallbackRows.results || [];
      summaryRow.total_clusters = res.length;
      clusterDetails = res.map((r, idx) => ({
        clusterId: `cluster_${r.parent_question_id || idx}`,
        canonicalQuestionText: String(r.q_text || ''),
        subjectCode: String(r.subject_code || ''),
        semester: Number(r.semester || 1),
        repeatCount: Number(r.cnt || 1),
        repeatFrequencyBand: Number(r.cnt || 1) > 3 ? 'HIGH_REPEAT' : 'MEDIUM_REPEAT',
        firstSeen: '',
        lastSeen: '',
        members: [],
      }));
    }

    return jsonResponse({
      success: true,
      summary: {
        totalClusters: Number(summaryRow?.total_clusters || 0),
        distribution: {
          veryHighRepeat: Number(summaryRow?.very_high_count || 0),
          highRepeat: Number(summaryRow?.high_count || 0),
          mediumRepeat: Number(summaryRow?.medium_count || 0),
          unique: Number(summaryRow?.unique_count || 0),
        },
      },
      clusters: clusterDetails,
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch duplicate intelligence', 500);
  }
}
