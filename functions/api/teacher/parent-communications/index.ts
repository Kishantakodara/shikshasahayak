import { jsonResponse, errorResponse } from "../../../lib/json";
import { getAuthenticatedUser } from "../../../lib/auth";

/**
 * GET /api/teacher/parent-communications
 * Get parent communication records
 * 
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 50)
 * - student_id: Filter by specific student
 * - class_id: Filter by class
 * - communication_type: Filter by type
 * - delivery_status: Filter by delivery status
 * - search: Search by student name or parent email
 * 
 * Requirements: Parent communication tracking
 */
export async function onRequestGet(context: {
  env: { ASSESSMENT_DB: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
}) {
  const { env, request } = context;
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

    // Parse query params
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);
    const offset = (page - 1) * limit;
    const studentId = url.searchParams.get("student_id");
    const classId = url.searchParams.get("class_id");
    const communicationType = url.searchParams.get("communication_type");
    const deliveryStatus = url.searchParams.get("delivery_status");
    const search = url.searchParams.get("search");

    // Build WHERE clause
    let whereClause = "pc.sent_by = ?";
    const params: any[] = [user.uid];

    if (studentId) {
      whereClause += " AND pc.student_id = ?";
      params.push(studentId);
    }

    if (classId) {
      // Verify teacher owns the class first
      const classOwnership = await env.ASSESSMENT_DB
        .prepare("SELECT 1 FROM classes WHERE id = ? AND teacher_id = ?")
        .bind(classId, user.uid)
        .first();

      if (!classOwnership) {
        return errorResponse("Class not found or you don't have access to it", 404);
      }

      whereClause += ` AND EXISTS (
        SELECT 1 FROM class_enrollments ce 
        WHERE ce.student_id = pc.student_id AND ce.class_id = ?
      )`;
      params.push(classId);
    } else {
      // Only show communications for students in teacher's classes
      whereClause += ` AND EXISTS (
        SELECT 1 FROM class_enrollments ce
        JOIN classes c ON ce.class_id = c.id
        WHERE ce.student_id = pc.student_id AND c.teacher_id = ?
      )`;
      params.push(user.uid);
    }

    if (communicationType) {
      whereClause += " AND pc.communication_type = ?";
      params.push(communicationType);
    }

    if (deliveryStatus) {
      whereClause += " AND pc.delivery_status = ?";
      params.push(deliveryStatus);
    }

    if (search) {
      whereClause += " AND (sp.name LIKE ? OR pc.parent_email LIKE ? OR pc.parent_name LIKE ?)";
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    // Get total count
    const countResult = await env.ASSESSMENT_DB
      .prepare(
        `SELECT COUNT(*) as total 
         FROM parent_communications pc
         LEFT JOIN student_profiles sp ON pc.student_id = sp.user_id
         WHERE ${whereClause}`
      )
      .bind(...params)
      .first();

    const total = countResult?.total || 0;

    // Fetch communications with student info
    const communications = await env.ASSESSMENT_DB
      .prepare(
        `SELECT 
          pc.id,
          pc.student_id,
          pc.parent_email,
          pc.parent_name,
          pc.parent_phone,
          pc.communication_type,
          pc.subject,
          pc.message,
          pc.attachments,
          pc.sent_at,
          pc.delivery_status,
          pc.delivery_attempts,
          pc.last_attempt_at,
          pc.error_message,
          sp.name as student_name,
          sp.email as student_email,
          -- Get class info for this student
          GROUP_CONCAT(DISTINCT c.name || ' (' || c.section || ')') as class_names
         FROM parent_communications pc
         LEFT JOIN student_profiles sp ON pc.student_id = sp.user_id
         LEFT JOIN class_enrollments ce ON pc.student_id = ce.student_id AND ce.enrollment_status = 'ACTIVE'
         LEFT JOIN classes c ON ce.class_id = c.id AND c.teacher_id = ?
         WHERE ${whereClause}
         GROUP BY pc.id, pc.student_id, pc.parent_email, pc.parent_name, pc.parent_phone,
                  pc.communication_type, pc.subject, pc.message, pc.attachments, pc.sent_at,
                  pc.delivery_status, pc.delivery_attempts, pc.last_attempt_at, pc.error_message,
                  sp.name, sp.email
         ORDER BY pc.sent_at DESC
         LIMIT ? OFFSET ?`
      )
      .bind(user.uid, ...params, limit, offset)
      .all();

    // Parse JSON fields and add metadata
    const communicationsWithMetadata = (communications.results || []).map((comm: any) => ({
      ...comm,
      attachments: comm.attachments ? JSON.parse(comm.attachments) : null,
      is_delivery_failed: comm.delivery_status === 'FAILED',
      needs_retry: comm.delivery_status === 'FAILED' && comm.delivery_attempts < 3,
    }));

    return jsonResponse({
      communications: communicationsWithMetadata,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + limit < total,
      },
      filters: {
        student_id: studentId,
        class_id: classId,
        communication_type: communicationType,
        delivery_status: deliveryStatus,
        search,
      },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("GET /api/teacher/parent-communications error:", message);
    return errorResponse(message, 500);
  }
}

/**
 * POST /api/teacher/parent-communications
 * Send communication to parents
 * 
 * Body: {
 *   student_ids: string[]; // Can send to multiple students' parents
 *   communication_type: 'PROGRESS_REPORT' | 'ATTENDANCE_ALERT' | 'GRADE_NOTIFICATION' | 'BEHAVIOR_REPORT' | 'GENERAL_UPDATE';
 *   subject: string;
 *   message: string;
 *   attachments?: string[];
 *   include_student_summary?: boolean; // Auto-include student performance data
 * }
 * 
 * Requirements: Parent communication
 */
export async function onRequestPost(context: {
  env: { ASSESSMENT_DB: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
}) {
  const { env, request } = context;

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

    const body: any = await request.json();
    const {
      student_ids,
      communication_type,
      subject,
      message,
      attachments,
      include_student_summary = false,
    } = body;

    // Validation
    if (!Array.isArray(student_ids) || student_ids.length === 0) {
      return errorResponse("student_ids must be a non-empty array", 400);
    }

    if (student_ids.length > 50) {
      return errorResponse("Cannot send to more than 50 students at once", 400);
    }

    const validTypes = ['PROGRESS_REPORT', 'ATTENDANCE_ALERT', 'GRADE_NOTIFICATION', 'BEHAVIOR_REPORT', 'GENERAL_UPDATE'];
    if (!validTypes.includes(communication_type)) {
      return errorResponse(`Invalid communication_type. Must be one of: ${validTypes.join(', ')}`, 400);
    }

    if (!subject || subject.trim().length === 0) {
      return errorResponse("subject is required and cannot be empty", 400);
    }

    if (!message || message.trim().length === 0) {
      return errorResponse("message is required and cannot be empty", 400);
    }

    // Verify all students are in teacher's classes and get their parent info
    const studentDetails = await Promise.all(
      student_ids.map(async (studentId: string) => {
        const student = await env.ASSESSMENT_DB
          .prepare(
            `SELECT 
              sp.user_id,
              sp.name as student_name,
              sp.email as student_email,
              sp.parent_email,
              sp.parent_name,
              sp.parent_phone,
              GROUP_CONCAT(DISTINCT c.name || ' (' || c.section || ')') as class_names
             FROM student_profiles sp
             JOIN class_enrollments ce ON sp.user_id = ce.student_id
             JOIN classes c ON ce.class_id = c.id
             WHERE sp.user_id = ? AND c.teacher_id = ? AND ce.enrollment_status = 'ACTIVE'
             GROUP BY sp.user_id, sp.name, sp.email, sp.parent_email, sp.parent_name, sp.parent_phone`
          )
          .bind(studentId, user.uid)
          .first();

        return { studentId, student };
      })
    );

    // Check for invalid students or missing parent info
    const invalidStudents = studentDetails.filter(sd => !sd.student);
    if (invalidStudents.length > 0) {
      return errorResponse(
        `Invalid student IDs or students not in your classes: ${invalidStudents.map(s => s.studentId).join(', ')}`,
        400
      );
    }

    const studentsWithoutParentInfo = studentDetails.filter(sd => 
      !sd.student.parent_email || sd.student.parent_email.trim().length === 0
    );

    if (studentsWithoutParentInfo.length > 0) {
      return errorResponse(
        `Missing parent email for students: ${studentsWithoutParentInfo.map(s => s.student.student_name).join(', ')}. Please update parent contact information first.`,
        400
      );
    }

    const now_iso = new Date().toISOString();
    const successful: any[] = [];
    const failed: any[] = [];

    // Process each student's parent communication
    for (const { studentId, student } of studentDetails) {
      try {
        let finalMessage = message.trim();

        // Include student summary if requested
        if (include_student_summary) {
          const studentSummary = await generateStudentSummary(env, studentId, user.uid);
          finalMessage += '\n\n--- Student Performance Summary ---\n' + studentSummary;
        }

        // Create parent communication record
        const communicationId = crypto.randomUUID();
        const result = await env.ASSESSMENT_DB
          .prepare(
            `INSERT INTO parent_communications 
             (id, student_id, parent_email, parent_name, parent_phone, communication_type, 
              subject, message, attachments, sent_by, sent_at, delivery_status, delivery_attempts)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            communicationId,
            studentId,
            student.parent_email,
            student.parent_name || 'Parent',
            student.parent_phone || null,
            communication_type,
            subject.trim(),
            finalMessage,
            attachments ? JSON.stringify(attachments) : null,
            user.uid,
            now_iso,
            'PENDING',
            0
          )
          .run();

        if (result.success) {
          // TODO: Implement actual email sending logic here
          // For now, we'll mark as SENT immediately
          await env.ASSESSMENT_DB
            .prepare(
              `UPDATE parent_communications 
               SET delivery_status = 'SENT', last_attempt_at = ?, delivery_attempts = 1
               WHERE id = ?`
            )
            .bind(now_iso, communicationId)
            .run();

          successful.push({
            communication_id: communicationId,
            student_id: studentId,
            student_name: student.student_name,
            parent_email: student.parent_email,
            parent_name: student.parent_name,
          });
        } else {
          failed.push({
            student_id: studentId,
            student_name: student.student_name,
            error: 'Failed to create communication record',
          });
        }

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        failed.push({
          student_id: studentId,
          student_name: student.student_name,
          error: errorMessage,
        });
      }
    }

    return jsonResponse({
      success: true,
      message: `Parent communications processed: ${successful.length} successful, ${failed.length} failed`,
      data: {
        successful,
        failed,
        summary: {
          total: student_ids.length,
          successful: successful.length,
          failed: failed.length,
        },
      },
    }, failed.length > 0 ? 207 : 200); // 207 Multi-Status if there were failures

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("POST /api/teacher/parent-communications error:", message);
    return errorResponse(message, 500);
  }
}

// Helper function to generate student performance summary
async function generateStudentSummary(env: any, studentId: string, teacherId: string): Promise<string> {
  try {
    // Get student's current grades
    const grades = await env.ASSESSMENT_DB
      .prepare(
        `SELECT 
          a.title as assignment_title,
          asub.marks,
          a.total_marks,
          asub.submitted_at,
          c.name as class_name
         FROM assignment_submissions asub
         JOIN assignments a ON asub.assignment_id = a.id
         JOIN classes c ON a.class_id = c.id
         WHERE asub.student_id = ? AND c.teacher_id = ? 
           AND asub.status IN ('GRADED', 'RETURNED')
         ORDER BY asub.submitted_at DESC
         LIMIT 5`
      )
      .bind(studentId, teacherId)
      .all();

    // Get attendance summary
    const attendance = await env.ASSESSMENT_DB
      .prepare(
        `SELECT 
          COUNT(*) as total_sessions,
          COUNT(CASE WHEN status IN ('PRESENT', 'LATE') THEN 1 END) as present_sessions,
          c.name as class_name
         FROM attendance_records ar
         JOIN classes c ON ar.class_id = c.id
         WHERE ar.student_id = ? AND c.teacher_id = ?
           AND ar.date >= date('now', '-30 days')
         GROUP BY c.id, c.name`
      )
      .bind(studentId, teacherId)
      .all();

    let summary = '';

    // Recent grades
    if (grades.results && grades.results.length > 0) {
      summary += 'Recent Assignments:\n';
      grades.results.forEach((grade: any) => {
        const percentage = ((grade.marks / grade.total_marks) * 100).toFixed(1);
        summary += `• ${grade.assignment_title}: ${grade.marks}/${grade.total_marks} (${percentage}%)\n`;
      });
      summary += '\n';
    }

    // Attendance
    if (attendance.results && attendance.results.length > 0) {
      summary += 'Attendance (Last 30 days):\n';
      attendance.results.forEach((att: any) => {
        const percentage = att.total_sessions > 0 ? ((att.present_sessions / att.total_sessions) * 100).toFixed(1) : '0.0';
        summary += `• ${att.class_name}: ${att.present_sessions}/${att.total_sessions} sessions (${percentage}%)\n`;
      });
    }

    return summary || 'No recent performance data available.';

  } catch (error) {
    return 'Unable to generate student summary at this time.';
  }
}