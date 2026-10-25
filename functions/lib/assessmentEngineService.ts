// ============================================================
// SHIKSHA SAHAYAK OS - ASSESSMENT PORTAL EDGE SERVICE
// ============================================================

import {
  AssessmentQuizSpec,
  AssessmentQuestionSpec,
  AssessmentAttemptSpec,
} from "../../src/types/assessment-portal";
import { Env } from "./contentEngine";

/**
 * Fetches published quizzes filtered by branch, semester, or subject.
 */
export async function getAssessmentQuizzes(
  env: Env,
  filters: { branchId?: string; semester?: number; subjectId?: string }
): Promise<AssessmentQuizSpec[]> {
  try {
    let sql = `SELECT id, title, description, subject_id, branch_id, semester,
                      difficulty, duration_minutes, total_marks, passing_marks,
                      is_published, created_at
               FROM assessment_quizzes WHERE is_published = 1`;
    const params: (string | number)[] = [];

    if (filters.branchId) {
      sql += ` AND branch_id = ?`;
      params.push(filters.branchId);
    }
    if (filters.semester) {
      sql += ` AND semester = ?`;
      params.push(filters.semester);
    }
    if (filters.subjectId) {
      sql += ` AND subject_id = ?`;
      params.push(filters.subjectId);
    }

    sql += ` ORDER BY created_at DESC LIMIT 20`;

    const stmt = env.DB.prepare(sql);
    const { results } = await (params.length > 0 ? stmt.bind(...params) : stmt).all<Record<string, unknown>>();

    return (results || []).map((row) => ({
      id: String(row.id),
      title: String(row.title),
      description: row.description ? String(row.description) : null,
      subjectId: String(row.subject_id),
      branchId: String(row.branch_id),
      semester: Number(row.semester),
      difficulty: String(row.difficulty) as any,
      durationMinutes: Number(row.duration_minutes),
      totalMarks: Number(row.total_marks),
      passingMarks: Number(row.passing_marks),
      isPublished: Boolean(row.is_published),
      createdAt: String(row.created_at),
    }));
  } catch (error) {
    console.error("Error in getAssessmentQuizzes:", error);
    return [];
  }
}

/**
 * Fetches questions for a quiz.
 */
export async function getQuizQuestions(
  env: Env,
  quizId: string,
  isTeacherOrAdmin: boolean = false
): Promise<AssessmentQuestionSpec[]> {
  try {
    const { results } = await env.DB.prepare(
      `SELECT id, quiz_id, question_text, options_json, correct_option_index, explanation, marks, topic_id, created_at
       FROM assessment_questions
       WHERE quiz_id = ?
       ORDER BY created_at ASC`
    )
      .bind(quizId)
      .all<Record<string, unknown>>();

    return (results || []).map((row) => ({
      id: String(row.id),
      quizId: String(row.quiz_id),
      questionText: String(row.question_text),
      options: row.options_json ? JSON.parse(String(row.options_json)) : [],
      correctOptionIndex: isTeacherOrAdmin ? Number(row.correct_option_index) : undefined as any,
      explanation: isTeacherOrAdmin ? (row.explanation ? String(row.explanation) : null) : undefined as any,
      marks: Number(row.marks),
      topicId: row.topic_id ? String(row.topic_id) : null,
      createdAt: String(row.created_at),
    }));
  } catch (error) {
    console.error("Error in getQuizQuestions:", error);
    return [];
  }
}

/**
 * Evaluates and saves a student assessment attempt.
 */
export async function submitAssessmentAttempt(
  env: Env,
  userId: string,
  quizId: string,
  studentAnswers: Record<string, number>,
  timeTakenSeconds: number
): Promise<AssessmentAttemptSpec | null> {
  try {
    const questions = await getQuizQuestions(env, quizId);
    let totalMarks = 0;
    let score = 0;
    let correctCount = 0;

    questions.forEach((q) => {
      totalMarks += q.marks;
      if (studentAnswers[q.id] === q.correctOptionIndex) {
        score += q.marks;
        correctCount += 1;
      }
    });

    const accuracyPercent = questions.length > 0
      ? Number(((correctCount / questions.length) * 100).toFixed(1))
      : 0;

    const id = `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    await env.DB.prepare(
      `INSERT INTO assessment_attempts (
        id, user_id, quiz_id, score, total_marks, accuracy_percent,
        time_taken_seconds, answers_json, strong_topics_json, weak_topics_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        userId,
        quizId,
        score,
        totalMarks || 10,
        accuracyPercent,
        timeTakenSeconds,
        JSON.stringify(studentAnswers),
        JSON.stringify(["Process Scheduling", "CPU Allocation"]),
        JSON.stringify(["Semaphore Deadlocks"])
      )
      .run();

    return {
      id,
      userId,
      quizId,
      score,
      totalMarks: totalMarks || 10,
      accuracyPercent,
      timeTakenSeconds,
      answers: studentAnswers,
      strongTopics: ["Process Scheduling", "CPU Allocation"],
      weakTopics: ["Semaphore Deadlocks"],
      completedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error in submitAssessmentAttempt:", error);
    return null;
  }
}
