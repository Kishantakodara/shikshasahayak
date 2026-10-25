// ============================================================
// GET /api/admin/question-intelligence/:id
// Comprehensive Question Inspector & Provenance Detail
// ============================================================

import { getAuthenticatedUser, isAdmin } from '../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../lib/json';

export async function onRequestGet(context: {
  request: Request;
  env: WorkerBindings;
  params: { id: string };
}): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
    if (!isAdmin(user.email, user.role) && user.role !== "admin" && user.role !== "reviewer") {
      return errorResponse('Forbidden: Admin or Reviewer access required', 403);
    }

    const questionId = context.params.id;
    if (!questionId) {
      return errorResponse('Question ID is required', 400);
    }

    // 1. Fetch Question Base Record
    const question = await context.env.DB.prepare(
      `SELECT * FROM master_question_bank WHERE id = ?`
    ).bind(questionId).first<Record<string, unknown>>();

    if (!question) {
      return errorResponse('Question not found', 404);
    }

    // 2. Fetch Quality Scores & Flags
    let quality: Record<string, unknown> | null = null;
    let qualityFlags: string[] = [];
    try {
      quality = await context.env.DB.prepare(
        `SELECT quality_score as overall_score, quality_band, sample_confidence_band as confidence_band, health_flags_json as flags_json, updated_at as evaluated_at FROM question_quality_metrics WHERE question_id = ?`
      ).bind(questionId).first<Record<string, unknown>>();
      if (quality?.flags_json) {
        qualityFlags = JSON.parse(String(quality.flags_json));
      }
    } catch {
      quality = null;
    }

    if (!quality) {
      const hasExp = Boolean(question.explanation && String(question.explanation).trim().length > 10);
      quality = {
        overall_score: hasExp ? 90 : 50,
        quality_band: hasExp ? 'GOOD' : 'NEEDS_REVIEW',
        confidence_band: 'HIGH',
        evaluated_at: question.created_at,
      };
    }

    // 3. Fetch Curriculum Mapping
    let conceptTags: string[] = [];
    if (question.tags_json) {
      try {
        conceptTags = JSON.parse(String(question.tags_json));
      } catch {
        conceptTags = [];
      }
    }

    // 4. Fetch Duplicate Cluster & Recurrence
    let clusterMember: any = null;
    let clusterOtherMembers: any[] = [];
    if (question.parent_question_id) {
      try {
        const others = await context.env.DB.prepare(
          `SELECT id as question_id, exam_session, exam_year, question_text, verification_status
           FROM master_question_bank
           WHERE (parent_question_id = ? OR id = ?) AND id != ?`
        ).bind(question.parent_question_id, question.parent_question_id, questionId).all<Record<string, unknown>>();
        clusterOtherMembers = others.results || [];
        clusterMember = {
          cluster_id: question.parent_question_id,
          repeat_frequency_band: clusterOtherMembers.length > 2 ? 'HIGH_REPEAT' : 'MEDIUM_REPEAT',
          total_occurrences: clusterOtherMembers.length + 1,
          canonical_question_text: question.question_text,
        };
      } catch {
        clusterMember = null;
      }
    }

    // 5. Fetch Audit Trail
    let auditTrail: any[] = [];
    try {
      const auditRows = await context.env.DB.prepare(
        `SELECT id, actor_id, actor_role, action, reason, details_json, created_at
         FROM question_audit_logs
         WHERE question_id = ?
         ORDER BY created_at DESC`
      ).bind(questionId).all<Record<string, unknown>>();
      auditTrail = auditRows.results || [];
    } catch {
      auditTrail = [];
    }

    // Parse options if MCQ/MSQ
    let options: Array<{ id: string; text: string }> = [];
    if (question.options_json) {
      try {
        const parsed = JSON.parse(String(question.options_json));
        options = Array.isArray(parsed)
          ? parsed.map((o: any, idx: number) => ({
              id: typeof o === 'string' ? String(idx) : String(o.id || idx),
              text: typeof o === 'string' ? o : String(o.text || ''),
            }))
          : [];
      } catch {
        options = [];
      }
    }

    const provenanceType = Number(question.is_original_pyq) === 1
      ? 'ORIGINAL GTU PYQ'
      : (Number(question.is_ai_generated) === 1 ? 'AI PRACTICE' : 'CURATED');

    return jsonResponse({
      success: true,
      question: {
        id: question.id,
        questionText: question.question_text,
        questionType: question.question_type,
        subjectCode: question.subject_code,
        subjectName: question.subject_name,
        semester: Number(question.semester || 1),
        unitNo: Number(question.unit_no || 1),
        unitName: question.unit_no ? `Unit ${question.unit_no}` : 'General Module',
        topicName: String(question.topic_name || 'General Concept'),
        conceptTags,
        difficulty: String(question.difficulty || 'medium'),
        marks: Number(question.marks || 1),
        options,
        provenanceType,
        isOriginalPyq: Number(question.is_original_pyq) === 1,
        isAiGenerated: Number(question.is_ai_generated) === 1,
        sourceType: question.source_type,
        paperId: question.provenance_id || question.exam_paper_code || question.paper_id,
        examName: question.exam_name,
        examSession: question.exam_session,
        examYear: question.exam_year,
        sourceUrl: question.source_url,
        pageNumber: question.page_number,
        verificationStatus: question.verification_status,
        quality: quality ? {
          overallScore: Number(quality.overall_score || 0),
          qualityBand: quality.quality_band,
          confidenceBand: quality.confidence_band,
          flags: qualityFlags,
          evaluatedAt: quality.evaluated_at,
        } : null,
        curriculumMapping: {
          mappingStatus: question.unit_no && question.topic_name ? 'AUTO_MAPPED' : 'REVIEW_REQUIRED',
          mappingConfidence: question.unit_no && question.topic_name ? 0.95 : 0.4,
          mappedBy: 'SYSTEM',
        },
        duplicateCluster: clusterMember ? {
          clusterId: clusterMember.cluster_id,
          repeatFrequencyBand: clusterMember.repeat_frequency_band,
          totalOccurrences: Number(clusterMember.total_occurrences || 1),
          canonicalQuestionText: clusterMember.canonical_question_text,
          otherOccurrences: clusterOtherMembers,
        } : null,
        auditTrail,
        createdAt: question.created_at,
        updatedAt: question.updated_at,
      },
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to inspect question detail', 500);
  }
}
