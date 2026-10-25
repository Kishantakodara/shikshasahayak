import { jsonResponse, errorResponse } from "../../../lib/json";
import { getAuthenticatedUser } from "../../../lib/auth";

/**
 * GET /api/teacher/materials/:id
 * Get a single material with detailed stats
 * 
 * Requirements: 7.2, 7.5
 */
export async function onRequestGet(context: {
  env: { DB?: any; ASSESSMENT_DB?: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const db = env.ASSESSMENT_DB || env.DB;
  const materialId = params.id;

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

    // Fetch material with class details and ownership check
    const material = await db
      .prepare(
        `SELECT 
          cm.*,
          c.name as class_name,
          c.section as class_section,
          c.teacher_id as class_teacher_id
         FROM class_materials cm
         JOIN classes c ON cm.class_id = c.id
         WHERE cm.id = ?`
      )
      .bind(materialId)
      .first();

    if (!material) {
      return errorResponse("Material not found", 404);
    }

    // Verify teacher owns the class
    if (material.class_teacher_id !== user.uid) {
      return errorResponse("Forbidden: You can only view materials from your own classes", 403);
    }

    // Fetch detailed statistics
    const stats = await db
      .prepare(
        `SELECT 
          COUNT(*) as unique_viewers,
          SUM(download_count) as total_downloads,
          MAX(last_accessed) as last_accessed,
          MIN(viewed_at) as first_accessed
         FROM material_stats
         WHERE material_id = ?`
      )
      .bind(materialId)
      .first();

    // Fetch recent viewers (last 10)
    const recentViewers = await db
      .prepare(
        `SELECT 
          ms.student_id,
          ms.viewed_at,
          ms.download_count,
          ms.last_accessed,
          sp.name as student_name,
          ce.enrollment_number
         FROM material_stats ms
         LEFT JOIN student_profiles sp ON ms.student_id = sp.user_id
         LEFT JOIN class_enrollments ce ON ms.student_id = ce.student_id AND ce.class_id = ?
         WHERE ms.material_id = ?
         ORDER BY ms.last_accessed DESC
         LIMIT 10`
      )
      .bind(material.class_id, materialId)
      .all();

    const materialWithStats = {
      ...material,
      stats: {
        unique_viewers: stats?.unique_viewers || 0,
        total_downloads: stats?.total_downloads || 0,
        last_accessed: stats?.last_accessed,
        first_accessed: stats?.first_accessed,
      },
      recent_viewers: recentViewers.results || []
    };

    return jsonResponse(materialWithStats);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("GET /api/teacher/materials/:id error:", message);
    return errorResponse(message, 500);
  }
}

/**
 * PUT /api/teacher/materials/:id
 * Update material metadata
 * 
 * Body: {
 *   title?: string,
 *   description?: string,
 *   is_visible?: boolean
 * }
 * 
 * Requirements: 7.4
 */
export async function onRequestPut(context: {
  env: { DB?: any; ASSESSMENT_DB?: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const db = env.ASSESSMENT_DB || env.DB;
  const materialId = params.id;

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

    // Fetch existing material with ownership check
    const existingMaterial = await db
      .prepare(
        `SELECT 
          cm.id,
          cm.uploaded_by,
          c.teacher_id as class_teacher_id
         FROM class_materials cm
         JOIN classes c ON cm.class_id = c.id
         WHERE cm.id = ?`
      )
      .bind(materialId)
      .first();

    if (!existingMaterial) {
      return errorResponse("Material not found", 404);
    }

    // Verify teacher owns the material
    if (existingMaterial.class_teacher_id !== user.uid) {
      return errorResponse("Forbidden: You can only update your own materials", 403);
    }

    const body: any = await request.json();
    const { title, description, is_visible } = body;

    // Validate title if provided
    if (title !== undefined) {
      if (!title || title.trim().length === 0) {
        return errorResponse("Title cannot be empty", 400);
      }
      if (title.length > 300) {
        return errorResponse("Title must be 300 characters or less", 400);
      }
    }

    // Build UPDATE query dynamically
    const updates: string[] = [];
    const params_bind: any[] = [];

    if (title !== undefined) {
      updates.push("title = ?");
      params_bind.push(title.trim());
    }

    if (description !== undefined) {
      updates.push("description = ?");
      params_bind.push(description?.trim() || null);
    }

    if (is_visible !== undefined) {
      updates.push("is_visible = ?");
      params_bind.push(is_visible ? 1 : 0);
    }

    if (updates.length === 0) {
      return errorResponse("No fields to update", 400);
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");
    params_bind.push(materialId);

    // Update material
    const result = await db
      .prepare(
        `UPDATE class_materials 
         SET ${updates.join(", ")}
         WHERE id = ?`
      )
      .bind(...params_bind)
      .run();

    if (!result.success) {
      return errorResponse("Failed to update material", 500);
    }

    // Fetch updated material
    const updatedMaterial = await db
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
      message: "Material updated successfully",
      material: updatedMaterial,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("PUT /api/teacher/materials/:id error:", message);
    return errorResponse(message, 500);
  }
}

/**
 * DELETE /api/teacher/materials/:id
 * Delete a material
 * 
 * Requirements: 7.4
 */
export async function onRequestDelete(context: {
  env: { DB?: any; ASSESSMENT_DB?: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const db = env.ASSESSMENT_DB || env.DB;
  const materialId = params.id;

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

    // Fetch material with ownership check
    const material = await db
      .prepare(
        `SELECT 
          cm.id,
          cm.title,
          cm.file_url,
          c.teacher_id as class_teacher_id
         FROM class_materials cm
         JOIN classes c ON cm.class_id = c.id
         WHERE cm.id = ?`
      )
      .bind(materialId)
      .first();

    if (!material) {
      return errorResponse("Material not found", 404);
    }

    // Verify teacher owns the material
    if (material.class_teacher_id !== user.uid) {
      return errorResponse("Forbidden: You can only delete your own materials", 403);
    }

    // Delete material stats first (foreign key constraint)
    await db
      .prepare("DELETE FROM material_stats WHERE material_id = ?")
      .bind(materialId)
      .run();

    // Delete material record
    const result = await db
      .prepare("DELETE FROM class_materials WHERE id = ?")
      .bind(materialId)
      .run();

    if (!result.success) {
      return errorResponse("Failed to delete material", 500);
    }

    // TODO: Delete actual file from storage (R2/S3)
    // This would be implemented based on the storage solution
    console.log(`TODO: Delete file ${material.file_url} from storage`);

    return jsonResponse({
      success: true,
      message: "Material deleted successfully",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("DELETE /api/teacher/materials/:id error:", message);
    return errorResponse(message, 500);
  }
}