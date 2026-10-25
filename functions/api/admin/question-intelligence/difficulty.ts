// ============================================================
// GET /api/admin/question-intelligence/difficulty
// Structural Difficulty Intelligence & Complexity Breakdown
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
    const subjectCode = url.searchParams.get('subjectCode') || undefined;

    // Difficulty Distribution
    let sql = `
      SELECT 
        COUNT(*) as total_questions,
        SUM(CASE WHEN LOWER(difficulty) = 'easy' THEN 1 ELSE 0 END) as easy_count,
        SUM(CASE WHEN LOWER(difficulty) = 'medium' THEN 1 ELSE 0 END) as medium_count,
        SUM(CASE WHEN LOWER(difficulty) = 'hard' THEN 1 ELSE 0 END) as hard_count,
        AVG(marks) as avg_marks
       FROM master_question_bank
       WHERE 1=1
    `;
    const params: any[] = [];
    if (subjectCode) {
      sql += ` AND subject_code = ?`;
      params.push(subjectCode);
    }

    const distRow = await context.env.DB.prepare(sql).bind(...params).first<{
      total_questions: number;
      easy_count: number;
      medium_count: number;
      hard_count: number;
      avg_marks: number;
    }>();

    // Subject breakdown
    const subjRows = await context.env.DB.prepare(
      `SELECT 
        subject_code, subject_name,
        COUNT(*) as total,
        SUM(CASE WHEN LOWER(difficulty) = 'easy' THEN 1 ELSE 0 END) as easy,
        SUM(CASE WHEN LOWER(difficulty) = 'medium' THEN 1 ELSE 0 END) as medium,
        SUM(CASE WHEN LOWER(difficulty) = 'hard' THEN 1 ELSE 0 END) as hard,
        AVG(marks) as avg_marks
       FROM master_question_bank
       GROUP BY subject_code`
    ).all<Record<string, unknown>>();

    return jsonResponse({
      success: true,
      summary: {
        totalQuestions: Number(distRow?.total_questions || 0),
        averageMarks: Number(distRow?.avg_marks || 1).toFixed(1),
        distribution: {
          easy: Number(distRow?.easy_count || 0),
          medium: Number(distRow?.medium_count || 0),
          hard: Number(distRow?.hard_count || 0),
        },
      },
      subjectBreakdown: subjRows.results || [],
      complexityNotice: 'Difficulty ratings reflect structural/rubric complexity from GTU question papers and do not represent student performance difficulty.',
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch difficulty intelligence', 500);
  }
}
