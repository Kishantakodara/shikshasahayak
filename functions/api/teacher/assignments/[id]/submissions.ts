import { jsonResponse, errorResponse } from "../../../../lib/json";
import { getAuthenticatedUser } from "../../../../lib/auth";

/**
 * GET /api/teacher/assignments/:id/submissions
 * List all submissions for an assignment with student details
 * 
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 50)
 * - status: Filter by submission status (PENDING/SUBMITTED/LATE_SUBMITTED/GRADED/RETURNED/all)
 * - search: Search by student name or enrollment number
 * 
 * Requirements: 6.1, 6.2
 */
export async function onRequestGet(context: {
  env: { PADHAKU_CORE_DB?: D1Database; ASSESSMENT_DB: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const assignmentId = params.id;
  const url = new URL(request.url);

  try {
    // Authenticate user
    const user = await getAuthenticatedUser(request, env);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    // Check if user has teacher role
    if (user.role !== 'teacher') {
      return errorResponse("Forbidden: Teacher access required", 403);
    }

    // Verify assignment exists and teacher owns it
    const assignment = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare(
        `SELECT 
          a.id,
          a.class_id,
          a.total_marks,
          c.teacher_id as class_teacher_id
         FROM assignments a
         JOIN classes c ON a.class_id = c.id
         WHERE a.id = ?`
      )
      .bind(assignmentId)
      .first();

    if (!assignment) {
      return errorResponse("Assignment not found", 404);
    }

    if (assignment.class_teacher_id !== user.uid) {
      return errorResponse("Forbidden: You can only view submissions for your own assignments", 403);
    }

    // Parse query params
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);
    const offset = (page - 1) * limit;
    const status = url.searchParams.get("status") || "all";
    const search = url.searchParams.get("search");

    // Build WHERE clause for submissions
    let whereClause = "asub.assignment_id = ?";
    const params_bind: any[] = [assignmentId];

    if (status !== "all") {
      whereClause += " AND asub.status = ?";
      params_bind.push(status);
    }

    if (search) {
      whereClause += " AND (sp.name LIKE ? OR ce.enrollment_number LIKE ?)";
      const searchPattern = `%${search}%`;
      params_bind.push(searchPattern, searchPattern);
    }

    // Get total count
    const countResult = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare(
        `SELECT COUNT(*) as total 
         FROM assignment_submissions asub
         LEFT JOIN class_enrollments ce ON asub.student_id = ce.student_id AND ce.class_id = ?
         LEFT JOIN student_profiles sp ON asub.student_id = sp.user_id
         WHERE ${whereClause}`
      )
      .bind(assignment.class_id, ...params_bind)
      .first();

    const total = countResult?.total || 0;

    // Fetch submissions with student details
    const submissions = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare(
        `SELECT 
          asub.id,
          asub.assignment_id,
          asub.student_id,
          asub.status,
          asub.submitted_at,
          asub.graded_at,
          asub.graded_by,
          asub.marks,
          asub.feedback,
          asub.is_late,
          asub.resubmit_count,
          asub.created_at,
          asub.updated_at,
          sp.name as student_name,
          sp.email as student_email,
          ce.enrollment_number,
          ce.enrollment_status
         FROM assignment_submissions asub
         LEFT JOIN class_enrollments ce ON asub.student_id = ce.student_id AND ce.class_id = ?
         LEFT JOIN student_profiles sp ON asub.student_id = sp.user_id
         WHERE ${whereClause}
         ORDER BY asub.submitted_at DESC, sp.name ASC
         LIMIT ? OFFSET ?`
      )
      .bind(assignment.class_id, ...params_bind, limit, offset)
      .all();

    // Parse JSON fields and calculate grades
    const submissionsWithGrades = (submissions.results || []).map((sub: any) => ({
      ...sub,
      grade_percentage: sub.marks !== null && assignment.total_marks > 0 
        ? ((sub.marks / assignment.total_marks) * 100).toFixed(2)
        : null,
      attachments: sub.attachments ? JSON.parse(sub.attachments) : null,
      external_links: sub.external_links ? JSON.parse(sub.external_links) : null,
      annotations: sub.annotations ? JSON.parse(sub.annotations) : null
    }));

    return jsonResponse({
      submissions: submissionsWithGrades,
      assignment_summary: {
        id: assignment.id,
        total_marks: assignment.total_marks,
        class_id: assignment.class_id
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + limit < total,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("GET /api/teacher/assignments/:id/submissions error:", message);
    return errorResponse(message, 500);
  }
}

/**
 * PUT /api/teacher/assignments/:id/submissions/:submissionId/grade
 * Grade a submission
 * 
 * Body: {
 *   marks: number,
 *   feedback?: string,
 *   annotations?: object,
 *   return_to_student?: boolean (default: false)
 * }
 * 
 * Requirements: 6.3, 6.4
 */
export async function onRequestPut(context: {
  env: { PADHAKU_CORE_DB?: D1Database; ASSESSMENT_DB: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const assignmentId = params.id;
  const url = new URL(request.url);

  try {
    // Extract submissionId from URL path
    const pathParts = url.pathname.split("/");
    const submissionIdIndex = pathParts.findIndex(part => part === "submissions") + 1;
    const submissionId = pathParts[submissionIdIndex];

    if (!submissionId || submissionId === "grade") {
      return errorResponse("Submission ID is required in URL path", 400);
    }

    // Authenticate user
    const user = await getAuthenticatedUser(request, env);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    // Check if user has teacher role
    if (user.role !== 'teacher') {
      return errorResponse("Forbidden: Teacher access required", 403);
    }

    const body: any = await request.json();
    const { marks, feedback, annotations, return_to_student = false } = body;

    if (marks === undefined || marks === null) {
      return errorResponse("marks is required", 400);
    }

    if (typeof marks !== 'number' || marks < 0) {
      return errorResponse("marks must be a non-negative number", 400);
    }

    // Verify assignment and submission exist and teacher owns them
    const assignmentSubmission = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare(
        `SELECT 
          asub.id,
          asub.assignment_id,
          asub.student_id,
          asub.status,
          a.total_marks,
          a.class_id,
          c.teacher_id as class_teacher_id
         FROM assignment_submissions asub
         JOIN assignments a ON asub.assignment_id = a.id
         JOIN classes c ON a.class_id = c.id
         WHERE asub.id = ? AND asub.assignment_id = ?`
      )
      .bind(submissionId, assignmentId)
      .first();

    if (!assignmentSubmission) {
      return errorResponse("Submission not found", 404);
    }

    if (assignmentSubmission.class_teacher_id !== user.uid) {
      return errorResponse("Forbidden: You can only grade submissions for your own assignments", 403);
    }

    // Validate marks don't exceed total marks
    if (marks > assignmentSubmission.total_marks) {
      return errorResponse(`marks (${marks}) cannot exceed assignment total marks (${assignmentSubmission.total_marks})`, 400);
    }

    // Update submission with grade
    const now_iso = new Date().toISOString();
    const newStatus = return_to_student ? 'RETURNED' : 'GRADED';

    const result = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare(
        `UPDATE assignment_submissions 
         SET marks = ?, feedback = ?, annotations = ?, status = ?, 
             graded_at = ?, graded_by = ?, updated_at = ?
         WHERE id = ?`
      )
      .bind(
        marks,
        feedback || null,
        annotations ? JSON.stringify(annotations) : null,
        newStatus,
        now_iso,
        user.uid,
        now_iso,
        submissionId
      )
      .run();

    if (!result.success) {
      return errorResponse("Failed to grade submission", 500);
    }

    // Create notification for student if returned
    if (return_to_student) {
      await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
        .prepare(
          `INSERT INTO notifications 
           (id, user_id, type, channel, title, message, link, metadata, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          crypto.randomUUID(),
          assignmentSubmission.student_id,
          'ASSIGNMENT_GRADED',
          'IN_APP',
          'Assignment Graded',
          `Your assignment submission has been graded and returned with feedback`,
          `/student/assignments/${assignmentId}/submission`,
          JSON.stringify({
            assignment_id: assignmentId,
            submission_id: submissionId,
            marks: marks,
            total_marks: assignmentSubmission.total_marks
          }),
          now_iso
        )
        .run();
    }

    // Fetch updated submission with student details
    const updatedSubmission = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare(
        `SELECT 
          asub.*,
          sp.name as student_name,
          ce.enrollment_number
         FROM assignment_submissions asub
         LEFT JOIN class_enrollments ce ON asub.student_id = ce.student_id AND ce.class_id = ?
         LEFT JOIN student_profiles sp ON asub.student_id = sp.user_id
         WHERE asub.id = ?`
      )
      .bind(assignmentSubmission.class_id, submissionId)
      .first();

    return jsonResponse({
      success: true,
      message: return_to_student 
        ? "Submission graded and returned to student successfully" 
        : "Submission graded successfully",
      submission: {
        ...updatedSubmission,
        grade_percentage: ((marks / assignmentSubmission.total_marks) * 100).toFixed(2),
        attachments: updatedSubmission?.attachments ? JSON.parse(updatedSubmission.attachments) : null,
        external_links: updatedSubmission?.external_links ? JSON.parse(updatedSubmission.external_links) : null,
        annotations: updatedSubmission?.annotations ? JSON.parse(updatedSubmission.annotations) : null
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("PUT /api/teacher/assignments/:id/submissions/:submissionId/grade error:", message);
    return errorResponse(message, 500);
  }
}
