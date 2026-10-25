import { jsonResponse, errorResponse } from "../../../../lib/json";
import { getAuthenticatedUser } from "../../../../lib/auth";
import { 
  generateUniqueJoinCode,
  isClassTeacher,
  isHOD,
  getTeacherDb
} from "../../../../lib/classHelpers";

/**
 * POST /api/teacher/classes/:id/regenerate-code
 * Regenerate join code for a class
 * 
 * Requirements: 2.5
 */
export async function onRequestPost(context: { 
  env: { DB?: any; ASSESSMENT_DB?: any; PADHAKU_CORE_DB?: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string }; 
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const db = getTeacherDb(env);
  const classId = params.id;

  if (!db) {
    return errorResponse("Database binding not configured", 500);
  }

  try {
    // Authenticate user
    const user = await getAuthenticatedUser(request, env);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    // Fetch existing class
    const cls = await db
      .prepare(`SELECT * FROM classes WHERE id = ?`)
      .bind(classId)
      .first();

    if (!cls) {
      return errorResponse("Class not found", 404);
    }

    // Authorization: only class teacher, HOD, or admin can regenerate code
    const isTeacher = await isClassTeacher(db, classId, user.uid);
    const isHodUser = await isHOD(db, user.uid);
    const isAdmin = user.role === 'admin';

    if (!isTeacher && !isHodUser && !isAdmin) {
      return errorResponse("Forbidden: You do not have permission to regenerate join code for this class", 403);
    }

    // Generate new unique join code (excluding current class from uniqueness check)
    const newJoinCode = await generateUniqueJoinCode(db, classId);

    // Update class with new join code
    await db
      .prepare(`UPDATE classes SET join_code = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .bind(newJoinCode, classId)
      .run();

    return jsonResponse({
      success: true,
      message: "Join code regenerated successfully",
      classId,
      oldJoinCode: cls.join_code,
      newJoinCode,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`POST /api/teacher/classes/${classId}/regenerate-code error:`, message);
    return errorResponse(message, 500);
  }
}
