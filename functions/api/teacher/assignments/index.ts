// ============================================================
// TEACHER API: GET / POST /api/teacher/assignments
// Real assignment management for authenticated teacher from D1
// ============================================================

import { jsonResponse, errorResponse } from "../../../lib/json";
import { getAuthenticatedUser } from "../../../lib/auth";

export async function onRequestGet(context: {
  request: Request;
  env: { PADHAKU_CORE_DB?: D1Database; DB: D1Database; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
}) {
  const { request, env } = context;
  const user = await getAuthenticatedUser(request, env);

  if (!user || !user.uid) {
    return errorResponse("Unauthorized - Teacher authentication required", 401);
  }

  try {
    const url = new URL(request.url);
    const classId = url.searchParams.get("classId");

    let query = `
      SELECT
        a.id,
        a.class_id,
        a.teacher_id,
        a.title,
        a.description,
        a.due_date,
        a.max_points,
        a.created_at,
        c.name AS class_name,
        (SELECT COUNT(*) FROM assignment_submissions sub WHERE sub.assignment_id = a.id) AS submission_count
      FROM assignments a
      LEFT JOIN classes c ON c.id = a.class_id
      WHERE a.teacher_id = ?
    `;
    const bindings: any[] = [user.uid];

    if (classId) {
      query += ` AND a.class_id = ?`;
      bindings.push(classId);
    }

    query += ` ORDER BY a.created_at DESC`;

    const { results } = await env.DB.prepare(query).bind(...bindings).all();

    return jsonResponse({
      success: true,
      count: results?.length || 0,
      assignments: results || [],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch assignments";
    return errorResponse(message, 500);
  }
}

export async function onRequestPost(context: {
  request: Request;
  env: { PADHAKU_CORE_DB?: D1Database; DB: D1Database; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
}) {
  const { request, env } = context;
  const user = await getAuthenticatedUser(request, env);

  if (!user || !user.uid) {
    return errorResponse("Unauthorized - Teacher authentication required", 401);
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      classId?: string;
      title?: string;
      description?: string;
      dueDate?: string;
      maxPoints?: number;
    };

    if (!body.title || !body.title.trim()) {
      return errorResponse("Assignment title is required", 400);
    }

    const classId = body.classId || "general";

    if (classId !== "general") {
      const cls = await env.DB.prepare(
        `SELECT id, teacher_id, is_active FROM classes WHERE id = ? LIMIT 1`
      )
        .bind(classId)
        .first<{ id: string; teacher_id: string; is_active: number }>();

      if (!cls) {
        return errorResponse("Class not found", 404);
      }

      if (cls.teacher_id !== user.uid && user.role !== 'admin') {
        return errorResponse("Forbidden - You can only create assignments for your own classes", 403);
      }

      if (cls.is_active === 0) {
        return errorResponse("Cannot create assignment for an inactive or archived class", 400);
      }
    }

    const assignmentId = `asgn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const title = body.title.trim();
    const description = body.description || "";
    const dueDate = body.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const maxPoints = Number(body.maxPoints) || 100;

    await env.DB.prepare(
      `INSERT INTO assignments (id, class_id, teacher_id, title, description, due_date, max_points)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        assignmentId,
        classId,
        user.uid,
        title,
        description,
        dueDate,
        maxPoints
      )
      .run();

    return jsonResponse({
      success: true,
      message: "Assignment created successfully",
      assignment: {
        id: assignmentId,
        classId,
        teacherId: user.uid,
        title,
        description,
        dueDate,
        maxPoints,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create assignment";
    return errorResponse(message, 500);
  }
}
