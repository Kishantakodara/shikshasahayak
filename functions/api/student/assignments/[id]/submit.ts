// ============================================================
// STUDENT ASSIGNMENT SUBMISSION API: POST /api/student/assignments/:id/submit
// Section 22: Enforces submission policies, records submission, links attachments.
// ============================================================

import { jsonResponse, errorResponse } from "../../../../lib/json";
import { getAuthenticatedUser } from "../../../../lib/auth";
import { Env } from "../../../../lib/contentEngine";

export async function onRequestPost(context: {
  request: Request;
  env: Env;
  params: { id?: string };
}) {
  const { request, env, params } = context;
  const assignmentId = params.id;
  const coreDb = (env as any).PADHAKU_CORE_DB || env.DB;

  if (!assignmentId) {
    return errorResponse("Missing assignment ID", 400);
  }

  if (!coreDb) {
    return errorResponse("Database binding not found", 500);
  }

  const user = await getAuthenticatedUser(request, env);
  if (!user) {
    return errorResponse("Unauthorized", 401);
  }

  try {
    // 1. Verify assignment exists and is active
    const assignment = await coreDb.prepare(
      `SELECT id, title, due_date, allow_late_submission, status FROM assignments WHERE id = ?`
    ).bind(assignmentId).first<Record<string, unknown>>();

    if (!assignment) {
      return errorResponse("Assignment not found", 404);
    }

    if (String(assignment.status) !== 'published') {
      return errorResponse("Assignment is not open for submissions", 400);
    }

    const now = new Date();
    const dueDate = assignment.due_date ? new Date(String(assignment.due_date)) : null;
    const isLate = dueDate ? now > dueDate : false;

    if (isLate && !assignment.allow_late_submission) {
      return errorResponse("Submission deadline has passed and late submissions are not allowed", 403);
    }

    const body = (await request.json().catch(() => ({}))) as {
      textContent?: string;
      attachments?: string[];
      externalLinks?: string[];
    };

    const textContent = body.textContent ? String(body.textContent).trim() : null;
    const attachments = Array.isArray(body.attachments) ? JSON.stringify(body.attachments) : null;
    const externalLinks = Array.isArray(body.externalLinks) ? JSON.stringify(body.externalLinks) : null;

    if (!textContent && !attachments && !externalLinks) {
      return errorResponse("Submission must contain text content, attachments, or links", 400);
    }

    const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Upsert submission
    await coreDb.prepare(
      `INSERT INTO assignment_submissions (
         id, assignment_id, student_id, status, text_content, attachments,
         external_links, submitted_at, is_late, created_at, updated_at
       ) VALUES (?, ?, ?, 'submitted', ?, ?, ?, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT(id) DO UPDATE SET
         text_content = excluded.text_content,
         attachments = excluded.attachments,
         external_links = excluded.external_links,
         submitted_at = CURRENT_TIMESTAMP,
         is_late = excluded.is_late,
         resubmit_count = resubmit_count + 1,
         updated_at = CURRENT_TIMESTAMP`
    )
      .bind(
        submissionId,
        assignmentId,
        user.uid,
        textContent,
        attachments,
        externalLinks,
        isLate ? 1 : 0
      )
      .run();

    return jsonResponse({
      success: true,
      message: isLate ? "Assignment submitted (Late Submission)" : "Assignment submitted successfully",
      submissionId,
      status: "submitted",
      isLate,
      submittedAt: now.toISOString(),
    });
  } catch (error: unknown) {
    console.error("Error submitting assignment:", error);
    const message = error instanceof Error ? error.message : "Failed to submit assignment";
    return errorResponse(message, 500);
  }
}
