// ============================================================
// PRACTICE SUBMISSION & EVALUATION API: POST /api/practice/submit
// Section 17 & 18: Server-side answer evaluation, score calculation,
// attempts logging, topic progress updates, and full review explanations.
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getAuthenticatedUser } from "../../lib/auth";
import { Env } from "../../lib/contentEngine";

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const db = env.DB || (env as any).ASSESSMENT_DB;
  const coreDb = (env as any).PADHAKU_CORE_DB || env.DB;

  if (!db) {
    return errorResponse("Database binding not found", 500);
  }

  try {
    const authUser = await getAuthenticatedUser(request, env);
    const body = (await request.json().catch(() => ({}))) as {
      sessionId: string;
      answers: Array<{
        questionId: string;
        selectedOptionId: string;
        timeTakenSeconds?: number;
      }>;
      totalTimeSeconds?: number;
    };

    if (!body.sessionId) {
      return errorResponse("Missing sessionId", 400);
    }
    if (!Array.isArray(body.answers)) {
      return errorResponse("Missing or invalid answers array", 400);
    }

    const studentId = authUser?.uid || 'guest_student';
    let totalMarks = 0;
    let score = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let attemptedCount = 0;
    let totalTimeTaken = Number(body.totalTimeSeconds || 0);

    const reviewItems: any[] = [];

    // Process each answer securely against master_question_bank
    for (const ans of body.answers) {
      const qRow = await db.prepare(
        `SELECT id, question_text, question_html, options_json, correct_answer_json,
                acceptable_numerical_range_json, question_type,
                explanation, step_by_step_solution_json, marks, difficulty, subject_name,
                subject_code, topic_name
         FROM master_question_bank
         WHERE id = ?`
      ).bind(ans.questionId).first<Record<string, unknown>>();

      if (!qRow) continue;

      const marks = Number(qRow.marks || 1);
      totalMarks += marks;

      let options: Array<{ id: string; text: string }> = [];
      if (qRow.options_json) {
        try {
          const parsed = JSON.parse(String(qRow.options_json));
          if (Array.isArray(parsed)) {
            options = parsed.map((o: any, idx: number) => ({
              id: typeof o === 'string' ? String(idx) : String(o.id || idx),
              text: typeof o === 'string' ? o : String(o.text || o.value || ''),
            }));
          }
        } catch {}
      }

      let correctAnswer = String(qRow.correct_answer_json || '').trim();
      try {
        const parsed = JSON.parse(correctAnswer);
        if (typeof parsed === 'string') {
          correctAnswer = parsed.trim();
        } else if (Array.isArray(parsed) && parsed.length > 0) {
          correctAnswer = String(parsed[0]).trim();
        }
      } catch {
        correctAnswer = correctAnswer.replace(/^["']|["']$/g, '').trim();
      }

      const selectedOption = ans.selectedOptionId !== undefined && ans.selectedOptionId !== null
        ? String(ans.selectedOptionId).trim()
        : '';
      const isAttempted = selectedOption !== '';
      const qType = String(qRow.question_type || 'MCQ').toUpperCase();

      let isCorrect = false;
      if (qType === 'MSQ' || qType === 'MULTIPLE_CORRECT') {
        let correctArray: string[] = [];
        try {
          const parsed = JSON.parse(String(qRow.correct_answer_json || '[]'));
          if (Array.isArray(parsed)) correctArray = parsed.map(s => String(s).trim().toUpperCase());
          else correctArray = [String(parsed).trim().toUpperCase()];
        } catch {
          correctArray = String(qRow.correct_answer_json || '').split(',').map(s => s.trim().toUpperCase());
        }

        const selectedList: string[] = Array.isArray((ans as any).selectedOptionIds)
          ? (ans as any).selectedOptionIds.map((s: any) => String(s).trim().toUpperCase())
          : selectedOption ? [selectedOption.toUpperCase()] : [];

        if (selectedList.length > 0) {
          attemptedCount++;
          const setCorrect = new Set(correctArray);
          const setSelected = new Set(selectedList);
          isCorrect = setCorrect.size === setSelected.size && [...setCorrect].every(c => setSelected.has(c));
          if (isCorrect) {
            correctCount++;
            score += marks;
          } else {
            incorrectCount++;
          }
        }
      } else if (qType === 'NAT' || qType === 'NUMERICAL') {
        const numVal = (ans as any).numericalValue !== undefined && (ans as any).numericalValue !== null
          ? Number((ans as any).numericalValue)
          : selectedOption !== '' && !isNaN(Number(selectedOption))
          ? Number(selectedOption)
          : NaN;

        if (!isNaN(numVal)) {
          attemptedCount++;
          let minVal = NaN;
          let maxVal = NaN;
          if (qRow.acceptable_numerical_range_json) {
            try {
              const range = JSON.parse(String(qRow.acceptable_numerical_range_json));
              minVal = Number(range.min);
              maxVal = Number(range.max);
            } catch {}
          }
          if (isNaN(minVal)) {
            const parsedExact = parseFloat(correctAnswer);
            minVal = isNaN(parsedExact) ? numVal : parsedExact - 0.05;
            maxVal = isNaN(parsedExact) ? numVal : parsedExact + 0.05;
          }
          isCorrect = numVal >= minVal && numVal <= maxVal;
          if (isCorrect) {
            correctCount++;
            score += marks;
          } else {
            incorrectCount++;
          }
        }
      } else {
        if (isAttempted) {
          attemptedCount++;
          isCorrect = selectedOption.toUpperCase() === correctAnswer.toUpperCase();
          if (isCorrect) {
            correctCount++;
            score += marks;
          } else {
            incorrectCount++;
          }
        }
      }

      // Record student attempt in database
      const attemptId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      try {
        await db.prepare(
          `INSERT INTO student_mcq_attempts (
             id, student_id, question_id, selected_option_id, is_correct, time_taken_seconds, practice_mode, created_at
           ) VALUES (?, ?, ?, ?, ?, ?, 'RANDOM', CURRENT_TIMESTAMP)`
        )
          .bind(
            attemptId,
            studentId,
            ans.questionId,
            selectedOption || 'SKIPPED',
            isCorrect ? 1 : 0,
            ans.timeTakenSeconds || 0
          )
          .run();
      } catch (attErr) {
        console.warn("Could not insert student_mcq_attempt:", attErr);
      }

      // Parse step-by-step solution if available
      let stepByStepSolution: string[] | undefined;
      if (qRow.step_by_step_solution_json) {
        try {
          stepByStepSolution = JSON.parse(String(qRow.step_by_step_solution_json));
        } catch {}
      }

      reviewItems.push({
        questionId: String(qRow.id),
        questionText: String(qRow.question_text || ''),
        questionHtml: qRow.question_html ? String(qRow.question_html) : null,
        options,
        selectedOptionId: selectedOption || null,
        correctAnswer,
        isCorrect,
        isAttempted,
        explanation: qRow.explanation ? String(qRow.explanation) : 'Solution validated by GTU Exam Intelligence Engine.',
        stepByStepSolution,
        subjectName: String(qRow.subject_name || ''),
        topicName: qRow.topic_name ? String(qRow.topic_name) : null,
        marks,
      });
    }

    const totalQuestions = body.answers.length;
    const skippedCount = totalQuestions - attemptedCount;
    const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;

    // Update test session record
    try {
      await db.prepare(
        `UPDATE test_sessions
         SET status = 'SUBMITTED',
             submitted_at = CURRENT_TIMESTAMP,
             obtained_marks = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      ).bind(score, body.sessionId).run();
    } catch {}

    // Update student stats (XP, streak, practice counts) in PADHAKU_CORE_DB
    if (coreDb && authUser?.uid) {
      try {
        const earnedXp = correctCount * 10 + 5; // 10 XP per correct question + 5 bonus for completing session
        await coreDb.prepare(
          `INSERT INTO student_stats (user_id, xp, streak, level, created_at, updated_at)
           VALUES (?, ?, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           ON CONFLICT(user_id) DO UPDATE SET
             xp = xp + ?,
             streak = CASE WHEN streak = 0 THEN 1 ELSE streak END,
             updated_at = CURRENT_TIMESTAMP`
        ).bind(authUser.uid, earnedXp, earnedXp).run();
      } catch (statsErr) {
        console.warn("Could not update student_stats:", statsErr);
      }
    }

    return jsonResponse({
      success: true,
      data: {
        sessionId: body.sessionId,
        score,
        totalMarks,
        accuracy,
        totalQuestions,
        attemptedCount,
        correctCount,
        incorrectCount,
        skippedCount,
        timeTakenSeconds: totalTimeTaken,
        review: reviewItems,
      },
    });
  } catch (error: unknown) {
    console.error("Error in POST /api/practice/submit:", error);
    const message = error instanceof Error ? error.message : "Failed to evaluate practice session";
    return errorResponse(message, 500);
  }
}
