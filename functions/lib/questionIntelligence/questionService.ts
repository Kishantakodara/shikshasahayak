// ============================================================
// QUESTION INTELLIGENCE ENGINE - QUESTION SERVICE
// Primary application service layer for creating, reading, updating,
// listing, searching, filtering, and verifying master questions.
// ============================================================

import {
  MasterQuestion,
  QuestionSource,
  QuestionVerificationStatus,
  QuestionType,
  McqOptionSpec,
  MsqOptionSpec,
} from '../../../src/types';
import { Env } from '../contentEngine';
import { normalizeQuestionText } from './normalizationService';
import { validateMasterQuestionPayload } from './validationService';
import { detectDuplicateQuestionAsync } from './duplicateDetectionService';
import { mapQuestionToBranches, getQuestionBranches } from './branchMappingService';

export interface QuestionFilters {
  sourceType?: QuestionSource;
  examName?: string;
  examYear?: number;
  examSession?: string;
  canonicalSubjectId?: string;
  subjectCode?: string;
  subjectName?: string;
  semester?: number;
  unitNo?: number;
  topicName?: string;
  questionType?: 'MCQ' | 'MSQ' | 'NAT' | QuestionType;
  difficulty?: 'easy' | 'medium' | 'hard';
  verificationStatus?: QuestionVerificationStatus;
  branchId?: string;
  isOriginalPyq?: boolean;
  isAiGenerated?: boolean;
  provenanceId?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginatedQuestionsResult {
  questions: MasterQuestion[];
  total: number;
  page: number;
  totalPages: number;
}

/**
  Maps a raw Cloudflare D1 row into a strongly-typed MasterQuestion object.
 */
export function mapRowToMasterQuestion(row: Record<string, unknown>): MasterQuestion {
  const optionsRaw = row.options_json ? String(row.options_json) : null;
  const qType = String(row.question_type || 'MCQ').toUpperCase() as any;

  let mcqData: MasterQuestion['mcqData'] = null;
  let msqData: MasterQuestion['msqData'] = null;
  let natData: MasterQuestion['natData'] = null;

  if (qType === 'MCQ' || qType === 'SINGLE_CORRECT') {
    let opts: McqOptionSpec[] = [];
    if (optionsRaw) {
      try { opts = JSON.parse(optionsRaw); } catch { /* empty */ }
    }
    mcqData = {
      options: opts,
      correctAnswer: String(row.correct_answer_json || ''),
    };
  } else if (qType === 'MSQ' || qType === 'MULTIPLE_CORRECT') {
    let opts: MsqOptionSpec[] = [];
    if (optionsRaw) {
      try { opts = JSON.parse(optionsRaw); } catch { /* empty */ }
    }
    let ansArr: string[] = [];
    if (row.correct_answer_json) {
      try {
        const parsed = JSON.parse(String(row.correct_answer_json));
        if (Array.isArray(parsed)) ansArr = parsed.map(String);
        else ansArr = [String(parsed)];
      } catch {
        ansArr = [String(row.correct_answer_json)];
      }
    }
    msqData = {
      options: opts,
      correctAnswers: ansArr,
    };
  } else if (qType === 'NAT' || qType === 'NUMERICAL') {
    let range: any = null;
    if (row.acceptable_numerical_range_json) {
      try { range = JSON.parse(String(row.acceptable_numerical_range_json)); } catch { /* empty */ }
    }
    natData = {
      exactValue: row.correct_answer_json ? String(row.correct_answer_json) : undefined,
      acceptableRange: range || { min: Number(row.correct_answer_json || 0), max: Number(row.correct_answer_json || 0) },
    };
  }

  let steps: string[] | undefined;
  if (row.step_by_step_solution_json) {
    try { steps = JSON.parse(String(row.step_by_step_solution_json)); } catch { /* empty */ }
  }

  let tags: string[] | undefined;
  if (row.tags_json) {
    try { tags = JSON.parse(String(row.tags_json)); } catch { /* empty */ }
  }

  return {
    id: String(row.id),
    sourceType: String(row.source_type || 'OTHER') as QuestionSource,
    isOriginalPyq: Boolean(row.is_original_pyq),
    isAiGenerated: Boolean(row.is_ai_generated),
    provenanceId: row.provenance_id ? String(row.provenance_id) : null,
    sourceUrl: row.source_url ? String(row.source_url) : null,
    examName: String(row.exam_name || 'GTU'),
    examYear: row.exam_year ? Number(row.exam_year) : null,
    examSession: row.exam_session ? (String(row.exam_session) as any) : null,
    questionNo: row.question_no ? String(row.question_no) : null,
    subQuestionNo: row.sub_question_no ? String(row.sub_question_no) : null,
    canonicalSubjectId: row.canonical_subject_id ? String(row.canonical_subject_id) : null,
    subjectCode: row.subject_code ? String(row.subject_code) : null,
    subjectName: String(row.subject_name || ''),
    semester: Number(row.semester || 1),
    curriculumNodeId: row.curriculum_node_id ? String(row.curriculum_node_id) : null,
    unitNo: row.unit_no !== null && row.unit_no !== undefined ? Number(row.unit_no) : null,
    topicName: row.topic_name ? String(row.topic_name) : null,
    questionType: qType,
    questionText: String(row.question_text || ''),
    questionHtml: row.question_html ? String(row.question_html) : null,
    questionImageUrl: row.question_image_url ? String(row.question_image_url) : null,
    mcqData,
    msqData,
    natData,
    optionsJson: optionsRaw,
    correctAnswerJson: String(row.correct_answer_json || ''),
    acceptableNumericalRangeJson: row.acceptable_numerical_range_json ? String(row.acceptable_numerical_range_json) : null,
    explanation: row.explanation ? String(row.explanation) : null,
    stepByStepSolutionJson: row.step_by_step_solution_json ? String(row.step_by_step_solution_json) : null,
    stepByStepSolution: steps,
    marks: Number(row.marks || 1),
    negativeMarking: Number(row.negative_marking || 0),
    difficulty: String(row.difficulty || 'medium') as any,
    bloomLevel: row.bloom_level ? (String(row.bloom_level) as any) : null,
    tags,
    verificationStatus: String(row.verification_status || 'unverified') as QuestionVerificationStatus,
    verifiedBy: row.verified_by ? String(row.verified_by) : null,
    verifiedAt: row.verified_at ? String(row.verified_at) : null,
    createdAt: String(row.created_at || ''),
    updatedAt: String(row.updated_at || ''),
  };
}

/**
  Creates a new master question in master_question_bank with validation and branch mappings.
 */
export async function createQuestion(
  env: Env,
  data: Partial<MasterQuestion>,
  applicableBranchIds?: string[]
): Promise<MasterQuestion> {
  // 1. Validation
  const valRes = validateMasterQuestionPayload(data);
  if (!valRes.isValid) {
    throw new Error(`Invalid Question Payload: ${valRes.errors.join('; ')}`);
  }

  // 2. Normalization
  const normText = normalizeQuestionText(data.questionText!).normalized;
  const questionId = data.id || `Q_${crypto.randomUUID().slice(0, 10)}`;

  // Options & Answers JSON formatting
  let optionsJson: string | null = data.optionsJson || null;
  let correctAnswerJson: string = data.correctAnswerJson || '';

  const qType = String(data.questionType).toUpperCase();

  if (qType === 'MCQ' && data.mcqData) {
    optionsJson = JSON.stringify(data.mcqData.options);
    correctAnswerJson = data.mcqData.correctAnswer;
  } else if (qType === 'MSQ' && data.msqData) {
    optionsJson = JSON.stringify(data.msqData.options);
    correctAnswerJson = JSON.stringify(data.msqData.correctAnswers);
  } else if (qType === 'NAT' && data.natData) {
    if (data.natData.exactValue !== undefined) correctAnswerJson = String(data.natData.exactValue);
    else if (data.natData.acceptableRange) correctAnswerJson = String(data.natData.acceptableRange.min);
  }

  let acceptableRangeJson: string | null = data.acceptableNumericalRangeJson || null;
  if (data.natData?.acceptableRange) {
    acceptableRangeJson = JSON.stringify(data.natData.acceptableRange);
  }

  let stepSolutionJson: string | null = data.stepByStepSolutionJson || null;
  if (data.stepByStepSolution && Array.isArray(data.stepByStepSolution)) {
    stepSolutionJson = JSON.stringify(data.stepByStepSolution);
  }

  let tagsJson: string | null = null;
  if (data.tags && Array.isArray(data.tags)) {
    tagsJson = JSON.stringify(data.tags);
  }

  const isAi = Boolean(data.isAiGenerated) || data.sourceType === 'AI_PRACTICE';
  const isOriginal = Boolean(data.isOriginalPyq) && !isAi;

  // Insert SQL
  await env.DB.prepare(
    `INSERT INTO master_question_bank (
      id, source_type, is_original_pyq, is_ai_generated, provenance_id, source_url,
      exam_name, exam_year, exam_session, question_no, sub_question_no,
      canonical_subject_id, subject_code, subject_name, semester,
      curriculum_node_id, unit_no, topic_name,
      question_type, question_text, question_html, question_image_url,
      options_json, correct_answer_json, acceptable_numerical_range_json,
      explanation, step_by_step_solution_json, marks, negative_marking,
      difficulty, bloom_level, tags_json, verification_status, verified_by, verified_at,
      created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )`
  )
    .bind(
      questionId,
      data.sourceType || (isAi ? 'AI_PRACTICE' : 'GTU'),
      isOriginal ? 1 : 0,
      isAi ? 1 : 0,
      data.provenanceId || null,
      data.sourceUrl || null,
      data.examName || 'GTU',
      data.examYear !== undefined ? data.examYear : null,
      data.examSession || null,
      data.questionNo || null,
      data.subQuestionNo || null,
      data.canonicalSubjectId || null,
      data.subjectCode || null,
      data.subjectName!,
      data.semester || 1,
      data.curriculumNodeId || null,
      data.unitNo !== undefined ? data.unitNo : null,
      data.topicName || null,
      qType,
      normText,
      data.questionHtml || null,
      data.questionImageUrl || null,
      optionsJson,
      correctAnswerJson,
      acceptableRangeJson,
      data.explanation || null,
      stepSolutionJson,
      data.marks || 1.0,
      data.negativeMarking || 0.0,
      data.difficulty || 'medium',
      data.bloomLevel || null,
      tagsJson,
      (data.verificationStatus === 'verified' && !data.verifiedBy) ? 'unverified' : (data.verificationStatus || 'unverified'),
      data.verifiedBy || null,
      data.verifiedAt || null
    )
    .run();

  // 3. Map Applicable Branches
  const targetBranches = applicableBranchIds || data.applicableBranches || [];
  if (targetBranches.length > 0) {
    await mapQuestionToBranches(env, questionId, targetBranches);
  }

  const created = await getQuestionById(env, questionId);
  if (!created) {
    throw new Error(`Failed to retrieve newly created question '${questionId}'`);
  }
  return created;
}

/**
  Retrieves a master question by ID along with its mapped branches.
 */
export async function getQuestionById(env: Env, id: string): Promise<MasterQuestion | null> {
  try {
    const row = await env.DB.prepare(
      `SELECT * FROM master_question_bank WHERE id = ?`
    )
      .bind(id)
      .first<Record<string, unknown>>();

    if (!row) return null;

    const question = mapRowToMasterQuestion(row);
    const branches = await getQuestionBranches(env, id);
    question.branchMappings = branches.map(b => ({
      id: `qbm_${id}_${b.id}`,
      questionId: id,
      branchId: b.id,
      branchSlug: b.slug,
      branchName: b.name,
    }));
    question.applicableBranches = branches.map(b => b.id);

    return question;
  } catch (error) {
    console.error('Error in getQuestionById:', error);
    return null;
  }
}

/**
  Updates an existing master question record.
 */
export async function updateQuestion(
  env: Env,
  id: string,
  updates: Partial<MasterQuestion>
): Promise<MasterQuestion | null> {
  const existing = await getQuestionById(env, id);
  if (!existing) return null;

  const merged = { ...existing, ...updates };

  let optionsJson = merged.optionsJson;
  let correctAnswerJson = merged.correctAnswerJson;
  let acceptableRangeJson = merged.acceptableNumericalRangeJson;

  const qType = String(merged.questionType).toUpperCase();
  if (qType === 'MCQ' && updates.mcqData) {
    optionsJson = JSON.stringify(updates.mcqData.options);
    correctAnswerJson = updates.mcqData.correctAnswer;
  } else if (qType === 'MSQ' && updates.msqData) {
    optionsJson = JSON.stringify(updates.msqData.options);
    correctAnswerJson = JSON.stringify(updates.msqData.correctAnswers);
  } else if (qType === 'NAT' && updates.natData) {
    if (updates.natData.exactValue !== undefined) correctAnswerJson = String(updates.natData.exactValue);
    if (updates.natData.acceptableRange) acceptableRangeJson = JSON.stringify(updates.natData.acceptableRange);
  }

  await env.DB.prepare(
    `UPDATE master_question_bank
     SET question_text = ?, question_type = ?, subject_name = ?, semester = ?,
         options_json = ?, correct_answer_json = ?, acceptable_numerical_range_json = ?,
         explanation = ?, marks = ?, negative_marking = ?, difficulty = ?,
         verification_status = ?, verified_by = ?, verified_at = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  )
    .bind(
      merged.questionText,
      qType,
      merged.subjectName,
      merged.semester,
      optionsJson,
      correctAnswerJson,
      acceptableRangeJson,
      merged.explanation,
      merged.marks,
      merged.negativeMarking,
      merged.difficulty,
      merged.verificationStatus,
      merged.verifiedBy,
      merged.verifiedAt,
      id
    )
    .run();

  if (updates.applicableBranches) {
    await mapQuestionToBranches(env, id, updates.applicableBranches);
  }

  return getQuestionById(env, id);
}

/**
  Deletes a master question record by ID.
 */
export async function deleteQuestion(env: Env, id: string): Promise<boolean> {
  try {
    await env.DB.prepare(`DELETE FROM master_question_bank WHERE id = ?`).bind(id).run();
    return true;
  } catch (error) {
    console.error('Error in deleteQuestion:', error);
    return false;
  }
}

/**
  Filters and lists questions from master_question_bank with full filter parameters and pagination.
 */
export async function listQuestions(
  env: Env,
  filters?: QuestionFilters,
  pagination?: PaginationOptions
): Promise<PaginatedQuestionsResult> {
  try {
    let sql = `SELECT DISTINCT mqb.* FROM master_question_bank mqb`;
    let countSql = `SELECT COUNT(DISTINCT mqb.id) AS total FROM master_question_bank mqb`;

    const joins: string[] = [];
    const whereConditions: string[] = [];
    const params: any[] = [];

    if (filters?.branchId) {
      joins.push(`JOIN question_branch_mappings qbm ON mqb.id = qbm.question_id`);
      whereConditions.push(`qbm.branch_id = ?`);
      params.push(filters.branchId);
    }

    if (filters?.sourceType) {
      whereConditions.push(`mqb.source_type = ?`);
      params.push(filters.sourceType);
    }
    if (filters?.examName) {
      whereConditions.push(`mqb.exam_name = ?`);
      params.push(filters.examName);
    }
    if (filters?.examYear !== undefined) {
      whereConditions.push(`mqb.exam_year = ?`);
      params.push(filters.examYear);
    }
    if (filters?.examSession) {
      whereConditions.push(`mqb.exam_session = ?`);
      params.push(filters.examSession);
    }
    if (filters?.canonicalSubjectId) {
      whereConditions.push(`mqb.canonical_subject_id = ?`);
      params.push(filters.canonicalSubjectId);
    }
    if (filters?.subjectCode) {
      whereConditions.push(`mqb.subject_code = ?`);
      params.push(filters.subjectCode);
    }
    if (filters?.subjectName) {
      whereConditions.push(`mqb.subject_name LIKE ?`);
      params.push(`%${filters.subjectName}%`);
    }
    if (filters?.semester !== undefined) {
      whereConditions.push(`mqb.semester = ?`);
      params.push(filters.semester);
    }
    if (filters?.unitNo !== undefined) {
      whereConditions.push(`mqb.unit_no = ?`);
      params.push(filters.unitNo);
    }
    if (filters?.topicName) {
      whereConditions.push(`mqb.topic_name LIKE ?`);
      params.push(`%${filters.topicName}%`);
    }
    if (filters?.questionType) {
      whereConditions.push(`mqb.question_type = ?`);
      params.push(filters.questionType);
    }
    if (filters?.difficulty) {
      whereConditions.push(`mqb.difficulty = ?`);
      params.push(filters.difficulty);
    }
    if (filters?.verificationStatus) {
      whereConditions.push(`mqb.verification_status = ?`);
      params.push(filters.verificationStatus);
    }
    if (filters?.isOriginalPyq !== undefined) {
      whereConditions.push(`mqb.is_original_pyq = ?`);
      params.push(filters.isOriginalPyq ? 1 : 0);
    }
    if (filters?.isAiGenerated !== undefined) {
      whereConditions.push(`mqb.is_ai_generated = ?`);
      params.push(filters.isAiGenerated ? 1 : 0);
    }
    if (filters?.provenanceId) {
      whereConditions.push(`mqb.provenance_id = ?`);
      params.push(filters.provenanceId);
    }

    if (joins.length > 0) {
      const joinStr = ` ` + joins.join(' ');
      sql += joinStr;
      countSql += joinStr;
    }

    if (whereConditions.length > 0) {
      const whereStr = ` WHERE ` + whereConditions.join(' AND ');
      sql += whereStr;
      countSql += whereStr;
    }

    const countRow = await env.DB.prepare(countSql).bind(...params).first<{ total: number }>();
    const total = countRow?.total || 0;

    const page = Math.max(1, pagination?.page || 1);
    const limit = Math.max(1, pagination?.limit || 20);
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit) || 1;

    sql += ` ORDER BY mqb.created_at DESC LIMIT ? OFFSET ?`;
    const queryParams = [...params, limit, offset];

    const { results } = await env.DB.prepare(sql).bind(...queryParams).all<Record<string, unknown>>();
    const questions = (results || []).map(mapRowToMasterQuestion);

    return {
      questions,
      total,
      page,
      totalPages,
    };
  } catch (error) {
    console.error('Error in listQuestions:', error);
    return { questions: [], total: 0, page: 1, totalPages: 1 };
  }
}

/**
  Alias for listQuestions to filter questions based on filter parameters.
 */
export async function filterQuestions(
  env: Env,
  filters?: QuestionFilters,
  pagination?: PaginationOptions
): Promise<PaginatedQuestionsResult> {
  return listQuestions(env, filters, pagination);
}

/**
  Performs text search across question text and topic names with optional filters.
 */
export async function searchQuestions(
  env: Env,
  query: string,
  filters?: QuestionFilters,
  pagination?: PaginationOptions
): Promise<PaginatedQuestionsResult> {
  const mergedFilters = { ...filters };
  if (query && query.trim()) {
    return listQuestions(
      env,
      { ...mergedFilters, topicName: query.trim() },
      pagination
    );
  }
  return listQuestions(env, mergedFilters, pagination);
}

/**
  Marks a question as verified using full validation pipeline.
 */
export async function verifyQuestion(
  env: Env,
  id: string,
  verifierId: string
): Promise<boolean> {
  try {
    const { approveAndPublishQuestion } = await import('./adminQuestionBankService');
    await approveAndPublishQuestion(env, verifierId, id, 'Verified via questionService');
    return true;
  } catch (error) {
    console.error('Error in verifyQuestion:', error);
    return false;
  }
}

/**
  Marks a question as rejected with optional explanation.
 */
export async function rejectQuestion(
  env: Env,
  id: string,
  verifierId: string,
  reason?: string
): Promise<boolean> {
  try {
    const now = new Date().toISOString();
    await env.DB.prepare(
      `UPDATE master_question_bank
       SET verification_status = 'rejected', verified_by = ?, verified_at = ?, explanation = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
      .bind(verifierId, now, reason || null, id)
      .run();

    return true;
  } catch (error) {
    console.error('Error in rejectQuestion:', error);
    return false;
  }
}

/**
  Marks a question as flagged for review.
 */
export async function flagQuestion(
  env: Env,
  id: string,
  verifierId: string,
  reason?: string
): Promise<boolean> {
  try {
    const now = new Date().toISOString();
    await env.DB.prepare(
      `UPDATE master_question_bank
       SET verification_status = 'flagged', verified_by = ?, verified_at = ?, explanation = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
      .bind(verifierId, now, reason || null, id)
      .run();

    return true;
  } catch (error) {
    console.error('Error in flagQuestion:', error);
    return false;
  }
}
