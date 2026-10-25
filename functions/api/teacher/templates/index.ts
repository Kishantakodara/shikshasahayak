import { jsonResponse, errorResponse } from "../../../lib/json";
import { getAuthenticatedUser } from "../../../lib/auth";

/**
 * GET /api/teacher/templates
 * List assignment templates
 * 
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 50)
 * - search: Search by title or tags
 * - created_by: Filter by template creator ('me' | 'others' | 'all')
 * - is_public: Filter by visibility ('1' | '0' | 'all')
 * - tags: Filter by tags (comma-separated)
 * 
 * Requirements: Template system
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
    const search = url.searchParams.get("search");
    const createdBy = url.searchParams.get("created_by") || "all";
    const isPublic = url.searchParams.get("is_public") || "all";
    const tags = url.searchParams.get("tags");

    // Build WHERE clause
    let whereClause = "1=1";
    const params: any[] = [];

    // Filter by creator
    if (createdBy === "me") {
      whereClause += " AND created_by = ?";
      params.push(user.uid);
    } else if (createdBy === "others") {
      whereClause += " AND created_by != ?";
      params.push(user.uid);
    }

    // Filter by visibility
    if (isPublic === "1") {
      whereClause += " AND is_public = 1";
    } else if (isPublic === "0") {
      whereClause += " AND is_public = 0";
    }

    // If not showing own templates, only show public ones
    if (createdBy !== "me") {
      whereClause += " AND (is_public = 1 OR created_by = ?)";
      params.push(user.uid);
    }

    // Search filter
    if (search) {
      whereClause += " AND (title LIKE ? OR description LIKE ? OR tags LIKE ?)";
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    // Tags filter
    if (tags) {
      const tagList = tags.split(',').map(tag => tag.trim());
      const tagConditions = tagList.map(() => "tags LIKE ?").join(" AND ");
      whereClause += ` AND (${tagConditions})`;
      tagList.forEach(tag => params.push(`%"${tag}"%`));
    }

    // Get total count
    const countResult = await env.ASSESSMENT_DB
      .prepare(`SELECT COUNT(*) as total FROM assignment_templates WHERE ${whereClause}`)
      .bind(...params)
      .first();

    const total = countResult?.total || 0;

    // Fetch templates
    const templates = await env.ASSESSMENT_DB
      .prepare(
        `SELECT 
          t.id,
          t.title,
          t.description,
          t.total_marks,
          t.default_due_days,
          t.tags,
          t.is_public,
          t.usage_count,
          t.created_at,
          t.updated_at,
          sp.name as created_by_name
         FROM assignment_templates t
         LEFT JOIN student_profiles sp ON t.created_by = sp.user_id
         WHERE ${whereClause}
         ORDER BY 
           CASE WHEN t.created_by = ? THEN 0 ELSE 1 END,
           t.usage_count DESC,
           t.updated_at DESC
         LIMIT ? OFFSET ?`
      )
      .bind(...params, user.uid, limit, offset)
      .all();

    // Parse JSON fields and add metadata
    const templatesWithMetadata = (templates.results || []).map((template: any) => ({
      ...template,
      tags: template.tags ? JSON.parse(template.tags) : [],
      is_own_template: template.created_by === user.uid,
      can_edit: template.created_by === user.uid,
      can_delete: template.created_by === user.uid,
    }));

    // Get popular tags for filtering
    const popularTags = await env.ASSESSMENT_DB
      .prepare(
        `SELECT DISTINCT json_each.value as tag, COUNT(*) as count
         FROM assignment_templates t, json_each(t.tags)
         WHERE t.is_public = 1 OR t.created_by = ?
         GROUP BY json_each.value
         ORDER BY count DESC
         LIMIT 20`
      )
      .bind(user.uid)
      .all();

    return jsonResponse({
      templates: templatesWithMetadata,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + limit < total,
      },
      filters: {
        popular_tags: (popularTags.results || []).map((tag: any) => ({
          name: tag.tag,
          count: tag.count,
        })),
        created_by: createdBy,
        is_public: isPublic,
        search,
        tags,
      },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("GET /api/teacher/templates error:", message);
    return errorResponse(message, 500);
  }
}

/**
 * POST /api/teacher/templates
 * Create a new assignment template
 * 
 * Body: {
 *   title: string;
 *   description?: string;
 *   instructions?: string;
 *   total_marks: number;
 *   default_due_days?: number;
 *   allow_late_submission?: boolean;
 *   late_penalty_percent?: number;
 *   max_file_size_mb?: number;
 *   allowed_file_types?: string[];
 *   rubric?: RubricCriterion[];
 *   questions?: TemplateQuestion[];
 *   attachments?: string[];
 *   tags?: string[];
 *   is_public?: boolean;
 * }
 * 
 * Requirements: Template creation
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
      title,
      description,
      instructions,
      total_marks,
      default_due_days = 7,
      allow_late_submission = true,
      late_penalty_percent = 0,
      max_file_size_mb = 50,
      allowed_file_types,
      rubric,
      questions,
      attachments,
      tags = [],
      is_public = false,
    } = body;

    // Validation
    if (!title || title.trim().length === 0) {
      return errorResponse("title is required and cannot be empty", 400);
    }

    if (!total_marks || total_marks <= 0) {
      return errorResponse("total_marks must be a positive number", 400);
    }

    if (late_penalty_percent < 0 || late_penalty_percent > 100) {
      return errorResponse("late_penalty_percent must be between 0 and 100", 400);
    }

    if (default_due_days < 1 || default_due_days > 365) {
      return errorResponse("default_due_days must be between 1 and 365", 400);
    }

    // Validate rubric if provided
    if (rubric && Array.isArray(rubric)) {
      const rubricTotal = rubric.reduce((sum: number, criterion: any) => sum + (criterion.maxPoints || 0), 0);
      if (Math.abs(rubricTotal - total_marks) > 0.01) {
        return errorResponse(`Rubric total points (${rubricTotal}) must equal total_marks (${total_marks})`, 400);
      }
    }

    // Create template
    const templateId = crypto.randomUUID();
    const now_iso = new Date().toISOString();

    const templateData = {
      id: templateId,
      created_by: user.uid,
      title: title.trim(),
      description: description?.trim() || null,
      instructions: instructions?.trim() || null,
      total_marks,
      default_due_days,
      allow_late_submission: allow_late_submission ? 1 : 0,
      late_penalty_percent,
      max_file_size_mb,
      allowed_file_types: allowed_file_types ? JSON.stringify(allowed_file_types) : null,
      rubric: rubric ? JSON.stringify(rubric) : null,
      questions: questions ? JSON.stringify(questions) : null,
      attachments: attachments ? JSON.stringify(attachments) : null,
      tags: tags.length > 0 ? JSON.stringify(tags) : null,
      is_public: is_public ? 1 : 0,
      usage_count: 0,
      created_at: now_iso,
      updated_at: now_iso,
    };

    const result = await env.ASSESSMENT_DB
      .prepare(
        `INSERT INTO assignment_templates 
         (id, created_by, title, description, instructions, total_marks, default_due_days,
          allow_late_submission, late_penalty_percent, max_file_size_mb, allowed_file_types,
          rubric, questions, attachments, tags, is_public, usage_count, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        templateData.id,
        templateData.created_by,
        templateData.title,
        templateData.description,
        templateData.instructions,
        templateData.total_marks,
        templateData.default_due_days,
        templateData.allow_late_submission,
        templateData.late_penalty_percent,
        templateData.max_file_size_mb,
        templateData.allowed_file_types,
        templateData.rubric,
        templateData.questions,
        templateData.attachments,
        templateData.tags,
        templateData.is_public,
        templateData.usage_count,
        templateData.created_at,
        templateData.updated_at
      )
      .run();

    if (!result.success) {
      return errorResponse("Failed to create template", 500);
    }

    // Fetch created template with creator info
    const createdTemplate = await env.ASSESSMENT_DB
      .prepare(
        `SELECT 
          t.*,
          sp.name as created_by_name
         FROM assignment_templates t
         LEFT JOIN student_profiles sp ON t.created_by = sp.user_id
         WHERE t.id = ?`
      )
      .bind(templateId)
      .first();

    // Parse JSON fields
    const templateWithParsedData = {
      ...createdTemplate,
      allowed_file_types: createdTemplate.allowed_file_types 
        ? JSON.parse(createdTemplate.allowed_file_types) : null,
      rubric: createdTemplate.rubric ? JSON.parse(createdTemplate.rubric) : null,
      questions: createdTemplate.questions ? JSON.parse(createdTemplate.questions) : null,
      attachments: createdTemplate.attachments ? JSON.parse(createdTemplate.attachments) : null,
      tags: createdTemplate.tags ? JSON.parse(createdTemplate.tags) : [],
      is_own_template: true,
      can_edit: true,
      can_delete: true,
    };

    return jsonResponse({
      success: true,
      message: "Assignment template created successfully",
      template: templateWithParsedData,
    }, 201);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("POST /api/teacher/templates error:", message);
    return errorResponse(message, 500);
  }
}