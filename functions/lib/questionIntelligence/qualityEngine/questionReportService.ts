// ============================================================
// QUESTION QUALITY ENGINE - REPORT SERVICE
// Manages student report filing, duplicate report prevention,
// admin report list queries, and resolution workflows.
// ============================================================

import { Env } from '../../contentEngine';
import { evaluateQuestionQuality } from './questionQualityScoringService';

export interface SubmitReportOptions {
  questionId: string;
  studentId: string;
  reportType: 'WRONG_ANSWER' | 'AMBIGUOUS' | 'TYPO' | 'BROKEN_LATEX' | 'INCORRECT_EXPLANATION' | 'DUPLICATE' | 'OUT_OF_SYLLABUS' | 'TECHNICAL_ERROR' | 'OTHER';
  message?: string;
}

export interface QuestionReportRecord {
  id: string;
  question_id: string;
  student_id: string;
  report_type: string;
  message?: string;
  status: string;
  resolved_by?: string;
  resolved_at?: string;
  resolution_note?: string;
  created_at: string;
}

export async function submitStudentReport(
  env: Env,
  options: SubmitReportOptions
): Promise<{ success: boolean; reportId?: string; isDuplicate?: boolean }> {
  const existing = await env.DB.prepare(
    `SELECT id FROM question_issue_reports WHERE question_id = ? AND student_id = ? AND report_type = ?`
  )
    .bind(options.questionId, options.studentId, options.reportType)
    .first<{ id: string }>();

  if (existing) {
    return { success: false, isDuplicate: true };
  }

  const reportId = `qir_${crypto.randomUUID().slice(0, 12)}`;

  await env.DB.prepare(
    `INSERT INTO question_issue_reports (id, question_id, student_id, report_type, message, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'OPEN', CURRENT_TIMESTAMP)`
  )
    .bind(reportId, options.questionId, options.studentId, options.reportType, options.message || null)
    .run();

  // Log audit event
  const qeId = `qqe_${crypto.randomUUID().slice(0, 10)}`;
  await env.DB.prepare(
    `INSERT INTO question_quality_events (id, question_id, actor_id, actor_role, event_type, reason)
     VALUES (?, ?, ?, 'student', 'REPORT_FILED', ?)`
  )
    .bind(qeId, options.questionId, options.studentId, `Filed report ${options.reportType}`)
    .run();

  // Recalculate Quality Score
  await evaluateQuestionQuality(env, options.questionId);

  return { success: true, reportId };
}

export async function listQuestionReports(
  env: Env,
  filters: { status?: string; questionId?: string; limit?: number; offset?: number } = {}
): Promise<{ reports: Record<string, unknown>[]; total: number }> {
  const limit = filters.limit || 20;
  const offset = filters.offset || 0;

  let sql = `SELECT r.*, q.question_text, q.subject_code, q.subject_name
             FROM question_issue_reports r
             JOIN master_question_bank q ON r.question_id = q.id WHERE 1=1`;
  const params: any[] = [];

  if (filters.status) {
    sql += ` AND r.status = ?`;
    params.push(filters.status);
  }

  if (filters.questionId) {
    sql += ` AND r.question_id = ?`;
    params.push(filters.questionId);
  }

  sql += ` ORDER BY r.created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const { results } = await env.DB.prepare(sql).bind(...params).all<Record<string, unknown>>();

  const countRes = await env.DB.prepare(`SELECT COUNT(*) as total FROM question_issue_reports`).first<{ total: number }>();

  return {
    reports: results || [],
    total: countRes?.total || 0,
  };
}

export async function resolveQuestionReport(
  env: Env,
  reportId: string,
  adminId: string,
  resolution: 'RESOLVED' | 'DISMISSED',
  note?: string
): Promise<{ success: boolean }> {
  const rep = await env.DB.prepare(`SELECT question_id FROM question_issue_reports WHERE id = ?`)
    .bind(reportId)
    .first<{ question_id: string }>();

  if (!rep) throw new Error(`Report '${reportId}' not found`);

  await env.DB.prepare(
    `UPDATE question_issue_reports SET
      status = ?, resolved_by = ?, resolved_at = CURRENT_TIMESTAMP, resolution_note = ?
     WHERE id = ?`
  )
    .bind(resolution, adminId, note || null, reportId)
    .run();

  // Log audit event
  const qeId = `qqe_${crypto.randomUUID().slice(0, 10)}`;
  await env.DB.prepare(
    `INSERT INTO question_quality_events (id, question_id, actor_id, actor_role, event_type, reason)
     VALUES (?, ?, ?, 'admin', 'REPORT_RESOLVED', ?)`
  )
    .bind(qeId, rep.question_id, adminId, `Report ${reportId} marked as ${resolution}`)
    .run();

  // Recalculate Quality Score
  await evaluateQuestionQuality(env, rep.question_id);

  return { success: true };
}
