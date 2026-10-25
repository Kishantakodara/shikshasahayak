// ============================================================
// PRACTICE SESSION API: /api/practice/session
// Section 16 & 17: Creates and retrieves secure student practice sessions.
// Pre-submission question options are served WITHOUT exposing correct answers.
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getAuthenticatedUser } from "../../lib/auth";
import { Env } from "../../lib/contentEngine";

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const db = env.DB || (env as any).ASSESSMENT_DB;

  if (!db) {
    return errorResponse("Database binding not found", 500);
  }

  try {
    const authUser = await getAuthenticatedUser(request, env);
    const body = (await request.json().catch(() => ({}))) as {
      subjectCode?: string;
      subjectName?: string;
      branchId?: string;
      semester?: number;
      topicName?: string;
      difficulty?: string;
      questionCount?: number;
      durationMinutes?: number;
      sourceMode?: 'GTU_PYQ' | 'GATE_PYQ' | 'PRACTICE' | 'ALL';
      practiceMode?: 'RANDOM' | 'TOPIC_WISE' | 'PYQ_WISE' | 'CUSTOM';
    };

    const studentId = authUser?.uid || 'guest_student';
    const questionLimit = Math.min(50, Math.max(5, Number(body.questionCount || 10)));
    const durationMin = Number(body.durationMinutes || Math.round(questionLimit * 1.5));
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const isGate = body.sourceMode === 'GATE_PYQ' || (body as any).examName?.includes('GATE');
    const allowedTypes = isGate
      ? `('MCQ', 'MSQ', 'NAT', 'SINGLE_CORRECT', 'MULTIPLE_CORRECT', 'NUMERICAL')`
      : `('MCQ', 'SINGLE_CORRECT')`;

    // Build question query
    let whereClauses = [
      `mqb.verification_status = 'verified'`,
      `mqb.question_type IN ${allowedTypes}`,
    ];
    let queryParams: any[] = [];

    if (body.subjectCode) {
      whereClauses.push(`mqb.subject_code = ?`);
      queryParams.push(body.subjectCode);
    }
    if (body.semester && !isGate) {
      whereClauses.push(`mqb.semester = ?`);
      queryParams.push(Number(body.semester));
    }
    if (body.topicName) {
      whereClauses.push(`mqb.topic_name LIKE ?`);
      queryParams.push(`%${body.topicName}%`);
    }
    if (body.difficulty) {
      whereClauses.push(`mqb.difficulty = ?`);
      queryParams.push(body.difficulty.toLowerCase());
    }
    if (body.sourceMode === 'GTU_PYQ') {
      whereClauses.push(`mqb.source_type = 'GTU' AND mqb.is_original_pyq = 1`);
    } else if (body.sourceMode === 'GATE_PYQ' || isGate) {
      whereClauses.push(`(mqb.source_type = 'GATE' OR mqb.exam_name LIKE '%GATE%')`);
    }

    let qSql = `SELECT mqb.id, mqb.question_text, mqb.question_html, mqb.question_image_url,
                       mqb.options_json, mqb.difficulty, mqb.marks, mqb.subject_name,
                       mqb.subject_code, mqb.topic_name, mqb.exam_name, mqb.exam_year,
                       mqb.question_type
                FROM master_question_bank mqb
                WHERE ${whereClauses.join(' AND ')}
                ORDER BY RANDOM()
                LIMIT ?`;
    queryParams.push(questionLimit);

    let { results: qRows } = await db.prepare(qSql).bind(...queryParams).all<Record<string, unknown>>();

    // Fallback 1: If 0 questions found with strict filters, relax topic and difficulty
    if ((!qRows || qRows.length === 0) && body.subjectCode) {
      const fallbackSql = `SELECT mqb.id, mqb.question_text, mqb.question_html, mqb.question_image_url,
                                  mqb.options_json, mqb.difficulty, mqb.marks, mqb.subject_name,
                                  mqb.subject_code, mqb.topic_name, mqb.exam_name, mqb.exam_year
                           FROM master_question_bank mqb
                           WHERE mqb.verification_status = 'verified'
                             AND mqb.question_type IN ('MCQ', 'SINGLE_CORRECT')
                             AND mqb.subject_code = ?
                           ORDER BY RANDOM()
                           LIMIT ?`;
      const fallbackRes = await db.prepare(fallbackSql).bind(body.subjectCode, questionLimit).all<Record<string, unknown>>();
      qRows = fallbackRes.results;
    }

    // Fallback 2: Any verified MCQs in the semester
    if ((!qRows || qRows.length === 0) && body.semester) {
      const semFallbackSql = `SELECT mqb.id, mqb.question_text, mqb.question_html, mqb.question_image_url,
                                     mqb.options_json, mqb.difficulty, mqb.marks, mqb.subject_name,
                                     mqb.subject_code, mqb.topic_name, mqb.exam_name, mqb.exam_year
                              FROM master_question_bank mqb
                              WHERE mqb.verification_status = 'verified'
                                AND mqb.question_type IN ('MCQ', 'SINGLE_CORRECT')
                                AND mqb.semester = ?
                              ORDER BY RANDOM()
                              LIMIT ?`;
      const semRes = await db.prepare(semFallbackSql).bind(Number(body.semester), questionLimit).all<Record<string, unknown>>();
      qRows = semRes.results;
    }

    // Fallback 3: Random verified MCQs from repository
    if (!qRows || qRows.length === 0) {
      const generalRes = await db.prepare(
        `SELECT mqb.id, mqb.question_text, mqb.question_html, mqb.question_image_url,
                mqb.options_json, mqb.difficulty, mqb.marks, mqb.subject_name,
                mqb.subject_code, mqb.topic_name, mqb.exam_name, mqb.exam_year
         FROM master_question_bank mqb
         WHERE mqb.verification_status = 'verified'
           AND mqb.question_type IN ('MCQ', 'SINGLE_CORRECT')
         ORDER BY RANDOM()
         LIMIT ?`
      ).bind(questionLimit).all<Record<string, unknown>>();
      qRows = generalRes.results;
    }

    const questions = (qRows || []).map((row, idx) => {
      let options: Array<{ id: string; text: string; imageUrl?: string }> = [];
      if (row.options_json) {
        try {
          const parsed = JSON.parse(String(row.options_json));
          if (Array.isArray(parsed)) {
            options = parsed.map((opt: any, optIdx: number) => ({
              id: typeof opt === 'string' ? String(optIdx) : String(opt.id || optIdx),
              text: typeof opt === 'string' ? opt : String(opt.text || opt.value || ''),
              imageUrl: opt.imageUrl ? String(opt.imageUrl) : undefined,
            }));
          }
        } catch {}
      }

      return {
        id: String(row.id),
        sequenceNumber: idx + 1,
        questionText: String(row.question_text || ''),
        questionHtml: row.question_html ? String(row.question_html) : null,
        questionImageUrl: row.question_image_url ? String(row.question_image_url) : null,
        options,
        difficulty: String(row.difficulty || 'medium'),
        marks: Number(row.marks || 1),
        subjectName: String(row.subject_name || ''),
        subjectCode: row.subject_code ? String(row.subject_code) : null,
        topicName: row.topic_name ? String(row.topic_name) : null,
        examName: row.exam_name ? String(row.exam_name) : null,
        examYear: row.exam_year ? Number(row.exam_year) : null,
        questionType: String(row.question_type || 'MCQ'),
      };
    });

    // Create session in test_sessions table
    const startedAt = new Date().toISOString();
    try {
      await db.prepare(
        `INSERT INTO test_sessions (
           id, student_id, test_type, source_mode, status, question_count,
           duration_minutes, total_marks, started_at, created_at, updated_at
         ) VALUES (?, ?, ?, ?, 'IN_PROGRESS', ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      )
        .bind(
          sessionId,
          studentId,
          body.practiceMode || 'PRACTICE',
          body.sourceMode || 'ALL',
          questions.length,
          durationMin,
          questions.reduce((acc, q) => acc + q.marks, 0),
          startedAt
        )
        .run();

      // Store question mappings for this session
      for (const q of questions) {
        await db.prepare(
          `INSERT OR IGNORE INTO test_session_questions (
             test_session_id, question_id, sequence_number, marks
           ) VALUES (?, ?, ?, ?)`
        )
          .bind(sessionId, q.id, q.sequenceNumber, q.marks)
          .run();
      }
    } catch (dbErr) {
      console.warn("Could not persist test session row, continuing with in-memory session:", dbErr);
    }

    return jsonResponse({
      success: true,
      data: {
        sessionId,
        questions,
        totalQuestions: questions.length,
        durationMinutes: durationMin,
        startedAt,
        studentId,
      },
    });
  } catch (error: unknown) {
    console.error("Error in POST /api/practice/session:", error);
    const message = error instanceof Error ? error.message : "Failed to create practice session";
    return errorResponse(message, 500);
  }
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const db = env.DB || (env as any).ASSESSMENT_DB;
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");

  if (!sessionId) {
    return errorResponse("Missing sessionId parameter", 400);
  }

  if (!db) {
    return errorResponse("Database binding not found", 500);
  }

  try {
    const sessionRow = await db.prepare(
      `SELECT * FROM test_sessions WHERE id = ?`
    ).bind(sessionId).first<Record<string, unknown>>();

    if (!sessionRow) {
      return errorResponse("Session not found", 404);
    }

    const qRows = await db.prepare(
      `SELECT tsq.sequence_number, tsq.marks, tsq.selected_answer,
              mqb.id, mqb.question_text, mqb.question_html, mqb.question_image_url,
              mqb.options_json, mqb.difficulty, mqb.subject_name, mqb.subject_code, mqb.topic_name,
              mqb.question_type
       FROM test_session_questions tsq
       JOIN master_question_bank mqb ON tsq.question_id = mqb.id
       WHERE tsq.test_session_id = ?
       ORDER BY tsq.sequence_number ASC`
    ).bind(sessionId).all<Record<string, unknown>>();

    const questions = (qRows.results || []).map(row => {
      let options: Array<{ id: string; text: string }> = [];
      if (row.options_json) {
        try {
          const parsed = JSON.parse(String(row.options_json));
          if (Array.isArray(parsed)) {
            options = parsed.map((o: any, idx: number) => ({
              id: typeof o === 'string' ? String(idx) : String(o.id || idx),
              text: typeof o === 'string' ? o : String(o.text || o.value || ''),
            }));
          }
        } catch {}
      }

      return {
        id: String(row.id),
        sequenceNumber: Number(row.sequence_number),
        questionText: String(row.question_text || ''),
        questionHtml: row.question_html ? String(row.question_html) : null,
        questionImageUrl: row.question_image_url ? String(row.question_image_url) : null,
        options,
        difficulty: String(row.difficulty || 'medium'),
        marks: Number(row.marks || 1),
        subjectName: String(row.subject_name || ''),
        subjectCode: row.subject_code ? String(row.subject_code) : null,
        topicName: row.topic_name ? String(row.topic_name) : null,
        selectedAnswer: row.selected_answer ? String(row.selected_answer) : null,
        questionType: String(row.question_type || 'MCQ'),
      };
    });

    return jsonResponse({
      success: true,
      data: {
        sessionId,
        status: sessionRow.status,
        durationMinutes: sessionRow.duration_minutes,
        startedAt: sessionRow.started_at,
        questions,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to retrieve session";
    return errorResponse(message, 500);
  }
}
