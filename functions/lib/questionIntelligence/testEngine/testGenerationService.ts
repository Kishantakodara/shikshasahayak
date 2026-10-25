// ============================================================
// QUESTION INTELLIGENCE ENGINE - TEST GENERATION SERVICE
// Dynamically selects, balances, and randomizes verified questions
// for random tests, topic tests, PYQ tests, and custom quizzes.
// ============================================================

import {
  TestGenerationConfig,
  TestSessionDTO,
  TestShortageError,
  StudentTestQuestionDTO,
  MasterQuestion,
  McqOptionSpec,
} from '../../../../src/types';
import { Env } from '../../contentEngine';
import { resolveCanonicalBranchId } from '../branchMappingService';

/**
  Simple deterministic Pseudo-Random Number Generator (PRNG) for seed-based shuffle.
 */
function createPrng(seedStr: string) {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(31, h) + seedStr.charCodeAt(i) | 0;
  }
  return function () {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
  Fisher-Yates shuffle supporting optional seed PRNG.
 */
function shuffleArray<T>(arr: T[], seed?: string): T[] {
  const list = [...arr];
  const rand = seed ? createPrng(seed) : Math.random;

  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

/**
  Maps raw D1 database row to student-facing StudentTestQuestionDTO (Hiding correct answer).
 */
function mapRowToStudentTestQuestion(
  row: Record<string, unknown>,
  sequenceNumber: number,
  randomizeOptions: boolean = false,
  seed?: string
): StudentTestQuestionDTO {
  let options: Array<{ id: string; text: string; imageUrl?: string }> = [];
  if (row.options_json) {
    try {
      const parsed = JSON.parse(String(row.options_json));
      if (Array.isArray(parsed)) {
        options = parsed.map((opt: any, idx: number) => {
          if (typeof opt === 'string') return { id: String(idx), text: opt };
          return {
            id: String(opt.id || idx),
            text: String(opt.text || opt.value || ''),
            imageUrl: opt.imageUrl ? String(opt.imageUrl) : undefined,
          };
        });
      }
    } catch {
      /* empty */
    }
  }

  if (randomizeOptions && options.length > 1) {
    options = shuffleArray(options, seed ? `${seed}_opt_${sequenceNumber}` : undefined);
  }

  const qType = String(row.question_type || 'MCQ').toUpperCase() as any;

  return {
    id: String(row.id),
    sequenceNumber,
    questionText: String(row.question_text || ''),
    questionHtml: row.question_html ? String(row.question_html) : null,
    questionImageUrl: row.question_image_url ? String(row.question_image_url) : null,
    questionType: qType,
    options,
    marks: Number(row.marks || 1.0),
    negativeMarks: Number(row.negative_marking || 0.0),
    subjectName: String(row.subject_name || ''),
    topicName: row.topic_name ? String(row.topic_name) : null,
    sourceType: String(row.source_type || 'OTHER') as any,
    isOriginalPyq: Boolean(row.is_original_pyq),
    isAiGenerated: Boolean(row.is_ai_generated),
    examName: row.exam_name ? String(row.exam_name) : null,
    examYear: row.exam_year ? Number(row.exam_year) : null,
  };
}

/**
  Queries D1 database for eligible verified questions matching TestGenerationConfig.
 */
export async function queryEligibleQuestions(
  env: Env,
  config: TestGenerationConfig
): Promise<Record<string, unknown>[]> {
  let sql = `SELECT DISTINCT mqb.* FROM master_question_bank mqb`;
  const joins: string[] = [
    `LEFT JOIN question_quality_metrics qqm ON mqb.id = qqm.question_id`,
  ];
  const whereConditions: string[] = [
    `mqb.verification_status = 'verified'`, // NEVER expose DRAFT, REJECTED, or NEEDS_REVIEW
    `(qqm.lifecycle_status IS NULL OR qqm.lifecycle_status NOT IN ('QUARANTINED', 'RETIRED'))`,
  ];
  const params: any[] = [];


  // 1. Branch Filter
  if (config.branchId) {
    const canonicalBranchId = resolveCanonicalBranchId(config.branchId);
    joins.push(`JOIN question_branch_mappings qbm ON mqb.id = qbm.question_id`);
    whereConditions.push(`qbm.branch_id = ?`);
    params.push(canonicalBranchId);
  }

  // 2. Source Mode Filter
  if (config.sourceMode === 'GTU_PYQ') {
    whereConditions.push(`mqb.source_type = 'GTU' AND mqb.is_original_pyq = 1`);
  } else if (config.sourceMode === 'GATE_PYQ') {
    whereConditions.push(`mqb.source_type = 'GATE' AND mqb.is_original_pyq = 1`);
  } else if (config.sourceMode === 'AI_GENERATED') {
    whereConditions.push(`mqb.is_ai_generated = 1`);
  } else if (config.sourceMode === 'PRACTICE') {
    whereConditions.push(`(mqb.is_ai_generated = 1 OR mqb.source_type = 'AI_PRACTICE' OR mqb.source_type = 'TEACHER')`);
  }

  // 3. Question Types Filter
  if (config.questionTypes) {
    if (Array.isArray(config.questionTypes)) {
      if (config.questionTypes.length > 0 && !config.questionTypes.includes('MIXED' as any)) {
        const placeholders = config.questionTypes.map(() => '?').join(', ');
        whereConditions.push(`mqb.question_type IN (${placeholders})`);
        params.push(...config.questionTypes);
      }
    } else if (typeof config.questionTypes === 'string' && config.questionTypes !== 'MIXED') {
      whereConditions.push(`mqb.question_type = ?`);
      params.push(config.questionTypes);
    }
  }

  // 4. Academic & Exam Filters
  if (config.semester !== undefined) {
    whereConditions.push(`mqb.semester = ?`);
    params.push(config.semester);
  }
  if (config.subjectCode) {
    whereConditions.push(`mqb.subject_code = ?`);
    params.push(config.subjectCode);
  }
  if (config.canonicalSubjectId) {
    whereConditions.push(`mqb.canonical_subject_id = ?`);
    params.push(config.canonicalSubjectId);
  }
  if (config.subjectName) {
    whereConditions.push(`mqb.subject_name LIKE ?`);
    params.push(`%${config.subjectName}%`);
  }
  if (config.topicName) {
    whereConditions.push(`mqb.topic_name LIKE ?`);
    params.push(`%${config.topicName}%`);
  }
  if (config.examName) {
    whereConditions.push(`mqb.exam_name = ?`);
    params.push(config.examName);
  }
  if (config.examYear !== undefined) {
    whereConditions.push(`mqb.exam_year = ?`);
    params.push(config.examYear);
  }
  if (config.difficulty && config.difficulty !== 'MIXED') {
    whereConditions.push(`mqb.difficulty = ?`);
    params.push(config.difficulty.toLowerCase());
  }

  // 5. Test Type Special Filters
  if (config.testType === 'INCORRECT_QUESTION_TEST' && config.studentId) {
    whereConditions.push(
      `mqb.id IN (
        SELECT question_id FROM student_mcq_attempts WHERE student_id = ? AND is_correct = 0
        UNION
        SELECT tsq.question_id FROM test_session_questions tsq JOIN test_sessions ts ON tsq.test_session_id = ts.id WHERE ts.student_id = ? AND tsq.is_correct = 0
      )`
    );
    params.push(config.studentId, config.studentId);
  } else if (config.testType === 'BOOKMARK_TEST' && config.studentId) {
    whereConditions.push(
      `mqb.id IN (SELECT question_id FROM student_mcq_bookmarks WHERE student_id = ?)`
    );
    params.push(config.studentId);
  }

  // 6. Exclude Attempted / Correctly Answered
  if (config.studentId) {
    if (config.excludeCorrectlyAnswered) {
      whereConditions.push(
        `mqb.id NOT IN (SELECT question_id FROM student_mcq_attempts WHERE student_id = ? AND is_correct = 1)`
      );
      params.push(config.studentId);
    } else if (config.excludeAttempted) {
      whereConditions.push(
        `mqb.id NOT IN (SELECT question_id FROM student_mcq_attempts WHERE student_id = ?)`
      );
      params.push(config.studentId);
    }
  }

  if (joins.length > 0) {
    sql += ` ` + joins.join(' ');
  }
  if (whereConditions.length > 0) {
    sql += ` WHERE ` + whereConditions.join(' AND ');
  }

  sql += ` ORDER BY mqb.created_at DESC LIMIT 500`;

  const { results } = await (params.length > 0
    ? env.DB.prepare(sql).bind(...params)
    : env.DB.prepare(sql)
  ).all<Record<string, unknown>>();

  return results || [];
}

/**
  Generates a dynamic test session from verified questions.
 */
export async function generateTestSession(
  env: Env,
  config: TestGenerationConfig
): Promise<TestSessionDTO | TestShortageError> {
  const eligibleRows = await queryEligibleQuestions(env, config);

  // Insufficient Questions Check
  if (eligibleRows.length < config.questionCount) {
    return {
      success: false,
      reason: 'INSUFFICIENT_QUESTIONS',
      requested: config.questionCount,
      available: eligibleRows.length,
    };
  }

  // Randomization & Seed
  const seed = config.seed || `seed_${crypto.randomUUID().slice(0, 8)}`;
  let selectedRows: Record<string, unknown>[] = [];

  if (config.randomizeQuestions !== false) {
    const shuffled = shuffleArray(eligibleRows, seed);
    selectedRows = shuffled.slice(0, config.questionCount);
  } else {
    selectedRows = eligibleRows.slice(0, config.questionCount);
  }

  // Calculate marks and negative mark configuration
  const negMarking = config.negativeMarking ? 1 : 0;
  const negValue = config.negativeMarkValue !== undefined ? config.negativeMarkValue : 0.25;
  const practiceMode = config.practiceMode || 'EXAM_MODE';
  const studentId = config.studentId || 'student_guest';
  const sessionId = `ts_${crypto.randomUUID().slice(0, 12)}`;

  let totalMarksSum = 0;
  const questionDtos: StudentTestQuestionDTO[] = selectedRows.map((row, idx) => {
    const seq = idx + 1;
    const qDto = mapRowToStudentTestQuestion(row, seq, config.randomizeOptions !== false, seed);
    totalMarksSum += qDto.marks;
    return qDto;
  });

  // Insert Session Record into D1 database
  await env.DB.prepare(
    `INSERT INTO test_sessions (
      id, student_id, test_type, source_mode, practice_mode, branch_id, semester,
      subject_code, topic_name, question_count, duration_minutes,
      negative_marking, negative_mark_value, seed, config_json,
      status, total_marks, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      'CREATED', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )`
  )
    .bind(
      sessionId,
      studentId,
      config.testType,
      config.sourceMode || 'ALL',
      practiceMode,
      config.branchId ? resolveCanonicalBranchId(config.branchId) : null,
      config.semester || null,
      config.subjectCode || null,
      config.topicName || null,
      config.questionCount,
      config.durationMinutes,
      negMarking,
      negValue,
      seed,
      JSON.stringify(config),
      totalMarksSum
    )
    .run();

  // Insert Questions into test_session_questions junction table

  for (const qDto of questionDtos) {
    const tsqId = `tsq_${crypto.randomUUID().slice(0, 12)}`;
    await env.DB.prepare(
      `INSERT INTO test_session_questions (
        id, test_session_id, question_id, sequence_number, marks, negative_marks
      ) VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(
        tsqId,
        sessionId,
        qDto.id,
        qDto.sequenceNumber,
        qDto.marks,
        negMarking ? negValue : 0.0
      )
      .run();
  }

  return {
    id: sessionId,
    studentId,
    testType: config.testType,
    sourceMode: config.sourceMode || 'ALL',
    status: 'CREATED',
    questionCount: config.questionCount,
    durationMinutes: config.durationMinutes,
    remainingSeconds: config.durationMinutes * 60,
    negativeMarking: Boolean(negMarking),
    negativeMarkValue: negValue,
    startedAt: null,
    submittedAt: null,
    totalMarks: totalMarksSum,
    obtainedMarks: 0.0,
    questions: questionDtos,
  };
}

/**
  Admin Preview function: Previews test generation without writing session logs or student records.
 */
export async function previewTestGeneration(
  env: Env,
  config: TestGenerationConfig
): Promise<{ success: boolean; availableCount: number; sampleQuestions: StudentTestQuestionDTO[]; shortageError?: TestShortageError }> {
  const eligibleRows = await queryEligibleQuestions(env, config);

  if (eligibleRows.length < config.questionCount) {
    return {
      success: false,
      availableCount: eligibleRows.length,
      sampleQuestions: [],
      shortageError: {
        success: false,
        reason: 'INSUFFICIENT_QUESTIONS',
        requested: config.questionCount,
        available: eligibleRows.length,
      },
    };
  }

  const seed = config.seed || 'preview_seed';
  const shuffled = shuffleArray(eligibleRows, seed);
  const sample = shuffled.slice(0, config.questionCount).map((row, idx) => mapRowToStudentTestQuestion(row, idx + 1, false, seed));

  return {
    success: true,
    availableCount: eligibleRows.length,
    sampleQuestions: sample,
  };
}
