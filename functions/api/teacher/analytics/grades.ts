import { jsonResponse, errorResponse } from "../../../lib/json";
import { getAuthenticatedUser } from "../../../lib/auth";

/**
 * GET /api/teacher/analytics/grades
 * Get grade analytics and distribution data
 * 
 * Query params:
 * - assignment_id: Get analytics for specific assignment
 * - class_id: Get analytics for specific class  
 * - period: 'week' | 'month' | 'semester' | 'all'
 * - include_distribution: Include grade distribution histogram
 * - include_trends: Include performance trends over time
 * 
 * Requirements: 10.1, 10.2, 10.3
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

    const assignmentId = url.searchParams.get("assignment_id");
    const classId = url.searchParams.get("class_id");
    const period = url.searchParams.get("period") || "all";
    const includeDistribution = url.searchParams.get("include_distribution") === "true";
    const includeTrends = url.searchParams.get("include_trends") === "true";

    // Build date filter based on period
    let dateFilter = "";
    const dateParams: any[] = [];
    const now = new Date();

    switch (period) {
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = "AND asub.submitted_at >= ?";
        dateParams.push(weekAgo.toISOString());
        break;
      case "month":
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFilter = "AND asub.submitted_at >= ?";
        dateParams.push(monthAgo.toISOString());
        break;
      case "semester":
        // Assume semester is current academic year
        const semesterStart = new Date(now.getFullYear(), now.getMonth() < 6 ? 0 : 6, 1);
        dateFilter = "AND asub.submitted_at >= ?";
        dateParams.push(semesterStart.toISOString());
        break;
      default:
        // No date filter for 'all'
        break;
    }

    // Build WHERE clause for teacher's assignments/classes
    let whereClause = "c.teacher_id = ?";
    let params = [user.uid];

    if (assignmentId) {
      whereClause += " AND a.id = ?";
      params.push(assignmentId);
    }

    if (classId) {
      whereClause += " AND c.id = ?";
      params.push(classId);
    }

    // Add date filter params
    params.push(...dateParams);

    // Get basic grade statistics
    const statsQuery = `
      SELECT 
        COUNT(asub.id) as total_submissions,
        COUNT(CASE WHEN asub.status IN ('GRADED', 'RETURNED') THEN 1 END) as graded_submissions,
        COUNT(CASE WHEN asub.status = 'PENDING' THEN 1 END) as pending_submissions,
        COUNT(CASE WHEN asub.is_late = 1 THEN 1 END) as late_submissions,
        AVG(CASE WHEN asub.marks IS NOT NULL AND a.total_marks > 0 
            THEN (asub.marks * 100.0 / a.total_marks) END) as average_percentage,
        MIN(CASE WHEN asub.marks IS NOT NULL AND a.total_marks > 0 
            THEN (asub.marks * 100.0 / a.total_marks) END) as min_percentage,
        MAX(CASE WHEN asub.marks IS NOT NULL AND a.total_marks > 0 
            THEN (asub.marks * 100.0 / a.total_marks) END) as max_percentage,
        COUNT(DISTINCT a.id) as assignments_count,
        COUNT(DISTINCT c.id) as classes_count,
        COUNT(DISTINCT asub.student_id) as students_count
      FROM assignment_submissions asub
      JOIN assignments a ON asub.assignment_id = a.id
      JOIN classes c ON a.class_id = c.id
      WHERE ${whereClause} ${dateFilter}
    `;

    const stats = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare(statsQuery)
      .bind(...params)
      .first();

    const analytics: any = {
      summary: {
        total_submissions: stats.total_submissions || 0,
        graded_submissions: stats.graded_submissions || 0,
        pending_submissions: stats.pending_submissions || 0,
        late_submissions: stats.late_submissions || 0,
        grading_completion_rate: stats.total_submissions > 0 
          ? ((stats.graded_submissions / stats.total_submissions) * 100).toFixed(2)
          : "0.00",
        average_percentage: stats.average_percentage ? parseFloat(stats.average_percentage.toFixed(2)) : null,
        min_percentage: stats.min_percentage ? parseFloat(stats.min_percentage.toFixed(2)) : null,
        max_percentage: stats.max_percentage ? parseFloat(stats.max_percentage.toFixed(2)) : null,
        assignments_count: stats.assignments_count || 0,
        classes_count: stats.classes_count || 0,
        students_count: stats.students_count || 0,
      },
    };

    // Get grade distribution if requested
    if (includeDistribution) {
      const distributionQuery = `
        SELECT 
          a.id as assignment_id,
          a.title as assignment_title,
          asub.marks,
          a.total_marks,
          (asub.marks * 100.0 / a.total_marks) as percentage
        FROM assignment_submissions asub
        JOIN assignments a ON asub.assignment_id = a.id
        JOIN classes c ON a.class_id = c.id
        WHERE ${whereClause} ${dateFilter}
          AND asub.marks IS NOT NULL 
          AND a.total_marks > 0
        ORDER BY a.id, percentage
      `;

      const distributionData = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
        .prepare(distributionQuery)
        .bind(...params)
        .all();

      // Calculate grade ranges
      const ranges = [
        { label: 'A+ (90-100%)', min: 90, max: 100, count: 0 },
        { label: 'A (80-89%)', min: 80, max: 89, count: 0 },
        { label: 'B+ (70-79%)', min: 70, max: 79, count: 0 },
        { label: 'B (60-69%)', min: 60, max: 69, count: 0 },
        { label: 'C (50-59%)', min: 50, max: 59, count: 0 },
        { label: 'F (0-49%)', min: 0, max: 49, count: 0 },
      ];

      const percentages = (distributionData.results || []).map((row: any) => row.percentage);
      
      percentages.forEach((pct: number) => {
        for (const range of ranges) {
          if (pct >= range.min && pct <= range.max) {
            range.count++;
            break;
          }
        }
      });

      // Calculate statistics
      const sortedPercentages = [...percentages].sort((a, b) => a - b);
      const median = sortedPercentages.length > 0
        ? sortedPercentages.length % 2 === 0
          ? (sortedPercentages[sortedPercentages.length / 2 - 1] + sortedPercentages[sortedPercentages.length / 2]) / 2
          : sortedPercentages[Math.floor(sortedPercentages.length / 2)]
        : 0;

      const variance = percentages.length > 0
        ? percentages.reduce((sum, pct) => sum + Math.pow(pct - (stats.average_percentage || 0), 2), 0) / percentages.length
        : 0;

      analytics.distribution = {
        ranges,
        statistics: {
          median: parseFloat(median.toFixed(2)),
          standard_deviation: parseFloat(Math.sqrt(variance).toFixed(2)),
          total_graded: percentages.length,
        },
      };
    }

    // Get performance trends if requested
    if (includeTrends) {
      const trendsQuery = `
        SELECT 
          date(asub.submitted_at) as submission_date,
          COUNT(asub.id) as submissions_count,
          AVG(CASE WHEN asub.marks IS NOT NULL AND a.total_marks > 0 
              THEN (asub.marks * 100.0 / a.total_marks) END) as avg_percentage,
          COUNT(CASE WHEN asub.status IN ('GRADED', 'RETURNED') THEN 1 END) as graded_count
        FROM assignment_submissions asub
        JOIN assignments a ON asub.assignment_id = a.id
        JOIN classes c ON a.class_id = c.id
        WHERE ${whereClause} ${dateFilter}
        GROUP BY date(asub.submitted_at)
        ORDER BY submission_date DESC
        LIMIT 30
      `;

      const trendsData = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
        .prepare(trendsQuery)
        .bind(...params)
        .all();

      analytics.trends = {
        daily_submissions: (trendsData.results || []).reverse().map((row: any) => ({
          date: row.submission_date,
          submissions: row.submissions_count,
          average_percentage: row.avg_percentage ? parseFloat(row.avg_percentage.toFixed(2)) : null,
          graded_count: row.graded_count,
        })),
      };
    }

    // Get class-wise performance if no specific class is selected
    if (!classId) {
      const classPerformanceQuery = `
        SELECT 
          c.id,
          c.name as class_name,
          c.section,
          COUNT(asub.id) as total_submissions,
          COUNT(CASE WHEN asub.status IN ('GRADED', 'RETURNED') THEN 1 END) as graded_submissions,
          AVG(CASE WHEN asub.marks IS NOT NULL AND a.total_marks > 0 
              THEN (asub.marks * 100.0 / a.total_marks) END) as avg_percentage,
          COUNT(DISTINCT asub.student_id) as active_students
        FROM classes c
        LEFT JOIN assignments a ON c.id = a.class_id
        LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id ${dateFilter.replace('AND', 'AND')}
        WHERE c.teacher_id = ? AND c.is_active = 1
        GROUP BY c.id, c.name, c.section
        ORDER BY c.name, c.section
      `;

      const classPerformanceParams = [user.uid, ...dateParams];
      const classPerformance = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
        .prepare(classPerformanceQuery)
        .bind(...classPerformanceParams)
        .all();

      analytics.class_performance = (classPerformance.results || []).map((row: any) => ({
        class_id: row.id,
        class_name: row.class_name,
        section: row.section,
        total_submissions: row.total_submissions || 0,
        graded_submissions: row.graded_submissions || 0,
        average_percentage: row.avg_percentage ? parseFloat(row.avg_percentage.toFixed(2)) : null,
        active_students: row.active_students || 0,
        completion_rate: row.total_submissions > 0 
          ? ((row.graded_submissions / row.total_submissions) * 100).toFixed(2)
          : "0.00",
      }));
    }

    // Identify at-risk students (below 60% average)
    const atRiskQuery = `
      SELECT 
        sp.user_id,
        sp.name as student_name,
        ce.enrollment_number,
        c.id as class_id,
        c.name as class_name,
        AVG(CASE WHEN asub.marks IS NOT NULL AND a.total_marks > 0 
            THEN (asub.marks * 100.0 / a.total_marks) END) as avg_percentage,
        COUNT(asub.id) as total_submissions,
        COUNT(CASE WHEN asub.status = 'PENDING' THEN 1 END) as pending_submissions,
        COUNT(CASE WHEN asub.is_late = 1 THEN 1 END) as late_submissions
      FROM student_profiles sp
      JOIN class_enrollments ce ON sp.user_id = ce.student_id
      JOIN classes c ON ce.class_id = c.id
      LEFT JOIN assignments a ON c.id = a.class_id
      LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id AND asub.student_id = sp.user_id
      WHERE c.teacher_id = ? 
        AND ce.enrollment_status = 'ACTIVE'
        ${classId ? 'AND c.id = ?' : ''}
        ${dateFilter}
      GROUP BY sp.user_id, sp.name, ce.enrollment_number, c.id, c.name
      HAVING avg_percentage IS NOT NULL AND avg_percentage < 60
      ORDER BY avg_percentage ASC, late_submissions DESC
      LIMIT 20
    `;

    const atRiskParams = [user.uid];
    if (classId) atRiskParams.push(classId);
    atRiskParams.push(...dateParams);

    const atRiskStudents = await (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB)
      .prepare(atRiskQuery)
      .bind(...atRiskParams)
      .all();

    analytics.at_risk_students = (atRiskStudents.results || []).map((row: any) => ({
      student_id: row.user_id,
      student_name: row.student_name,
      enrollment_number: row.enrollment_number,
      class_id: row.class_id,
      class_name: row.class_name,
      average_percentage: parseFloat(row.avg_percentage.toFixed(2)),
      total_submissions: row.total_submissions || 0,
      pending_submissions: row.pending_submissions || 0,
      late_submissions: row.late_submissions || 0,
      risk_factors: [
        ...(row.avg_percentage < 50 ? ['Low academic performance'] : []),
        ...(row.late_submissions > 2 ? ['Frequent late submissions'] : []),
        ...(row.pending_submissions > 1 ? ['Multiple pending assignments'] : []),
      ],
    }));

    return jsonResponse({
      success: true,
      analytics,
      filters: {
        period,
        assignment_id: assignmentId,
        class_id: classId,
        include_distribution: includeDistribution,
        include_trends: includeTrends,
      },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("GET /api/teacher/analytics/grades error:", message);
    return errorResponse(message, 500);
  }
}
