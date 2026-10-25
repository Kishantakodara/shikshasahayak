// ============================================================
// GET /api/admin/question-intelligence/search
// Server-Side Paginated Question Search & Multi-Criteria Filtering
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
    const q = url.searchParams.get('q') || undefined;
    const subjectCode = url.searchParams.get('subjectCode') || undefined;
    const topicName = url.searchParams.get('topicName') || undefined;
    const unitNo = url.searchParams.get('unitNo') ? parseInt(url.searchParams.get('unitNo')!, 10) : undefined;
    const examSession = url.searchParams.get('session') || undefined;
    const examYear = url.searchParams.get('year') ? parseInt(url.searchParams.get('year')!, 10) : undefined;
    const questionType = url.searchParams.get('type') || undefined;
    const status = url.searchParams.get('status') || undefined;
    const difficulty = url.searchParams.get('difficulty') || undefined;
    const isOriginalPyq = url.searchParams.get('isOriginalPyq') !== null
      ? (url.searchParams.get('isOriginalPyq') === 'true' || url.searchParams.get('isOriginalPyq') === '1')
      : undefined;

    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(url.searchParams.get('pageSize') || '20', 10)));
    const offset = (page - 1) * pageSize;

    let whereSql = ` WHERE 1=1`;
    const params: any[] = [];

    if (q && q.trim()) {
      whereSql += ` AND q.question_text LIKE ?`;
      params.push(`%${q.trim()}%`);
    }

    if (subjectCode && subjectCode.trim()) {
      whereSql += ` AND q.subject_code = ?`;
      params.push(subjectCode.trim());
    }

    if (topicName && topicName.trim()) {
      whereSql += ` AND (q.topic_name LIKE ? OR m.topic_name LIKE ?)`;
      params.push(`%${topicName.trim()}%`, `%${topicName.trim()}%`);
    }

    if (unitNo !== undefined && !isNaN(unitNo)) {
      whereSql += ` AND (q.unit_no = ? OR m.unit_no = ?)`;
      params.push(unitNo, unitNo);
    }

    if (examSession && examSession.trim()) {
      whereSql += ` AND q.exam_session = ?`;
      params.push(examSession.trim());
    }

    if (examYear !== undefined && !isNaN(examYear)) {
      whereSql += ` AND q.exam_year = ?`;
      params.push(examYear);
    }

    if (questionType && questionType.trim()) {
      whereSql += ` AND q.question_type = ?`;
      params.push(questionType.trim());
    }

    if (status && status.trim()) {
      whereSql += ` AND q.verification_status = ?`;
      params.push(status.trim());
    }

    if (difficulty && difficulty.trim()) {
      whereSql += ` AND LOWER(q.difficulty) = ?`;
      params.push(difficulty.trim().toLowerCase());
    }

    if (isOriginalPyq !== undefined) {
      whereSql += ` AND q.is_original_pyq = ?`;
      params.push(isOriginalPyq ? 1 : 0);
    }

    // Count total matches
    const countQuery = `
      SELECT COUNT(DISTINCT q.id) as total
      FROM master_question_bank q
      ${whereSql}
    `;
    const countRow = await context.env.DB.prepare(countQuery).bind(...params).first<{ total: number }>();
    const total = Number(countRow?.total || 0);

    // Fetch page items
    const dataQuery = `
      SELECT 
        q.id, q.question_text, q.question_type, q.subject_code, q.subject_name,
        q.semester, q.unit_no, q.topic_name, q.difficulty, q.marks,
        q.is_original_pyq, q.is_ai_generated, q.source_type, q.provenance_id as paper_id,
        q.exam_session, q.exam_year, q.verification_status, q.created_at,
        CASE WHEN q.explanation IS NOT NULL AND LENGTH(TRIM(q.explanation)) > 10 THEN 90 ELSE 50 END as quality_score,
        CASE WHEN q.explanation IS NOT NULL AND LENGTH(TRIM(q.explanation)) > 10 THEN 'GOOD' ELSE 'NEEDS_REVIEW' END as quality_band,
        CASE WHEN q.unit_no IS NOT NULL AND q.topic_name IS NOT NULL THEN 'AUTO_MAPPED' ELSE 'REVIEW_REQUIRED' END as mapping_status,
        q.topic_name as mapped_topic
      FROM master_question_bank q
      ${whereSql}
      ORDER BY q.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const dataRows = await context.env.DB.prepare(dataQuery).bind(...params, pageSize, offset).all<Record<string, unknown>>();

    const questions = (dataRows.results || []).map(r => ({
      id: r.id,
      questionText: r.question_text,
      questionType: r.question_type,
      subjectCode: r.subject_code,
      subjectName: r.subject_name,
      semester: Number(r.semester || 1),
      unitNo: r.unit_no,
      topicName: r.mapped_topic || r.topic_name,
      difficulty: r.difficulty,
      marks: Number(r.marks || 1),
      isOriginalPyq: Number(r.is_original_pyq) === 1,
      isAiGenerated: Number(r.is_ai_generated) === 1,
      sourceType: r.source_type,
      paperId: r.paper_id,
      examSession: r.exam_session,
      examYear: r.exam_year,
      verificationStatus: r.verification_status,
      qualityScore: r.quality_score ? Number(r.quality_score) : null,
      qualityBand: r.quality_band || null,
      mappingStatus: r.mapping_status || 'UNMAPPED',
      createdAt: r.created_at,
    }));

    const totalPages = Math.ceil(total / pageSize);

    return jsonResponse({
      success: true,
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      questions,
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to execute question search', 500);
  }
}
