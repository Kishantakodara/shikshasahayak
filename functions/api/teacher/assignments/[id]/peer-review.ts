import { jsonResponse, errorResponse } from "../../../../lib/json";
import { getAuthenticatedUser } from "../../../../lib/auth";

/**
 * POST /api/teacher/assignments/:id/peer-review/setup
 * Set up peer review for an assignment
 * 
 * Body: {
 *   review_deadline: string (ISO date);
 *   reviews_per_student: number (1-5);
 *   review_rubric: RubricCriterion[];
 *   allow_self_review?: boolean;
 *   anonymous_reviews?: boolean;
 *   auto_assign?: boolean (default: true);
 * }
 * 
 * Requirements: Peer review system
 */
export async function onRequestPost(context: {
  env: { PADHAKU_CORE_DB?: D1Database; ASSESSMENT_DB: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const assignmentId = params.id;
  const url = new URL(request.url);
  const action = url.pathname.split('/').pop();

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

    if (action === 'setup') {
      return await setupPeerReview(env, request, assignmentId, user.uid);
    } else if (action === 'assignments') {
      return await managePeerReviewAssignments(env, request, assignmentId, user.uid);
    }

    return errorResponse("Invalid action", 400);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("POST /api/teacher/assignments/:id/peer-review error:", message);
    return errorResponse(message, 500);
  }
}

/**
 * GET /api/teacher/assignments/:id/peer-review
 * Get peer review status and assignments
 */
export async function onRequestGet(context: {
  env: { PADHAKU_CORE_DB?: D1Database; ASSESSMENT_DB: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const assignmentId = params.id;

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
          a.title,
          a.peer_review_enabled,
          a.peer_review_deadline,
          a.peer_review_rubric,
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
      return errorResponse("Forbidden: You can only manage peer reviews for your own assignments", 403);
    }

    if (!assignment.peer_review_enabled) {
      return jsonResponse({
        peer_review_enabled: false,
        message: "Peer review is not enabled for this assignment",
      });
    }

    // Get peer review assignments with status
    const peerReviewAssignments = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare(
        `SELECT 
          pra.id,
          pra.reviewer_id,
          pra.reviewee_submission_id,
          pra.status,
          pra.review_feedback,
          pra.review_scores,
          pra.total_score,
          pra.max_score,
          pra.submitted_at,
          pra.due_date,
          reviewer.name as reviewer_name,
          reviewee.name as reviewee_name,
          ce_reviewer.enrollment_number as reviewer_enrollment,
          ce_reviewee.enrollment_number as reviewee_enrollment,
          asub.student_id as reviewee_id
         FROM peer_review_assignments pra
         LEFT JOIN student_profiles reviewer ON pra.reviewer_id = reviewer.user_id
         LEFT JOIN assignment_submissions asub ON pra.reviewee_submission_id = asub.id
         LEFT JOIN student_profiles reviewee ON asub.student_id = reviewee.user_id
         LEFT JOIN class_enrollments ce_reviewer ON pra.reviewer_id = ce_reviewer.student_id AND ce_reviewer.class_id = (SELECT class_id FROM assignments WHERE id = ?)
         LEFT JOIN class_enrollments ce_reviewee ON asub.student_id = ce_reviewee.student_id AND ce_reviewee.class_id = (SELECT class_id FROM assignments WHERE id = ?)
         WHERE pra.assignment_id = ?
         ORDER BY pra.status, pra.due_date`
      )
      .bind(assignmentId, assignmentId, assignmentId)
      .all();

    // Calculate statistics
    const assignments = peerReviewAssignments.results || [];
    const stats = {
      total_assignments: assignments.length,
      completed: assignments.filter((a: any) => a.status === 'COMPLETED').length,
      in_progress: assignments.filter((a: any) => a.status === 'IN_PROGRESS').length,
      pending: assignments.filter((a: any) => a.status === 'PENDING').length,
      overdue: assignments.filter((a: any) => a.status === 'OVERDUE').length,
    };

    // Parse JSON fields
    const assignmentsWithParsedData = assignments.map((pra: any) => ({
      ...pra,
      review_scores: pra.review_scores ? JSON.parse(pra.review_scores) : null,
      review_rubric: assignment.peer_review_rubric ? JSON.parse(assignment.peer_review_rubric) : null,
    }));

    return jsonResponse({
      peer_review_enabled: true,
      assignment_summary: {
        id: assignment.id,
        title: assignment.title,
        peer_review_deadline: assignment.peer_review_deadline,
      },
      assignments: assignmentsWithParsedData,
      statistics: stats,
      rubric: assignment.peer_review_rubric ? JSON.parse(assignment.peer_review_rubric) : null,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("GET /api/teacher/assignments/:id/peer-review error:", message);
    return errorResponse(message, 500);
  }
}

// Helper function to set up peer review
async function setupPeerReview(env: any, request: Request, assignmentId: string, teacherId: string) {
  const body: any = await request.json();
  const {
    review_deadline,
    reviews_per_student = 2,
    review_rubric,
    allow_self_review = false,
    anonymous_reviews = true,
    auto_assign = true,
  } = body;

  if (!review_deadline) {
    return errorResponse("review_deadline is required", 400);
  }

  if (reviews_per_student < 1 || reviews_per_student > 5) {
    return errorResponse("reviews_per_student must be between 1 and 5", 400);
  }

  if (!Array.isArray(review_rubric) || review_rubric.length === 0) {
    return errorResponse("review_rubric is required and must be a non-empty array", 400);
  }

  // Verify assignment exists and teacher owns it
  const assignment = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
    .prepare(
      `SELECT 
        a.id,
        a.class_id,
        a.status,
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

  if (assignment.class_teacher_id !== teacherId) {
    return errorResponse("Forbidden: You can only set up peer review for your own assignments", 403);
  }

  if (assignment.status !== 'PUBLISHED') {
    return errorResponse("Assignment must be published before setting up peer review", 400);
  }

  // Check if assignment has submissions
  const submissionCount = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
    .prepare("SELECT COUNT(*) as count FROM assignment_submissions WHERE assignment_id = ?")
    .bind(assignmentId)
    .first();

  if (!submissionCount || submissionCount.count < 2) {
    return errorResponse("Assignment must have at least 2 submissions to enable peer review", 400);
  }

  const now_iso = new Date().toISOString();
  
  // Update assignment to enable peer review
  const updateResult = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
    .prepare(
      `UPDATE assignments 
       SET peer_review_enabled = 1,
           peer_review_deadline = ?,
           peer_review_rubric = ?,
           updated_at = ?
       WHERE id = ?`
    )
    .bind(
      review_deadline,
      JSON.stringify(review_rubric),
      now_iso,
      assignmentId
    )
    .run();

  if (!updateResult.success) {
    return errorResponse("Failed to enable peer review", 500);
  }

  // Auto-assign peer reviews if requested
  if (auto_assign) {
    await autoAssignPeerReviews(env, assignmentId, reviews_per_student, allow_self_review, review_deadline);
  }

  return jsonResponse({
    success: true,
    message: "Peer review enabled successfully",
    assignment_id: assignmentId,
    review_deadline,
    reviews_per_student,
    auto_assigned: auto_assign,
  });
}

// Helper function to auto-assign peer reviews
async function autoAssignPeerReviews(
  env: any,
  assignmentId: string,
  reviewsPerStudent: number,
  allowSelfReview: boolean,
  reviewDeadline: string
) {
  // Get all submissions for the assignment
  const submissions = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
    .prepare(
      `SELECT id, student_id 
       FROM assignment_submissions 
       WHERE assignment_id = ? 
         AND status IN ('SUBMITTED', 'LATE_SUBMITTED', 'GRADED', 'RETURNED')`
    )
    .bind(assignmentId)
    .all();

  const submissionList = submissions.results || [];
  
  if (submissionList.length < 2) {
    throw new Error("Not enough submissions for peer review assignment");
  }

  const assignments: Array<{
    id: string;
    assignment_id: string;
    reviewer_id: string;
    reviewee_submission_id: string;
    status: string;
    due_date: string;
    created_at: string;
  }> = [];
  
  for (const submission of submissionList) {
    const reviewerId = submission.student_id;
    
    // Get potential reviewees (excluding self if not allowed)
    const potentialReviewees = submissionList.filter((s: any) => 
      allowSelfReview ? true : s.student_id !== reviewerId
    );

    // Randomly assign reviewees
    const shuffled = [...potentialReviewees].sort(() => 0.5 - Math.random());
    const assignedReviewees = shuffled.slice(0, Math.min(reviewsPerStudent, shuffled.length));

    for (const reviewee of assignedReviewees) {
      assignments.push({
        id: crypto.randomUUID(),
        assignment_id: assignmentId,
        reviewer_id: reviewerId,
        reviewee_submission_id: reviewee.id,
        status: 'PENDING',
        due_date: reviewDeadline,
        created_at: new Date().toISOString(),
      });
    }
  }

  // Insert all assignments in batch
  if (assignments.length > 0) {
    const insertPromises = assignments.map(assignment =>
      (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
        .prepare(
          `INSERT INTO peer_review_assignments 
           (id, assignment_id, reviewer_id, reviewee_submission_id, status, due_date, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          assignment.id,
          assignment.assignment_id,
          assignment.reviewer_id,
          assignment.reviewee_submission_id,
          assignment.status,
          assignment.due_date,
          assignment.created_at
        )
        .run()
    );

    await Promise.all(insertPromises);
  }

  return assignments.length;
}

// Helper function to manage peer review assignments
async function managePeerReviewAssignments(env: any, request: Request, assignmentId: string, teacherId: string) {
  const body: any = await request.json();
  const { action, reviewer_id, reviewee_submission_id } = body;

  // Verify assignment exists and teacher owns it
  const assignment = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
    .prepare(
      `SELECT 
        a.id,
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

  if (assignment.class_teacher_id !== teacherId) {
    return errorResponse("Forbidden: You can only manage peer review assignments for your own assignments", 403);
  }

  if (action === 'reassign') {
    // Reassign a peer review to different reviewer or reviewee
    const { new_reviewer_id, new_reviewee_submission_id } = body;
    
    if (!new_reviewer_id && !new_reviewee_submission_id) {
      return errorResponse("Either new_reviewer_id or new_reviewee_submission_id is required for reassignment", 400);
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    if (new_reviewer_id) updateData.reviewer_id = new_reviewer_id;
    if (new_reviewee_submission_id) updateData.reviewee_submission_id = new_reviewee_submission_id;

    const updateResult = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare(
        `UPDATE peer_review_assignments 
         SET ${Object.keys(updateData).map(key => `${key} = ?`).join(', ')}
         WHERE assignment_id = ? AND reviewer_id = ? AND reviewee_submission_id = ?`
      )
      .bind(
        ...Object.values(updateData),
        assignmentId,
        reviewer_id,
        reviewee_submission_id
      )
      .run();

    return jsonResponse({
      success: updateResult.success,
      message: updateResult.success ? "Peer review assignment updated successfully" : "Failed to update assignment",
    });

  } else if (action === 'remove') {
    // Remove a peer review assignment
    const deleteResult = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare(
        `DELETE FROM peer_review_assignments 
         WHERE assignment_id = ? AND reviewer_id = ? AND reviewee_submission_id = ?`
      )
      .bind(assignmentId, reviewer_id, reviewee_submission_id)
      .run();

    return jsonResponse({
      success: deleteResult.success,
      message: deleteResult.success ? "Peer review assignment removed successfully" : "Failed to remove assignment",
    });

  } else {
    return errorResponse("Invalid action. Allowed: reassign, remove", 400);
  }
}
