// ============================================================
// QUESTION INTELLIGENCE ENGINE - STUDENT MCQ PRACTICE SERVICE
// High-performance API service dedicated for the Student Portal: MCQ Practice.
// Supports GTU PYQs, GATE PYQs, Practice Mode, Branch, Semester, Subject,
// Topic, Difficulty, Year filters, Random Practice, Bookmarks, and Progress.
// ============================================================

import {
  McqPracticeFilterParams,
  StudentMcqQuestionDTO,
  StudentMcqAnswerEvaluation,
  StudentMcqAttemptRecord,
  StudentMcqBookmarkRecord,
  StudentMcqProgressSummary,
  McqOptionSpec,
} from '../../../src/types';
import { Env } from '../contentEngine';
import { resolveCanonicalBranchId } from './branchMappingService';

/**
  Maps D1 database row to clean student-facing StudentMcqQuestionDTO.
 */
function mapRowToStudentMcqDTO(
  row: Record<string, unknown>,
  isBookmarked?: boolean,
  lastAttempt?: { selectedOptionId: string; isCorrect: boolean; attemptedAt: string }
): StudentMcqQuestionDTO {
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

  let steps: string[] | undefined;
  if (row.step_by_step_solution_json) {
    try {
      steps = JSON.parse(String(row.step_by_step_solution_json));
    } catch {
      /* empty */
    }
  }

  return {
    id: String(row.id),
    questionText: String(row.question_text || ''),
    questionHtml: row.question_html ? String(row.question_html) : null,
    questionImageUrl: row.question_image_url ? String(row.question_image_url) : null,
    options,
    subjectName: String(row.subject_name || ''),
    subjectCode: row.subject_code ? String(row.subject_code) : null,
    semester: Number(row.semester || 1),
    topicName: row.topic_name ? String(row.topic_name) : null,
    difficulty: (String(row.difficulty || 'medium') as any),
    marks: Number(row.marks || 1),
    sourceType: (String(row.source_type || 'OTHER') as any),
    isOriginalPyq: Boolean(row.is_original_pyq),
    examName: row.exam_name ? String(row.exam_name) : null,
    examYear: row.exam_year ? Number(row.exam_year) : null,
    examSession: row.exam_session ? String(row.exam_session) : null,
    explanation: null, // Stripped pre-submission to prevent answer leakage
    stepByStepSolution: undefined, // Stripped pre-submission to prevent answer leakage
    isBookmarked: Boolean(isBookmarked),
    userLastAttempt: lastAttempt,
  };
}

/**
  Retrieves MCQ practice questions specifically formatted for student practice.
 */
