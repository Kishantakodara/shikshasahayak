import { jsonResponse, errorResponse } from "../../../lib/json";
import { getAuthenticatedUser } from "../../../lib/auth";

/**
 * GET /api/teacher/analytics/dashboard
 * Get comprehensive analytics for teacher dashboard
 * 
 * Query params:
 * - class_id: Filter by specific class (optional)
 * - period: Time period (week/month/semester/all, default: month)
 * 
 * Requirements: 9.1, 9.2, 9.3
 */
export async function onRequestGet(context: {
  env: { PADHAKU_CORE_DB?: D1Database; ASSESSMENT_DB: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
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

    const classId = url.searchParams.get("class_id");
    const period = url.searchParams.get("period") || "month";

    // Calculate date range based on period
    const now = new Date();
    let startDate: string;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'semester':
        startDate = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'all':
      default:
        startDate = '2000-01-01T00:00:00.000Z'; // Far past date
        break;
    }

    // Build class filter
    let classFilter = "c.teacher_id = ?";
    const classParams = [user.uid];
    
    if (classId) {
      classFilter += " AND c.id = ?";
      classParams.push(classId);
    }

    // 1. Class Overview Statistics
    const classStats = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare(
        `SELECT 
          COUNT(*) as total_classes,
          SUM(CASE WHEN c.is_active = 1 THEN 1 ELSE 0 END) as active_classes,
          COUNT(DISTINCT ce.student_id) as total_enrolled_students,
          SUM(CASE WHEN ce.enrollment_status = 'ACTIVE' THEN 1 ELSE 0 END) as active_students
         FROM classes c
         LEFT JOIN class_enrollments ce ON c.id = ce.class_id
         WHERE ${classFilter}`
      )
      .bind(...classParams)
      .first();

    // 2. Assignment Statistics
    const assignmentStats = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare(
        `SELECT 
          COUNT(*) as total_assignments,
          SUM(CASE WHEN a.status = 'PUBLISHED' THEN 1 ELSE 0 END) as published_assignments,
          SUM(CASE WHEN a.status = 'DRAFT' THEN 1 ELSE 0 END) as draft_assignments,
          COUNT(DISTINCT asub.id) as total_submissions,
          SUM(CASE WHEN asub.status = 'GRADED' THEN 1 ELSE 0 END) as graded_submissions,
          AVG(CASE WHEN asub.marks IS NOT NULL THEN (asub.marks / a.total_marks) * 100 END) as average_grade_percentage
         FROM classes c
         LEFT JOIN assignments a ON c.id = a.class_id
         LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id
         WHERE ${classFilter} AND a.created_at >= ?`
      )
      .bind(...classParams, startDate)
      .first();

    // 3. Quiz Assignment Statistics
    const quizStats = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare(
        `SELECT 
          COUNT(*) as total_quiz_assignments,
          SUM(CASE WHEN qca.is_visible = 1 THEN 1 ELSE 0 END) as visible_quiz_assignments,
          COUNT(DISTINCT qa.student_id) as quiz_attempts,
          AVG(CASE WHEN qa.score IS NOT NULL THEN qa.score END) as average_quiz_score
         FROM classes c
         LEFT JOIN quiz_class_assignments qca ON c.id = qca.class_id
         LEFT JOIN quizzes q ON qca.quiz_id = q.id
         LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id
         WHERE ${classFilter} AND qca.assigned_at >= ?`
      )
      .bind(...classParams, startDate)
      .first();

    // 4. Material Statistics
    const materialStats = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare(
        `SELECT 
          COUNT(*) as total_materials,
          SUM(CASE WHEN cm.is_visible = 1 THEN 1 ELSE 0 END) as visible_materials,
          COUNT(DISTINCT ms.student_id) as unique_material_viewers,
          SUM(ms.download_count) as total_downloads
         FROM classes c
         LEFT JOIN class_materials cm ON c.id = cm.class_id
         LEFT JOIN material_stats ms ON cm.id = ms.material_id
         WHERE ${classFilter} AND cm.created_at >= ?`
      )
      .bind(...classParams, startDate)
      .first();

    // 5. Attendance Statistics (if period allows)
    const attendanceStats = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare(
        `SELECT 
          COUNT(*) as total_attendance_records,
          SUM(CASE WHEN ar.status = 'PRESENT' THEN 1 ELSE 0 END) as present_count,
          SUM(CASE WHEN ar.status = 'ABSENT' THEN 1 ELSE 0 END) as absent_count,
          SUM(CASE WHEN ar.status = 'LATE' THEN 1 ELSE 0 END) as late_count,
          ROUND(
            (SUM(CASE WHEN ar.status IN ('PRESENT', 'LATE') THEN 1 ELSE 0 END) * 100.0) / 
            NULLIF(COUNT(*), 0), 2
          ) as attendance_percentage
         FROM classes c
         LEFT JOIN attendance_records ar ON c.id = ar.class_id
         WHERE ${classFilter} AND ar.date >= ?`
      )
      .bind(...classParams, startDate.split('T')[0])
      .first();

    // 6. Recent Activity Timeline
    const recentActivity = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare(
        `SELECT 
          'assignment' as activity_type,
          a.title as title,
          a.status as status,
          a.created_at as timestamp,
          c.name as class_name
         FROM assignments a
         JOIN classes c ON a.class_id = c.id
         WHERE ${classFilter} AND a.created_at >= ?
         
         UNION ALL
         
         SELECT 
          'material' as activity_type,
          cm.title as title,
          CASE WHEN cm.is_visible = 1 THEN 'visible' ELSE 'hidden' END as status,
          cm.created_at as timestamp,
          c.name as class_name
         FROM class_materials cm
         JOIN classes c ON cm.class_id = c.id
         WHERE ${classFilter} AND cm.created_at >= ?
         
         ORDER BY timestamp DESC
         LIMIT 20`
      )
      .bind(...classParams, startDate, ...classParams, startDate)
      .all();

    // 7. Grade Distribution (if assignments exist)
    const gradeDistribution = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare(
        `SELECT 
          CASE 
            WHEN (asub.marks / a.total_marks * 100) >= 90 THEN 'A'
            WHEN (asub.marks / a.total_marks * 100) >= 80 THEN 'B'
            WHEN (asub.marks / a.total_marks * 100) >= 70 THEN 'C'
            WHEN (asub.marks / a.total_marks * 100) >= 60 THEN 'D'
            ELSE 'F'
          END as grade_band,
          COUNT(*) as count
         FROM classes c
         JOIN assignments a ON c.id = a.class_id
         JOIN assignment_submissions asub ON a.id = asub.assignment_id
         WHERE ${classFilter} AND asub.marks IS NOT NULL AND a.created_at >= ?
         GROUP BY grade_band
         ORDER BY grade_band`
      )
      .bind(...classParams, startDate)
      .all();

    // 8. Class Performance Comparison (if multiple classes)
    const classPerformance = classId ? null : await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare(
        `SELECT 
          c.id,
          c.name,
          c.section,
          COUNT(DISTINCT ce.student_id) as enrolled_students,
          COUNT(DISTINCT a.id) as assignments_count,
          AVG(CASE WHEN asub.marks IS NOT NULL THEN (asub.marks / a.total_marks) * 100 END) as avg_grade_percentage,
          COUNT(DISTINCT asub.id) as total_submissions
         FROM classes c
         LEFT JOIN class_enrollments ce ON c.id = ce.class_id AND ce.enrollment_status = 'ACTIVE'
         LEFT JOIN assignments a ON c.id = a.class_id AND a.status = 'PUBLISHED'
         LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id AND asub.marks IS NOT NULL
         WHERE c.teacher_id = ?
         GROUP BY c.id, c.name, c.section
         ORDER BY avg_grade_percentage DESC`
      )
      .bind(user.uid)
      .all();

    const analytics = {
      period,
      date_range: {
        start: startDate,
        end: now.toISOString()
      },
      class_stats: {
        total_classes: classStats?.total_classes || 0,
        active_classes: classStats?.active_classes || 0,
        total_enrolled_students: classStats?.total_enrolled_students || 0,
        active_students: classStats?.active_students || 0,
      },
      assignment_stats: {
        total_assignments: assignmentStats?.total_assignments || 0,
        published_assignments: assignmentStats?.published_assignments || 0,
        draft_assignments: assignmentStats?.draft_assignments || 0,
        total_submissions: assignmentStats?.total_submissions || 0,
        graded_submissions: assignmentStats?.graded_submissions || 0,
        average_grade_percentage: assignmentStats?.average_grade_percentage || null,
        grading_completion_rate: assignmentStats?.total_submissions > 0 
          ? ((assignmentStats?.graded_submissions || 0) / assignmentStats.total_submissions * 100).toFixed(1)
          : null
      },
      quiz_stats: {
        total_quiz_assignments: quizStats?.total_quiz_assignments || 0,
        visible_quiz_assignments: quizStats?.visible_quiz_assignments || 0,
        quiz_attempts: quizStats?.quiz_attempts || 0,
        average_quiz_score: quizStats?.average_quiz_score || null,
      },
      material_stats: {
        total_materials: materialStats?.total_materials || 0,
        visible_materials: materialStats?.visible_materials || 0,
        unique_material_viewers: materialStats?.unique_material_viewers || 0,
        total_downloads: materialStats?.total_downloads || 0,
        avg_downloads_per_material: materialStats?.total_materials > 0 
          ? ((materialStats?.total_downloads || 0) / materialStats.total_materials).toFixed(1)
          : null
      },
      attendance_stats: {
        total_records: attendanceStats?.total_attendance_records || 0,
        present_count: attendanceStats?.present_count || 0,
        absent_count: attendanceStats?.absent_count || 0,
        late_count: attendanceStats?.late_count || 0,
        attendance_percentage: attendanceStats?.attendance_percentage || null,
      },
      recent_activity: recentActivity.results || [],
      grade_distribution: (gradeDistribution.results || []).map((grade: any) => ({
        grade: grade.grade_band,
        count: grade.count,
        percentage: assignmentStats?.graded_submissions > 0 
          ? ((grade.count / (assignmentStats?.graded_submissions || 1)) * 100).toFixed(1)
          : "0"
      })),
      class_performance: classPerformance?.results || null,
    };

    return jsonResponse(analytics);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("GET /api/teacher/analytics error:", message);
    return errorResponse(message, 500);
  }
}
