import { jsonResponse, errorResponse } from "../../../../lib/json";
import { getAuthenticatedUser } from "../../../../lib/auth";
import { isClassTeacher, isHOD, getTeacherDb } from "../../../../lib/classHelpers";
import { syncBetaUserToFirestoreREST } from "../../../../lib/firestoreRestService";

/**
 * GET /api/teacher/classes/:id/students
 * List all enrolled students in a class with their stats
 * 
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50, max: 100)
 * - status: Filter by enrollment status (ACTIVE/PENDING/WITHDRAWN/all)
 * - search: Search by name or enrollment number
 * 
 * Requirements: 3.8, 3.9
 */
export async function onRequestGet(context: {
  env: { DB?: any; ASSESSMENT_DB?: any; PADHAKU_CORE_DB?: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const classId = params.id;
  const db = getTeacherDb(env);
  const url = new URL(request.url);

  if (!db) {
    return errorResponse("Database binding not configured", 500);
  }

  try {
    // Authenticate user
    const user = await getAuthenticatedUser(request, env);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    // Check authorization
    const hasAccess = await isClassTeacher(db, classId, user.uid) ||
                      await isHOD(db, user.uid) ||
                      user.role === 'admin';
    if (!hasAccess) {
      return errorResponse("Forbidden: You don't have permission to view students in this class", 403);
    }

    // Parse query params
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
    const offset = (page - 1) * limit;
    const status = url.searchParams.get("status") || "all";
    const search = url.searchParams.get("search") || "";

    // Build WHERE clause
    let whereClause = "ce.class_id = ?";
    const params_bind: any[] = [classId];

    if (status !== "all") {
      whereClause += " AND (ce.enrollment_status = ? OR ce.status = ?)";
      params_bind.push(status, status.toLowerCase());
    }

    if (search) {
      whereClause += " AND (sp.name LIKE ? OR u.display_name LIKE ? OR ce.enrollment_number LIKE ?)";
      const searchPattern = `%${search}%`;
      params_bind.push(searchPattern, searchPattern, searchPattern);
    }

    // Get total count
    const countResult = await db
      .prepare(`
        SELECT COUNT(*) as total 
        FROM class_enrollments ce 
        LEFT JOIN student_profiles sp ON ce.student_id = sp.user_id
        LEFT JOIN unified_users u ON ce.student_id = u.id OR ce.student_id = u.uid
        WHERE ${whereClause}
      `)
      .bind(...params_bind)
      .first<{ total: number }>();

    const total = Number(countResult?.total || 0);

    // Fetch students with stats
    const students = await db
      .prepare(
        `SELECT 
          ce.id as enrollment_id,
          ce.student_id,
          COALESCE(ce.enrollment_number, sp.enrollment_number, '') as enrollment_number,
          COALESCE(ce.enrollment_status, ce.status, 'ACTIVE') as enrollment_status,
          ce.enrolled_at,
          ce.withdrawn_at,
          ce.final_grade,
          ce.is_placeholder,
          COALESCE(sp.name, u.display_name, 'Student') as student_name,
          COALESCE(sp.email, u.email, '') as student_email,
          sp.phone_number,
          sp.branch,
          sp.semester,
          -- Aggregate stats (placeholders for now, will be computed)
          0 as attendance_percentage,
          0 as average_marks,
          0 as submitted_assignments,
          0 as total_assignments
         FROM class_enrollments ce
         LEFT JOIN student_profiles sp ON ce.student_id = sp.user_id
         LEFT JOIN unified_users u ON ce.student_id = u.id OR ce.student_id = u.uid
         WHERE ${whereClause}
         ORDER BY ce.enrolled_at DESC
         LIMIT ? OFFSET ?`
      )
      .bind(...params_bind, limit, offset)
      .all();

    return jsonResponse({
      students: students.results || [],
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
    console.error("GET /api/teacher/classes/:id/students error:", message);
    return errorResponse(message, 500);
  }
}

/**
 * POST /api/teacher/classes/:id/students/bulk
 * Bulk enroll students by enrollment numbers
 * 
 * Body: {
 *   enrollment_numbers: string[] (array of enrollment numbers)
 * }
 * 
 * Returns 207 Multi-Status with:
 * - successful: Array of successfully enrolled students
 * - failed: Array of enrollment numbers that failed with reasons
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.5, 3.6, 3.7
 */
export async function onRequestPost(context: {
  env: { PADHAKU_CORE_DB?: D1Database; ASSESSMENT_DB: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const classId = params.id;
  const url = new URL(request.url);

  try {
    // Authenticate user
    const user = await getAuthenticatedUser(request, env);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    // Check if route is for bulk enrollment
    if (url.pathname.endsWith("/bulk")) {
      // Bulk enrollment logic
      const hasAccess = await isClassTeacher((env.PADHAKU_CORE_DB || env.ASSESSMENT_DB), classId, user.uid) ||
                        await isHOD((env.PADHAKU_CORE_DB || env.ASSESSMENT_DB), user.uid);
      if (!hasAccess) {
        return errorResponse("Forbidden: You don't have permission to enroll students in this class", 403);
      }

      const body: any = await request.json();
      const { enrollment_numbers } = body;

      if (!Array.isArray(enrollment_numbers) || enrollment_numbers.length === 0) {
        return errorResponse("enrollment_numbers array is required and must not be empty", 400);
      }

      // Check if class exists and is active
      const classInfo = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
        .prepare("SELECT id, max_students, is_active FROM classes WHERE id = ?")
        .bind(classId)
        .first();

      if (!classInfo) {
        return errorResponse("Class not found", 404);
      }

      if (!classInfo.is_active) {
        return errorResponse("Cannot enroll students in an inactive class", 400);
      }

      // Get current enrollment count
      const enrollmentCount = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
        .prepare("SELECT COUNT(*) as count FROM class_enrollments WHERE class_id = ? AND enrollment_status = 'ACTIVE'")
        .bind(classId)
        .first();

      const currentCount = enrollmentCount?.count || 0;

      const successful: any[] = [];
      const failed: any[] = [];

      // Process each enrollment number
      for (const enrollmentNo of enrollment_numbers) {
        try {
          // Validate enrollment number
          if (!enrollmentNo || typeof enrollmentNo !== 'string' || enrollmentNo.trim().length === 0) {
            failed.push({
              enrollment_number: enrollmentNo,
              reason: "Invalid enrollment number format",
            });
            continue;
          }

          const trimmedEnrollmentNo = enrollmentNo.trim();

          // Check if already enrolled
          const existing = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
            .prepare("SELECT id FROM class_enrollments WHERE class_id = ? AND enrollment_number = ?")
            .bind(classId, trimmedEnrollmentNo)
            .first();

          if (existing) {
            failed.push({
              enrollment_number: trimmedEnrollmentNo,
              reason: "Already enrolled in this class",
            });
            continue;
          }

          // Check max students limit
          if (currentCount + successful.length >= classInfo.max_students) {
            failed.push({
              enrollment_number: trimmedEnrollmentNo,
              reason: "Class is full (max students limit reached)",
            });
            continue;
          }

          // Check if student exists in student_profiles
          const studentProfile = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
            .prepare("SELECT user_id, name, email FROM student_profiles WHERE user_id = ? OR name = ?")
            .bind(trimmedEnrollmentNo, trimmedEnrollmentNo)
            .first();

          const enrollmentId = crypto.randomUUID();
          const isPlaceholder = !studentProfile;
          const studentId = studentProfile?.user_id || null;

          // Create enrollment record
          await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
            .prepare(
              `INSERT INTO class_enrollments 
               (id, class_id, student_id, enrollment_number, enrollment_status, enrolled_at, is_placeholder)
               VALUES (?, ?, ?, ?, 'PENDING', CURRENT_TIMESTAMP, ?)`
            )
            .bind(enrollmentId, classId, studentId, trimmedEnrollmentNo, isPlaceholder ? 1 : 0)
            .run();

          successful.push({
            enrollment_id: enrollmentId,
            enrollment_number: trimmedEnrollmentNo,
            student_id: studentId,
            is_placeholder: isPlaceholder,
            status: isPlaceholder ? "Created as placeholder - awaiting registration" : "Enrolled successfully",
          });

          // TODO: Send invitation email if placeholder
          // TODO: Send enrollment notification if registered student

        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : "Unknown error";
          failed.push({
            enrollment_number: enrollmentNo,
            reason: `Database error: ${errMsg}`,
          });
        }
      }

      // Return 207 Multi-Status
      return new Response(
        JSON.stringify({
          success: true,
          message: `Processed ${enrollment_numbers.length} enrollment(s): ${successful.length} successful, ${failed.length} failed`,
          data: {
            successful,
            failed,
            summary: {
              total: enrollment_numbers.length,
              successful: successful.length,
              failed: failed.length,
            },
          },
        }),
        {
          status: 207, // Multi-Status
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // If not bulk, return method not allowed
    return errorResponse("Method not supported. Use /bulk for bulk enrollment", 405);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("POST /api/teacher/classes/:id/students error:", message);
    return errorResponse(message, 500);
  }
}

/**
 * PUT /api/teacher/classes/:id/students/:studentId
 * Update enrollment metadata (e.g., change status, update grade)
 * 
 * Body: {
 *   enrollment_status?: 'ACTIVE' | 'PENDING' | 'WITHDRAWN' | 'COMPLETED'
 *   final_grade?: string
 * }
 * 
 * Requirements: 3.4
 */
export async function onRequestPut(context: {
  env: { PADHAKU_CORE_DB?: D1Database; ASSESSMENT_DB: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const classId = params.id;
  const url = new URL(request.url);

  try {
    // Extract studentId from URL path
    const pathParts = url.pathname.split("/");
    const studentId = pathParts[pathParts.length - 1];

    if (!studentId || studentId === "students") {
      return errorResponse("Student ID is required in URL path", 400);
    }

    // Authenticate user
    const user = await getAuthenticatedUser(request, env);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    // Check authorization
    const hasAccess = await isClassTeacher((env.PADHAKU_CORE_DB || env.ASSESSMENT_DB), classId, user.uid) ||
                      await isHOD((env.PADHAKU_CORE_DB || env.ASSESSMENT_DB), user.uid);
    if (!hasAccess) {
      return errorResponse("Forbidden: You don't have permission to update enrollments in this class", 403);
    }

    const body: any = await request.json();
    const { enrollment_status, final_grade } = body;

    // Validate enrollment status if provided
    const validStatuses = ['ACTIVE', 'PENDING', 'WITHDRAWN', 'COMPLETED'];
    if (enrollment_status && !validStatuses.includes(enrollment_status)) {
      return errorResponse(`Invalid enrollment_status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    // Build UPDATE query dynamically
    const updates: string[] = [];
    const params_bind: any[] = [];

    if (enrollment_status) {
      updates.push("enrollment_status = ?");
      params_bind.push(enrollment_status);
      
      if (enrollment_status === 'WITHDRAWN') {
        updates.push("withdrawn_at = CURRENT_TIMESTAMP");
      }
    }

    if (final_grade !== undefined) {
      updates.push("final_grade = ?");
      params_bind.push(final_grade);
    }

    if (updates.length === 0) {
      return errorResponse("No valid fields to update", 400);
    }

    params_bind.push(classId, studentId);

    // Update enrollment
    const result = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare(
        `UPDATE class_enrollments 
         SET ${updates.join(", ")}
         WHERE class_id = ? AND student_id = ?`
      )
      .bind(...params_bind)
      .run();

    if (!result.success) {
      return errorResponse("Failed to update enrollment", 500);
    }

    // Fetch updated enrollment
    const updated = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare(
        `SELECT * FROM class_enrollments WHERE class_id = ? AND student_id = ?`
      )
      .bind(classId, studentId)
      .first();

    return jsonResponse({
      success: true,
      message: "Enrollment updated successfully",
      enrollment: updated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("PUT /api/teacher/classes/:id/students/:studentId error:", message);
    return errorResponse(message, 500);
  }
}

/**
 * DELETE /api/teacher/classes/:id/students/:studentId
 * Remove student from class (soft delete - set status to WITHDRAWN)
 * 
 * Requirements: 3.4
 */
export async function onRequestDelete(context: {
  env: { PADHAKU_CORE_DB?: D1Database; ASSESSMENT_DB: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const classId = params.id;
  const url = new URL(request.url);

  try {
    // Extract studentId from URL path
    const pathParts = url.pathname.split("/");
    const studentId = pathParts[pathParts.length - 1];

    if (!studentId || studentId === "students") {
      return errorResponse("Student ID is required in URL path", 400);
    }

    // Authenticate user
    const user = await getAuthenticatedUser(request, env);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    // Check authorization
    const hasAccess = await isClassTeacher((env.PADHAKU_CORE_DB || env.ASSESSMENT_DB), classId, user.uid) ||
                      await isHOD((env.PADHAKU_CORE_DB || env.ASSESSMENT_DB), user.uid);
    if (!hasAccess) {
      return errorResponse("Forbidden: You don't have permission to remove students from this class", 403);
    }

    // Soft delete - set status to WITHDRAWN
    const result = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare(
        `UPDATE class_enrollments 
         SET enrollment_status = 'WITHDRAWN', withdrawn_at = CURRENT_TIMESTAMP
         WHERE class_id = ? AND student_id = ?`
      )
      .bind(classId, studentId)
      .run();

    if (!result.success) {
      return errorResponse("Failed to remove student from class", 500);
    }

    return jsonResponse({
      success: true,
      message: "Student removed from class successfully",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("DELETE /api/teacher/classes/:id/students/:studentId error:", message);
    return errorResponse(message, 500);
  }
}
