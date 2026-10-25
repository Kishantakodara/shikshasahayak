// ============================================================
// GET /api/admin/question-intelligence/operations
// GTU Ingestion Operations Panel & Concurrency Safety Limits
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

    let jobs: any[] = [];
    try {
      const jobRows = await context.env.DB.prepare(
        `SELECT job_id as id, subject_code, status, current_stage as stage,
                total_items as total_questions_extracted, error_summary as error_message,
                started_at, completed_at, updated_at
         FROM question_pipeline_jobs
         ORDER BY updated_at DESC LIMIT 30`
      ).all<Record<string, unknown>>();
      jobs = jobRows.results || [];
    } catch {
      jobs = [];
    }

    const completedCount = jobs.filter(j => j.status === 'COMPLETED').length;
    const failedCount = jobs.filter(j => j.status === 'FAILED').length;
    const activeCount = jobs.filter(j => j.status === 'IN_PROGRESS' || j.status === 'QUEUED').length;

    // Concurrency and batch safety limits constants
    const safetyLimits = {
      MAX_PAPERS_PER_INGESTION_RUN: 20,
      MAX_QUESTIONS_PER_BATCH: 100,
      MAX_PDF_SIZE_BYTES: 15 * 1024 * 1024,
      MAX_PDF_PAGE_COUNT: 25,
      MAX_EXTRACTED_TEXT_BYTES: 500 * 1024,
      CONCURRENT_PAPER_FETCH_LIMIT: 3,
      MAX_RETRY_COUNT: 3,
    };

    return jsonResponse({
      success: true,
      summary: {
        totalTrackedJobs: jobs.length,
        completedJobs: completedCount,
        failedJobs: failedCount,
        activeJobs: activeCount,
      },
      safetyLimits,
      recentJobs: jobs,
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch ingestion operations status', 500);
  }
}
