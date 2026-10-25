import { jsonResponse, errorResponse } from "../../../lib/json";
import { getAuthenticatedUser } from "../../../lib/auth";

/**
 * GET /api/teacher/quizzes
 * Browse available quizzes for assignment to classes
 * 
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 50)
 * - subject: Filter by subject
 * - category: Filter by category
 * - difficulty: Filter by difficulty (EASY/MEDIUM/HARD)
 * - search: Search by title
 * - class_id: If provided, excludes already assigned quizzes for this class
 * 
 * Requirements: 4.2, 4.3
 */
export async function onRequestGet(context: {
  env: { DB?: any; ASSESSMENT_DB?: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
}) {
  const { env, request } = context;
  const db = env.ASSESSMENT_DB || env.DB;
  const url = new URL(request.url);

  if (!db) {
    return errorResponse("Database binding not found", 500);
  }

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
    const subject = url.searchParams.get("subject");
    const category = url.searchParams.get("category");
    const difficulty = url.searchParams.get("difficulty");
    const search = url.searchParams.get("search");
    const classId = url.searchParams.get("class_id");

    // Build WHERE clause
    let whereClause = "1=1";
    const params_bind: any[] = [];

    if (subject) {
      whereClause += " AND q.subject = ?";
      params_bind.push(subject);
    }

    if (category) {
      whereClause += " AND q.category = ?";
      params_bind.push(category);
    }

    if (difficulty) {
      whereClause += " AND q.difficulty = ?";
      params_bind.push(difficulty);
    }

    if (search) {
      whereClause += " AND q.title LIKE ?";
      params_bind.push(`%${search}%`);
    }

    // Exclude already assigned quizzes for the specified class
    if (classId) {
      whereClause += ` AND q.id NOT IN (
        SELECT quiz_id FROM quiz_class_assignments WHERE class_id = ?
      )`;
      params_bind.push(classId);
    }

    // Get total count
    const countResult = await db
      .prepare(`SELECT COUNT(*) as total FROM quizzes q WHERE ${whereClause}`)
      .bind(...params_bind)
      .first();

    const total = countResult?.total || 0;

    // Fetch quizzes
    const quizzes = await db
      .prepare(
        `SELECT 
          q.id,
          q.title,
          q.subject,
          q.code,
          q.category,
          q.difficulty,
          q.duration,
          q.xp_reward,
          q.total_questions,
          q.passing_marks,
          q.created_at,
          q.updated_at,
          -- Count how many classes this quiz is assigned to
          (SELECT COUNT(*) FROM quiz_class_assignments qca WHERE qca.quiz_id = q.id) as assigned_classes_count
         FROM quizzes q
         WHERE ${whereClause}
         ORDER BY q.created_at DESC
         LIMIT ? OFFSET ?`
      )
      .bind(...params_bind, limit, offset)
      .all();

    // Get unique subjects for filtering
    const subjects = await db
      .prepare("SELECT DISTINCT subject FROM quizzes ORDER BY subject")
      .all();

    // Get unique categories for filtering
    const categories = await db
      .prepare("SELECT DISTINCT category FROM quizzes ORDER BY category")
      .all();

    return jsonResponse({
      quizzes: quizzes.results || [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + limit < total,
      },
      filters: {
        subjects: (subjects.results || []).map((s: any) => s.subject),
        categories: (categories.results || []).map((c: any) => c.category),
        difficulties: ['EASY', 'MEDIUM', 'HARD'],
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("GET /api/teacher/quizzes error:", message);
    return errorResponse(message, 500);
  }
}