export async function getMcqPracticeQuestions(
  env: Env,
  params?: McqPracticeFilterParams
): Promise<{ questions: StudentMcqQuestionDTO[]; total: number }> {
  try {
    let sql = `SELECT DISTINCT mqb.* FROM master_question_bank mqb`;
    let countSql = `SELECT COUNT(DISTINCT mqb.id) AS total FROM master_question_bank mqb`;

    const joins: string[] = [];
    const whereConditions: string[] = [
      `mqb.question_type IN ('MCQ', 'SINGLE_CORRECT')`,
      `mqb.verification_status = 'verified'`,
    ];
    const queryParams: any[] = [];

    // Branch Filter
    if (params?.branchId) {
      const canonicalBranchId = resolveCanonicalBranchId(params.branchId);
      joins.push(`JOIN question_branch_mappings qbm ON mqb.id = qbm.question_id`);
      whereConditions.push(`qbm.branch_id = ?`);
      queryParams.push(canonicalBranchId);
    }

    // Bookmarked Only Filter
    if (params?.isBookmarkedOnly && params?.studentId) {
      joins.push(`JOIN student_mcq_bookmarks smb ON mqb.id = smb.question_id`);
      whereConditions.push(`smb.student_id = ?`);
      queryParams.push(params.studentId);
    }

    // Source Mode Filter (GTU PYQ, GATE PYQ, Practice, All)
    if (params?.sourceMode === 'GTU_PYQ') {
      whereConditions.push(`mqb.source_type = 'GTU' AND mqb.is_original_pyq = 1`);
    } else if (params?.sourceMode === 'GATE_PYQ') {
      whereConditions.push(`mqb.source_type = 'GATE' AND mqb.is_original_pyq = 1`);
    } else if (params?.sourceMode === 'PRACTICE') {
      whereConditions.push(`(mqb.is_ai_generated = 1 OR mqb.source_type = 'AI_PRACTICE' OR mqb.source_type = 'TEACHER')`);
    }

    // Academic & Metadata Filters
    if (params?.semester !== undefined) {
      whereConditions.push(`mqb.semester = ?`);
      queryParams.push(params.semester);
    }
    if (params?.subjectCode) {
      whereConditions.push(`mqb.subject_code = ?`);
      queryParams.push(params.subjectCode);
    }
    if (params?.canonicalSubjectId) {
      whereConditions.push(`mqb.canonical_subject_id = ?`);
      queryParams.push(params.canonicalSubjectId);
    }
    if (params?.subjectName) {
      whereConditions.push(`mqb.subject_name LIKE ?`);
      queryParams.push(`%${params.subjectName}%`);
    }
    if (params?.topicName) {
      whereConditions.push(`mqb.topic_name LIKE ?`);
      queryParams.push(`%${params.topicName}%`);
    }
    if (params?.difficulty) {
      whereConditions.push(`mqb.difficulty = ?`);
      queryParams.push(params.difficulty);
    }
    if (params?.examYear !== undefined) {
      whereConditions.push(`mqb.exam_year = ?`);
      queryParams.push(params.examYear);
    }
    if (params?.examName) {
      whereConditions.push(`mqb.exam_name = ?`);
      queryParams.push(params.examName);
    }
    if (params?.isOriginalPyq !== undefined) {
      whereConditions.push(`mqb.is_original_pyq = ?`);
      queryParams.push(params.isOriginalPyq ? 1 : 0);
    }

    // Unattempted Only Filter
    if (params?.unattemptedOnly && params?.studentId) {
      whereConditions.push(
        `mqb.id NOT IN (SELECT question_id FROM student_mcq_attempts WHERE student_id = ?)`
      );
      queryParams.push(params.studentId);
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

    const countRow = await env.DB.prepare(countSql).bind(...queryParams).first<{ total: number }>();
    const total = countRow?.total || 0;

    const limit = Math.max(1, params?.limit || 20);
    const page = Math.max(1, params?.page || 1);
    const offset = (page - 1) * limit;

    // Ordering: RANDOM() for Random practice session, otherwise created_at DESC
    if (params?.mode === 'RANDOM') {
      sql += ` ORDER BY RANDOM() LIMIT ? OFFSET ?`;
    } else {
      sql += ` ORDER BY mqb.created_at DESC LIMIT ? OFFSET ?`;
    }

    const { results } = await env.DB.prepare(sql)
      .bind(...queryParams, limit, offset)
      .all<Record<string, unknown>>();

    if (!results || results.length === 0) {
      return { questions: [], total: 0 };
    }

    // Pre-fetch student bookmarks and attempt history if studentId is provided
    let bookmarkedQuestionIds = new Set<string>();
    let lastAttemptsMap = new Map<string, { selectedOptionId: string; isCorrect: boolean; attemptedAt: string }>();

    if (params?.studentId) {
      const bRows = await env.DB.prepare(
        `SELECT question_id FROM student_mcq_bookmarks WHERE student_id = ?`
      )
        .bind(params.studentId)
        .all<{ question_id: string }>();

      if (bRows.results) {
        bookmarkedQuestionIds = new Set(bRows.results.map(r => String(r.question_id)));
      }

      const aRows = await env.DB.prepare(
        `SELECT question_id, selected_option_id, is_correct, created_at
         FROM student_mcq_attempts
         WHERE student_id = ?
         ORDER BY created_at DESC`
      )
        .bind(params.studentId)
        .all<Record<string, unknown>>();

      if (aRows.results) {
        for (const row of aRows.results) {
          const qId = String(row.question_id);
          if (!lastAttemptsMap.has(qId)) {
            lastAttemptsMap.set(qId, {
              selectedOptionId: String(row.selected_option_id),
              isCorrect: Boolean(row.is_correct),
              attemptedAt: String(row.created_at),
            });
          }
        }
      }
    }

    const questions: StudentMcqQuestionDTO[] = results.map(row => {
      const qId = String(row.id);
      return mapRowToStudentMcqDTO(
        row,
        bookmarkedQuestionIds.has(qId),
        lastAttemptsMap.get(qId)
      );
    });

    return { questions, total };
  } catch (error) {
    console.error('Error in getMcqPracticeQuestions:', error);
    return { questions: [], total: 0 };
  }
}

/**
  Shortcut helper to fetch a random set of MCQ questions for student practice sessions.
 */
export async function getRandomMcqPracticeSession(
  env: Env,
  params?: McqPracticeFilterParams
): Promise<StudentMcqQuestionDTO[]> {
  const res = await getMcqPracticeQuestions(env, {
    ...params,
    mode: 'RANDOM',
    limit: params?.limit || 10,
  });
  return res.questions;
}

/**
  Evaluates a student's selected MCQ option and records the attempt log & progress.
 */
export async function evaluateStudentMcqAnswer(
  env: Env,
  questionId: string,
  selectedOptionId: string,
  studentId?: string,
  timeTakenSeconds?: number,
  practiceMode: 'RANDOM' | 'TOPIC_WISE' | 'PYQ_WISE' | 'CUSTOM' = 'RANDOM'
): Promise<StudentMcqAnswerEvaluation> {
  const row = await env.DB.prepare(
    `SELECT id, correct_answer_json, explanation, step_by_step_solution_json,
            subject_code, topic_name
     FROM master_question_bank
     WHERE id = ?`
  )
    .bind(questionId)
    .first<Record<string, unknown>>();

  if (!row) {
    throw new Error(`MCQ Question '${questionId}' not found`);
  }

  // Fetch mapped branch for progress aggregation
  const bRow = await env.DB.prepare(
    `SELECT branch_id FROM question_branch_mappings WHERE question_id = ? LIMIT 1`
  )
    .bind(questionId)
    .first<{ branch_id: string }>();

  const branchId = bRow?.branch_id ? String(bRow.branch_id) : 'branch_00';

  let correctAnswer = String(row.correct_answer_json || '').trim();
  try {
    const parsed = JSON.parse(correctAnswer);
    if (typeof parsed === 'string') {
      correctAnswer = parsed.trim();
    }
  } catch {
    correctAnswer = correctAnswer.replace(/^["']|["']$/g, '').trim();
  }

  const selectedClean = String(selectedOptionId || '').replace(/^["']|["']$/g, '').trim();
  const isCorrect = selectedClean.toLowerCase() === correctAnswer.toLowerCase();

  let steps: string[] | undefined;
  if (row.step_by_step_solution_json) {
    try {
      steps = JSON.parse(String(row.step_by_step_solution_json));
    } catch {
      /* empty */
    }
  }

  // Record student attempt log if studentId is provided
  if (studentId) {
    const attemptId = `sma_${crypto.randomUUID().slice(0, 12)}`;
    await env.DB.prepare(
      `INSERT INTO student_mcq_attempts (
        id, student_id, question_id, selected_option_id, is_correct, time_taken_seconds, practice_mode
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        attemptId,
        studentId,
        questionId,
        selectedClean,
        isCorrect ? 1 : 0,
        timeTakenSeconds || 0,
        practiceMode
      )
      .run();

    // Aggregate topic progress
    const subjectCode = row.subject_code ? String(row.subject_code) : 'general';
    const topicName = row.topic_name ? String(row.topic_name) : 'General';
    const progressId = `smtp_${studentId}_${branchId}_${subjectCode}_${topicName.replace(/\s+/g, '_')}`;

    await env.DB.prepare(
      `INSERT INTO student_mcq_topic_progress (
        id, student_id, branch_id, subject_code, topic_name, total_attempted, total_correct, last_practiced_at
      ) VALUES (?, ?, ?, ?, ?, 1, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(student_id, branch_id, subject_code, topic_name) DO UPDATE SET
        total_attempted = total_attempted + 1,
        total_correct = total_correct + ?,
        last_practiced_at = CURRENT_TIMESTAMP`
    )
      .bind(progressId, studentId, branchId, subjectCode, topicName, isCorrect ? 1 : 0, isCorrect ? 1 : 0)
      .run();
  }

  return {
    questionId,
    selectedOptionId: selectedClean,
    isCorrect,
    correctAnswer,
    explanation: row.explanation ? String(row.explanation) : null,
    stepByStepSolution: steps,
  };
}

/**
  Toggles bookmark status for a student on a specific MCQ question.
 */
export async function toggleMcqBookmark(
  env: Env,
  studentId: string,
  questionId: string,
  notes?: string
): Promise<{ isBookmarked: boolean }> {
  const existing = await env.DB.prepare(
    `SELECT id FROM student_mcq_bookmarks WHERE student_id = ? AND question_id = ?`
  )
    .bind(studentId, questionId)
    .first<{ id: string }>();

  if (existing) {
    await env.DB.prepare(
      `DELETE FROM student_mcq_bookmarks WHERE student_id = ? AND question_id = ?`
    )
      .bind(studentId, questionId)
      .run();
    return { isBookmarked: false };
  } else {
    const bookmarkId = `smb_${crypto.randomUUID().slice(0, 12)}`;
    await env.DB.prepare(
      `INSERT INTO student_mcq_bookmarks (id, student_id, question_id, notes)
       VALUES (?, ?, ?, ?)`
    )
      .bind(bookmarkId, studentId, questionId, notes || null)
      .run();
    return { isBookmarked: true };
  }
}

/**
  Fetches all bookmarked MCQ questions for a student.
 */
export async function getStudentMcqBookmarks(
  env: Env,
  studentId: string
): Promise<StudentMcqQuestionDTO[]> {
  const res = await getMcqPracticeQuestions(env, {
    studentId,
    isBookmarkedOnly: true,
    limit: 100,
  });
  return res.questions;
}

/**
  Fetches aggregated practice progress, accuracy percentage, and topic breakdowns for a student.
 */
export async function getStudentMcqProgressSummary(
  env: Env,
  studentId: string,
  branchId?: string,
  subjectCode?: string
): Promise<StudentMcqProgressSummary> {
  try {
    let sql = `SELECT topic_name, total_attempted, total_correct
               FROM student_mcq_topic_progress WHERE student_id = ?`;
    const params: any[] = [studentId];

    if (branchId) {
      sql += ` AND branch_id = ?`;
      params.push(resolveCanonicalBranchId(branchId));
    }
    if (subjectCode) {
      sql += ` AND subject_code = ?`;
      params.push(subjectCode);
    }

    const { results } = await env.DB.prepare(sql).bind(...params).all<Record<string, unknown>>();

    let totalAttempted = 0;
    let totalCorrect = 0;

    const topicBreakdown = (results || []).map(r => {
      const att = Number(r.total_attempted || 0);
      const corr = Number(r.total_correct || 0);
      totalAttempted += att;
      totalCorrect += corr;

      return {
        topicName: String(r.topic_name),
        totalAttempted: att,
        totalCorrect: corr,
        accuracyPercentage: att > 0 ? Number(((corr / att) * 100).toFixed(1)) : 0,
      };
    });

    const accuracyPercentage = totalAttempted > 0 ? Number(((totalCorrect / totalAttempted) * 100).toFixed(1)) : 0;

    return {
      studentId,
      branchId,
      subjectCode,
      totalAttempted,
      totalCorrect,
      accuracyPercentage,
      topicBreakdown,
    };
  } catch (error) {
    console.error('Error in getStudentMcqProgressSummary:', error);
    return {
      studentId,
      branchId,
      subjectCode,
      totalAttempted: 0,
      totalCorrect: 0,
      accuracyPercentage: 0,
      topicBreakdown: [],
    };
  }
}
