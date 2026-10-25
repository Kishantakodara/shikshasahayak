// ============================================================
// GET /api/admin/question-intelligence/quality
// Question Quality Center Analytics & Flagged Item Inspection
// ============================================================

import { getAuthenticatedUser, isAdmin } from '../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../lib/json';

export async function onRequestGet(context: { request: Request; env: WorkerBindings }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
    if (!isAdmin(user.email, user.role) && user.role !== "admin" && user.role !== "reviewer") {
      return errorResponse('Forbidden: Admin or Reviewer access required', 403);
    }

    const url = new URL(context.request.url);
    const subjectCode = url.searchParams.get('subjectCode') || undefined;
    const qualityBand = url.searchParams.get('qualityBand') || undefined;
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));

    // Quality Score Distribution
    let distRow = {
      total_scored: 0,
      avg_score: 85,
      high_quality_count: 0,
      acceptable_count: 0,
      needs_review_count: 0,
      poor_count: 0,
    };

    let flaggedRows: { results?: Record<string, unknown>[] } = { results: [] };

    try {
      const qmRow = await context.env.DB.prepare(
        `SELECT 
          COUNT(*) as total_scored,
          AVG(quality_score) as avg_score,
          SUM(CASE WHEN quality_band = 'EXCELLENT' OR quality_band = 'HIGH_QUALITY' THEN 1 ELSE 0 END) as high_quality_count,
          SUM(CASE WHEN quality_band = 'GOOD' OR quality_band = 'ACCEPTABLE' THEN 1 ELSE 0 END) as acceptable_count,
          SUM(CASE WHEN quality_band = 'WATCH' OR quality_band = 'NEEDS_REVIEW' THEN 1 ELSE 0 END) as needs_review_count,
          SUM(CASE WHEN quality_band = 'CRITICAL' OR quality_band = 'POOR' THEN 1 ELSE 0 END) as poor_count
         FROM question_quality_metrics`
      ).first<{
        total_scored: number;
        avg_score: number;
        high_quality_count: number;
        acceptable_count: number;
        needs_review_count: number;
        poor_count: number;
      }>();

      if (qmRow && Number(qmRow.total_scored) > 0) {
        distRow = qmRow;
        let sql = `
          SELECT 
            q.id, q.question_text, q.question_type, q.subject_code, q.subject_name,
            q.verification_status, q.is_original_pyq, q.exam_session, q.exam_year,
            m.quality_score as overall_score, m.quality_band, m.sample_confidence_band as confidence_band, m.health_flags_json as flags_json
          FROM master_question_bank q
          JOIN question_quality_metrics m ON q.id = m.question_id
          WHERE 1=1
        `;
        const params: any[] = [];
        if (subjectCode) {
          sql += ` AND q.subject_code = ?`;
          params.push(subjectCode);
        }
        if (qualityBand) {
          sql += ` AND m.quality_band = ?`;
          params.push(qualityBand);
        }
        sql += ` ORDER BY m.quality_score ASC LIMIT ?`;
        params.push(limit);
        flaggedRows = await context.env.DB.prepare(sql).bind(...params).all<Record<string, unknown>>();
      } else {
        throw new Error('Fallback to MQB');
      }
    } catch {
      // Fallback: derive quality directly from master_question_bank completeness
      const mqbSummary = await context.env.DB.prepare(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN explanation IS NOT NULL AND LENGTH(TRIM(explanation)) > 10 THEN 1 ELSE 0 END) as with_exp
         FROM master_question_bank`
      ).first<{ total: number; with_exp: number }>();

      const tot = Number(mqbSummary?.total || 0);
      const withExp = Number(mqbSummary?.with_exp || 0);
      distRow = {
        total_scored: tot,
        avg_score: tot > 0 ? (withExp / tot) * 100 : 85,
        high_quality_count: withExp,
        acceptable_count: 0,
        needs_review_count: tot - withExp,
        poor_count: 0,
      };

      let sql = `
        SELECT 
          q.id, q.question_text, q.question_type, q.subject_code, q.subject_name,
          q.verification_status, q.is_original_pyq, q.exam_session, q.exam_year,
          CASE WHEN q.explanation IS NOT NULL AND LENGTH(TRIM(q.explanation)) > 10 THEN 90.0 ELSE 50.0 END as overall_score,
          CASE WHEN q.explanation IS NOT NULL AND LENGTH(TRIM(q.explanation)) > 10 THEN 'HIGH_QUALITY' ELSE 'NEEDS_REVIEW' END as quality_band,
          'HIGH' as confidence_band,
          '[]' as flags_json
        FROM master_question_bank q
        WHERE 1=1
      `;
      const params: any[] = [];
      if (subjectCode) {
        sql += ` AND q.subject_code = ?`;
        params.push(subjectCode);
      }
      if (qualityBand === 'NEEDS_REVIEW') {
        sql += ` AND (q.explanation IS NULL OR LENGTH(TRIM(q.explanation)) <= 10)`;
      } else if (qualityBand === 'HIGH_QUALITY') {
        sql += ` AND (q.explanation IS NOT NULL AND LENGTH(TRIM(q.explanation)) > 10)`;
      }
      sql += ` ORDER BY q.created_at DESC LIMIT ?`;
      params.push(limit);
      flaggedRows = await context.env.DB.prepare(sql).bind(...params).all<Record<string, unknown>>();
    }

    const items = (flaggedRows.results || []).map(r => {
      let flags: string[] = [];
      if (r.flags_json) {
        try {
          flags = JSON.parse(String(r.flags_json));
        } catch {
          flags = [];
        }
      }
      return {
        id: r.id,
        questionText: r.question_text,
        questionType: r.question_type,
        subjectCode: r.subject_code,
        subjectName: r.subject_name,
        verificationStatus: r.verification_status,
        isOriginalPyq: Number(r.is_original_pyq) === 1,
        examSession: r.exam_session,
        examYear: r.exam_year,
        overallScore: Number(r.overall_score || 0),
        qualityBand: r.quality_band,
        confidenceBand: r.confidence_band,
        flags,
      };
    });

    return jsonResponse({
      success: true,
      summary: {
        totalScored: Number(distRow?.total_scored || 0),
        averageScore: Number(distRow?.avg_score || 0).toFixed(1),
        distribution: {
          highQuality: Number(distRow?.high_quality_count || 0),
          acceptable: Number(distRow?.acceptable_count || 0),
          needsReview: Number(distRow?.needs_review_count || 0),
          poor: Number(distRow?.poor_count || 0),
        },
      },
      flaggedItems: items,
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch quality intelligence', 500);
  }
}
