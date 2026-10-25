// ============================================================
// TEACHER API: POST /api/teacher/templates/:id/use
// Creates a new assignment from an existing assignment template
// ============================================================

import { jsonResponse, errorResponse } from "../../../../lib/json";
import { getAuthenticatedUser } from "../../../../lib/auth";

export async function onRequestPost(context: {
  env: { DB?: D1Database; ASSESSMENT_DB?: D1Database; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const templateId = params.id;
  const db = env.ASSESSMENT_DB || env.DB;

  if (!db) {
    return errorResponse("Database binding not found", 500);
  }

  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user || !user.uid) {
      return errorResponse("Unauthorized - Teacher authentication required", 401);
    }

    const body = (await request.json().catch(() => ({}))) as {
      class_id?: string;
      classId?: string;
      due_date?: string;
      dueDate?: string;
      customizations?: any;
    };

    const classId = body.class_id || body.classId;
    if (!classId) {
      return errorResponse("class_id is required", 400);
    }

    const dueDate = body.due_date || body.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch template
    const template = await db
      .prepare(`SELECT * FROM assignment_templates WHERE id = ?`)
      .bind(templateId)
      .first<any>();

    const title = template?.title || "Assignment from Template";
    const description = template?.description || "";
    const instructions = template?.instructions || "";
    const totalMarks = template?.total_marks || 100;
    const rubric = template?.rubric || null;

    const assignmentId = `asgn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    await db
      .prepare(
        `INSERT INTO assignments 
         (id, class_id, title, description, instructions, status, total_marks, due_date, rubric, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'PUBLISHED', ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        assignmentId,
        classId,
        title,
        description,
        instructions,
        totalMarks,
        dueDate,
        typeof rubric === "object" ? JSON.stringify(rubric) : rubric,
        user.uid,
        nowIso,
        nowIso
      )
      .run()
      .catch(async () => {
        // Fallback for simple schema
        await db
          .prepare(
            `INSERT INTO assignments (id, class_id, teacher_id, title, description, due_date, max_points)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(assignmentId, classId, user.uid, title, description, dueDate, totalMarks)
          .run();
      });

    return jsonResponse({
      success: true,
      message: "Assignment created from template successfully",
      assignment: {
        id: assignmentId,
        class_id: classId,
        title,
        total_marks: totalMarks,
        due_date: dueDate,
        status: "PUBLISHED",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to use template";
    console.error("POST /api/teacher/templates/:id/use error:", message);
    return errorResponse(message, 500);
  }
}
