// ============================================================
// GET /api/admin/question-intelligence/curriculum
// Curriculum Mapping Center & Mapping Backlog Review Queue
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
    const status = url.searchParams.get('status') || undefined;

    // Mapping Status Distribution based on master_question_bank curriculum columns
    const statusRow = await context.env.DB.prepare(
      `SELECT 
        COUNT(*) as total_mappings,
        SUM(CASE WHEN unit_no IS NOT NULL AND topic_name IS NOT NULL THEN 1 ELSE 0 END) as auto_mapped_count,
        SUM(CASE WHEN unit_no IS NULL OR topic_name IS NULL THEN 1 ELSE 0 END) as review_required_count,
        SUM(CASE WHEN canonical_subject_id IS NULL THEN 1 ELSE 0 END) as unmapped_count
       FROM master_question_bank`
    ).first<{
      total_mappings: number;
      auto_mapped_count: number;
      review_required_count: number;
      unmapped_count: number;
    }>();

    // Subject-wise mapping breakdown
    const subjectBreakdown = await context.env.DB.prepare(
      `SELECT 
        subject_code,
        COUNT(*) as total,
        SUM(CASE WHEN unit_no IS NOT NULL AND topic_name IS NOT NULL THEN 1 ELSE 0 END) as auto_mapped,
        SUM(CASE WHEN unit_no IS NULL OR topic_name IS NULL THEN 1 ELSE 0 END) as review_required,
        SUM(CASE WHEN canonical_subject_id IS NULL THEN 1 ELSE 0 END) as unmapped
       FROM master_question_bank
       GROUP BY subject_code`
    ).all<Record<string, unknown>>();

    // Query questions requiring review or unmapped
    let sql = `
      SELECT 
        q.id, q.question_text, q.question_type, q.subject_code, q.subject_name,
        q.verification_status, q.is_original_pyq,
        q.unit_no, q.topic_name, q.tags_json as concept_tags_json
      FROM master_question_bank q
      WHERE 1=1
    `;
    const params: any[] = [];

    if (subjectCode) {
      sql += ` AND q.subject_code = ?`;
      params.push(subjectCode);
    }

    if (status === 'AUTO_MAPPED') {
      sql += ` AND q.unit_no IS NOT NULL AND q.topic_name IS NOT NULL`;
    } else if (status === 'UNMAPPED') {
      sql += ` AND q.canonical_subject_id IS NULL`;
    } else {
      sql += ` AND (q.unit_no IS NULL OR q.topic_name IS NULL)`;
    }

    sql += ` ORDER BY q.created_at DESC LIMIT 30`;

    const reviewRows = await context.env.DB.prepare(sql).bind(...params).all<Record<string, unknown>>();

    const reviewItems = (reviewRows.results || []).map(r => {
      let concepts: string[] = [];
      if (r.concept_tags_json) {
        try {
          concepts = JSON.parse(String(r.concept_tags_json));
        } catch {
          concepts = [];
        }
      }
      return {
        questionId: r.id,
        questionText: r.question_text,
        questionType: r.question_type,
        subjectCode: r.subject_code,
        subjectName: r.subject_name,
        verificationStatus: r.verification_status,
        unitNo: r.unit_no || 1,
        unitName: r.unit_no ? `Unit ${r.unit_no}` : 'Unassigned',
        topicName: r.topic_name || 'Unassigned',
        conceptTags: concepts,
        mappingConfidence: r.unit_no && r.topic_name ? 0.95 : 0.4,
        mappingStatus: r.unit_no && r.topic_name ? 'AUTO_MAPPED' : 'REVIEW_REQUIRED',
        mappedBy: 'SYSTEM',
      };
    });

    const totalM = Number(statusRow?.total_mappings || 0);
    const autoM = Number(statusRow?.auto_mapped_count || 0);
    const coveragePercentage = totalM > 0 ? Math.round((autoM / totalM) * 100) : 0;

    return jsonResponse({
      success: true,
      summary: {
        totalMappings: totalM,
        coveragePercentage,
        distribution: {
          autoMapped: autoM,
          reviewRequired: Number(statusRow?.review_required_count || 0),
          unmapped: Number(statusRow?.unmapped_count || 0),
        },
      },
      subjectBreakdown: subjectBreakdown.results || [],
      reviewQueue: reviewItems,
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch curriculum intelligence', 500);
  }
}
