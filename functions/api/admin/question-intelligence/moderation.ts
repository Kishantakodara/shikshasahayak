// ============================================================
// GET /api/admin/question-intelligence/moderation
// Prioritized Moderation Workspace & Review Queue
// ============================================================

import { getAuthenticatedUser, isAdmin } from '../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../lib/json';
import { calculateModerationPriority } from '../../../lib/questionIntelligence';

export async function onRequestGet(context: { request: Request; env: WorkerBindings }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
    if (!isAdmin(user.email, user.role) && user.role !== "admin" && user.role !== "reviewer") {
      return errorResponse('Forbidden: Admin or Reviewer access required', 403);
    }

    const url = new URL(context.request.url);
    const subjectCode = url.searchParams.get('subjectCode') || undefined;
    const priorityTier = url.searchParams.get('priority') || undefined;
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '30', 10)));

    let sql = `
      SELECT 
        q.id, q.question_text, q.question_type, q.subject_code, q.subject_name,
        q.semester, q.unit_no, q.topic_name, q.difficulty, q.marks,
        q.options_json, q.is_original_pyq, q.is_ai_generated, q.source_type,
        q.provenance_id as paper_id, q.verification_status, q.created_at,
        CASE WHEN q.explanation IS NOT NULL AND LENGTH(TRIM(q.explanation)) > 10 THEN 90 ELSE 50 END as quality_score,
        CASE WHEN q.explanation IS NOT NULL AND LENGTH(TRIM(q.explanation)) > 10 THEN 'GOOD' ELSE 'NEEDS_REVIEW' END as quality_band,
        '[]' as flags_json,
        CASE WHEN q.unit_no IS NOT NULL AND q.topic_name IS NOT NULL THEN 'AUTO_MAPPED' ELSE 'REVIEW_REQUIRED' END as mapping_status,
        0.85 as mapping_confidence,
        'LOW_REPEAT' as repeat_frequency_band
      FROM master_question_bank q
      WHERE q.verification_status IN ('unverified', 'needs_review', 'pending', 'draft')
    `;
    const params: any[] = [];

    if (subjectCode) {
      sql += ` AND q.subject_code = ?`;
      params.push(subjectCode);
    }

    sql += ` ORDER BY q.created_at DESC LIMIT ?`;
    params.push(limit * 2);

    const rows = await context.env.DB.prepare(sql).bind(...params).all<Record<string, unknown>>();

    const items = (rows.results || []).map(r => {
      const prio = calculateModerationPriority({
        id: String(r.id),
        questionText: String(r.question_text || ''),
        questionType: String(r.question_type || 'MCQ') as any,
        subjectCode: String(r.subject_code || ''),
        subjectName: String(r.subject_name || ''),
        isOriginalPyq: Number(r.is_original_pyq) === 1,
        isAiGenerated: Number(r.is_ai_generated) === 1,
      });

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
        unitNo: r.unit_no,
        topicName: r.topic_name,
        difficulty: r.difficulty,
        marks: r.marks,
        isOriginalPyq: Number(r.is_original_pyq) === 1,
        isAiGenerated: Number(r.is_ai_generated) === 1,
        sourceType: r.source_type,
        paperId: r.paper_id,
        verificationStatus: r.verification_status,
        qualityScore: Number(r.quality_score || 50),
        qualityBand: r.quality_band || 'ACCEPTABLE',
        qualityFlags: flags,
        mappingStatus: r.mapping_status || 'UNMAPPED',
        repeatBand: r.repeat_frequency_band || 'UNIQUE',
        priorityScore: prio.priorityScore,
        priorityLevel: prio.priorityLevel,
        priorityReason: prio.priorityReasons.join('; ') || 'Standard review item',
        createdAt: r.created_at,
      };
    });

    let filtered = items;
    if (priorityTier) {
      filtered = items.filter(i => i.priorityLevel === priorityTier);
    }

    filtered.sort((a, b) => b.priorityScore - a.priorityScore);
    const paginated = filtered.slice(0, limit);

    return jsonResponse({
      success: true,
      totalBacklog: items.length,
      filteredCount: filtered.length,
      items: paginated,
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch moderation queue', 500);
  }
}
