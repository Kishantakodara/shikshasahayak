import { jsonResponse, errorResponse } from "../../../lib/json";
import { getAuthenticatedUser } from "../../../lib/auth";

/**
 * GET /api/teacher/materials
 * List all materials uploaded by the authenticated teacher
 * 
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 50)
 * - class_id: Filter by class
 * - is_visible: Filter by visibility (1/0/all)
 * - search: Search by title
 * 
 * Requirements: 7.1, 7.2
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
    const classId = url.searchParams.get("class_id");
    const isVisible = url.searchParams.get("is_visible") || "all";
    const search = url.searchParams.get("search");

    // Build WHERE clause - only show materials from classes the teacher owns
    let whereClause = "cm.uploaded_by = ?";
    const params_bind: any[] = [user.uid];

    if (classId) {
      whereClause += " AND cm.class_id = ?";
      params_bind.push(classId);
    }

    if (isVisible !== "all") {
      whereClause += " AND cm.is_visible = ?";
      params_bind.push(parseInt(isVisible));
    }

    if (search) {
      whereClause += " AND cm.title LIKE ?";
      params_bind.push(`%${search}%`);
    }

    // Get total count
    const countResult = await db
      .prepare(`SELECT COUNT(*) as total FROM class_materials cm JOIN classes c ON cm.class_id = c.id WHERE ${whereClause}`)
      .bind(...params_bind)
      .first();

    const total = countResult?.total || 0;

    // Fetch materials with class details and stats
    const materials = await db
      .prepare(
        `SELECT 
          cm.*,
          c.name as class_name,
          c.section as class_section,
          -- Download stats
          (SELECT COUNT(*) FROM material_stats ms WHERE ms.material_id = cm.id) as unique_viewers,
          (SELECT SUM(download_count) FROM material_stats ms WHERE ms.material_id = cm.id) as total_downloads,
          (SELECT MAX(last_accessed) FROM material_stats ms WHERE ms.material_id = cm.id) as last_accessed
         FROM class_materials cm
         JOIN classes c ON cm.class_id = c.id
         WHERE ${whereClause}
         ORDER BY cm.created_at DESC
         LIMIT ? OFFSET ?`
      )
      .bind(...params_bind, limit, offset)
      .all();

    return jsonResponse({
      materials: materials.results || [],
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
    console.error("GET /api/teacher/materials error:", message);
    return errorResponse(message, 500);
  }
}

/**
 * POST /api/teacher/materials
 * Upload a new material file
 * 
 * Body: {
 *   class_id: string,
 *   title: string,
 *   description?: string,
 *   file_url: string,
 *   file_name: string,
 *   file_type: string,
 *   file_size_bytes: number,
 *   is_visible?: boolean
 * }
 * 
 * Requirements: 7.3, 7.4
 */
export async function onRequestPost(context: {
  env: { DB?: any; ASSESSMENT_DB?: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
}) {
  const { env, request } = context;
  const db = env.ASSESSMENT_DB || env.DB;

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

    const body: any = await request.json();
    const {
      class_id,
      title,
      description,
      file_url,
      file_name,
      file_type,
      file_size_bytes,
      is_visible = true
    } = body;

    // Validate required fields
    if (!class_id || !title || !file_url || !file_name || !file_type || !file_size_bytes) {
      return errorResponse("Missing required fields: class_id, title, file_url, file_name, file_type, file_size_bytes", 400);
    }

    if (title.length > 300) {
      return errorResponse("Title must be 300 characters or less", 400);
    }

    if (file_size_bytes <= 0) {
      return errorResponse("file_size_bytes must be greater than 0", 400);
    }

    // Verify class exists and teacher owns it
    const classInfo = await db
      .prepare("SELECT id, teacher_id, is_active FROM classes WHERE id = ?")
      .bind(class_id)
      .first();

    if (!classInfo) {
      return errorResponse("Class not found", 404);
    }

    if (classInfo.teacher_id !== user.uid) {
      return errorResponse("Forbidden: You can only upload materials to your own classes", 403);
    }

    if (!classInfo.is_active) {
      return errorResponse("Cannot upload materials to inactive class", 400);
    }

    // Create material record
    const materialId = crypto.randomUUID();
    const now_iso = new Date().toISOString();

    const result = await db
      .prepare(
        `INSERT INTO class_materials 
         (id, class_id, title, description, file_url, file_name, file_type, 
          file_size_bytes, is_visible, uploaded_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        materialId,
        class_id,
        title,
        description || null,
        file_url,
        file_name,
        file_type,
        file_size_bytes,
        is_visible ? 1 : 0,
        user.uid,
        now_iso,
        now_iso
      )
      .run();

    if (!result.success) {
      return errorResponse("Failed to create material record", 500);
    }

    // Fetch created material with class details
    const material = await db
      .prepare(
        `SELECT 
          cm.*,
          c.name as class_name,
          c.section as class_section
         FROM class_materials cm
         JOIN classes c ON cm.class_id = c.id
         WHERE cm.id = ?`
      )
      .bind(materialId)
      .first();

    return jsonResponse({
      success: true,
      message: "Material uploaded successfully",
      material: material,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("POST /api/teacher/materials error:", message);
    return errorResponse(message, 500);
  }
}