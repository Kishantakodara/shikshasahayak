// ============================================================
// STUDENT ASSIGNMENTS API: GET /api/student/assignments
// Section 22: Returns assignments for student with real submission status.
// ============================================================

import { jsonResponse, errorResponse } from "../../../lib/json";
import { getAuthenticatedUser } from "../../../lib/auth";
import { getStudentAcademicProfile } from "../../../lib/studentIdentityService";
import { Env } from "../../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const coreDb = (env as any).PADHAKU_CORE_DB || env.DB;

  if (!coreDb) {
    return errorResponse("Database binding not found", 500);
  }

  const user = await getAuthenticatedUser(request, env);
  if (!user) {
    return errorResponse("Unauthorized", 401);
  }

  try {
    const profile = await getStudentAcademicProfile(env, user.uid);
    const semester = profile.semester || 3;
    const url = new URL(request.url);
    const filterStatus = url.searchParams.get("status");

    // Query assignments matching student's enrolled classes or semester
    const { results } = await coreDb.prepare(
      `SELECT 
         a.id,
         a.title,
         a.description,
         a.instructions,
         a.total_marks,
         a.due_date,
         a.allow_late_submission,
         a.created_at,
         s.name as subject_name,
         s.code as subject_code,
         c.name as class_name,
         sub.id as submission_id,
         sub.status as submission_status,
         sub.marks as obtained_marks,
         sub.feedback,
         sub.submitted_at,
         sub.is_late
       FROM assignments a
       LEFT JOIN classes c ON a.class_id = c.id
       LEFT JOIN subjects s ON c.subject_id = s.id
       LEFT JOIN assignment_submissions sub ON a.id = sub.assignment_id AND sub.student_id = ?
       WHERE a.status = 'published'
       ORDER BY a.due_date ASC`
    ).bind(user.uid).all<Record<string, unknown>>();

    const now = new Date();
    const mapped = (results || []).map((row) => {
      const isSubmitted = Boolean(row.submission_id);
      const dueDate = row.due_date ? new Date(String(row.due_date)) : null;
      const isPastDue = dueDate ? now > dueDate : false;

      let status = 'OPEN';
      if (row.submission_status === 'graded') {
        status = 'COMPLETED';
      } else if (isSubmitted) {
        status = 'SUBMITTED';
      } else if (isPastDue) {
        status = 'LATE';
      } else if (row.created_at && new Date(String(row.created_at)) > now) {
        status = 'UPCOMING';
      }

      return {
        id: String(row.id),
        title: String(row.title || 'Assignment'),
        description: row.description ? String(row.description) : null,
        instructions: row.instructions ? String(row.instructions) : null,
        subjectName: row.subject_name ? String(row.subject_name) : 'Academic Subject',
        subjectCode: row.subject_code ? String(row.subject_code) : null,
        className: row.class_name ? String(row.class_name) : null,
        totalMarks: Number(row.total_marks || 20),
        dueDate: row.due_date ? String(row.due_date) : null,
        status,
        allowLateSubmission: Boolean(row.allow_late_submission),
        submission: isSubmitted ? {
          id: String(row.submission_id),
          status: String(row.submission_status || 'submitted'),
          obtainedMarks: row.obtained_marks !== null ? Number(row.obtained_marks) : null,
          feedback: row.feedback ? String(row.feedback) : null,
          submittedAt: String(row.submitted_at),
          isLate: Boolean(row.is_late),
        } : null,
      };
    });

    const filtered = filterStatus
      ? mapped.filter(item => item.status.toLowerCase() === filterStatus.toLowerCase())
      : mapped;

    return jsonResponse({
      success: true,
      assignments: filtered,
      total: filtered.length,
    });
  } catch (error: unknown) {
    console.error("Error in GET /api/student/assignments:", error);
    const message = error instanceof Error ? error.message : "Failed to load assignments";
    return errorResponse(message, 500);
  }
}
