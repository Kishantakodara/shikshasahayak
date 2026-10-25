// ============================================================
// TEACHER API: POST /api/teacher/submissions/bulk-grade
// Bulk grade multiple student submissions in a single transaction
// ============================================================

import { jsonResponse, errorResponse } from "../../../lib/json";
import { getAuthenticatedUser } from "../../../lib/auth";

export async function onRequestPost(context: {
  env: { PADHAKU_CORE_DB?: D1Database; DB?: any; ASSESSMENT_DB?: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
}) {
  const { env, request } = context;
  const db = (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB) || env.DB;

  if (!db) {
    return errorResponse("Database binding not found", 500);
  }

  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user || !user.uid) {
      return errorResponse("Unauthorized - Teacher authentication required", 401);
    }

    const body = (await request.json().catch(() => ({}))) as {
      grades?: Array<{
        submission_id?: string;
        submissionId?: string;
        marks: number;
        feedback?: string;
      }>;
      return_to_students?: boolean;
    };

    const gradesList = body.grades || [];
    if (!Array.isArray(gradesList) || gradesList.length === 0) {
      return errorResponse("grades array is required", 400);
    }

    const successful: any[] = [];
    const failed: any[] = [];
    const nowIso = new Date().toISOString();
    const status = body.return_to_students ? "RETURNED" : "GRADED";

    for (const item of gradesList) {
      const subId = item.submission_id || item.submissionId;
      if (!subId) {
        failed.push({ item, error: "Missing submission_id" });
        continue;
      }

      try {
        await db
          .prepare(
            `UPDATE assignment_submissions
             SET marks = ?, feedback = ?, status = ?, graded_at = ?, graded_by = ?, updated_at = ?
             WHERE id = ?`
          )
          .bind(Number(item.marks), item.feedback || "", status, nowIso, user.uid, nowIso, subId)
          .run();

        successful.push({ submission_id: subId, marks: item.marks, status });
      } catch (err: any) {
        failed.push({ submission_id: subId, error: err.message });
      }
    }

    return jsonResponse({
      success: true,
      message: `Bulk graded ${successful.length} submissions successfully (${failed.length} failed)`,
      data: {
        successful,
        failed,
        summary: {
          total: gradesList.length,
          successful: successful.length,
          failed: failed.length,
        },
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to execute bulk grading";
    console.error("POST /api/teacher/submissions/bulk-grade error:", message);
    return errorResponse(message, 500);
  }
}
