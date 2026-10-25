// ============================================================
// TEACHER API: PUT / DELETE /api/teacher/classes/:id/quizzes/:assignmentId
// Updates quiz visibility or removes quiz assignment from class
// ============================================================

import { jsonResponse, errorResponse } from "../../../../../lib/json";
import { getAuthenticatedUser } from "../../../../../lib/auth";

export async function onRequestPut(context: {
  env: { PADHAKU_CORE_DB?: D1Database; DB?: any; ASSESSMENT_DB?: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string; assignmentId: string };
}) {
  const { env, request, params } = context;
  const { id: classId, assignmentId } = params;
  const db = (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB) || env.DB;

  if (!db) {
    return errorResponse("Database binding not found", 500);
  }

  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user || !user.uid) {
      return errorResponse("Unauthorized - Teacher authentication required", 401);
    }

    const body = (await request.json().catch(() => ({}))) as {
      is_visible?: boolean;
      isVisible?: boolean;
    };

    const isVisible = body.is_visible ?? body.isVisible ?? true;

    await db
      .prepare(`UPDATE quiz_class_assignments SET is_visible = ? WHERE id = ? AND class_id = ?`)
      .bind(isVisible ? 1 : 0, assignmentId, classId)
      .run();

    return jsonResponse({
      success: true,
      message: "Quiz assignment updated successfully",
      assignment: { id: assignmentId, class_id: classId, is_visible: isVisible },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update quiz assignment";
    console.error("PUT /api/teacher/classes/:id/quizzes/:assignmentId error:", message);
    return errorResponse(message, 500);
  }
}

export async function onRequestDelete(context: {
  env: { PADHAKU_CORE_DB?: D1Database; DB?: any; ASSESSMENT_DB?: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string; assignmentId: string };
}) {
  const { env, request, params } = context;
  const { id: classId, assignmentId } = params;
  const db = (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB) || env.DB;

  if (!db) {
    return errorResponse("Database binding not found", 500);
  }

  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user || !user.uid) {
      return errorResponse("Unauthorized - Teacher authentication required", 401);
    }

    await db
      .prepare(`DELETE FROM quiz_class_assignments WHERE (id = ? OR quiz_id = ?) AND class_id = ?`)
      .bind(assignmentId, assignmentId, classId)
      .run();

    return jsonResponse({
      success: true,
      message: "Quiz unassigned from class successfully",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to remove quiz assignment";
    console.error("DELETE /api/teacher/classes/:id/quizzes/:assignmentId error:", message);
    return errorResponse(message, 500);
  }
}
