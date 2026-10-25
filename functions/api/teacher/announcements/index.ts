// ============================================================
// TEACHER API: GET / POST /api/teacher/announcements
// Real class announcements for authenticated teacher from D1
// ============================================================

import { jsonResponse, errorResponse } from "../../../lib/json";
import { getAuthenticatedUser } from "../../../lib/auth";

export async function onRequestGet(context: {
  request: Request;
  env: { DB?: any; ASSESSMENT_DB?: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
}) {
  const { request, env } = context;
  const db = env.ASSESSMENT_DB || env.DB;
  const user = await getAuthenticatedUser(request, env);

  if (!user || !user.uid) {
    return errorResponse("Unauthorized - Teacher authentication required", 401);
  }

  if (!db) {
    return errorResponse("Database binding not found", 500);
  }

  try {
    const { results } = await db.prepare(
      `SELECT id, teacher_id, subject_id, title, content, created_at
       FROM teacher_announcements
       WHERE teacher_id = ?
       ORDER BY created_at DESC`
    )
      .bind(user.uid)
      .all();

    return jsonResponse({
      success: true,
      count: results?.length || 0,
      announcements: results || [],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch announcements";
    return errorResponse(message, 500);
  }
}

export async function onRequestPost(context: {
  request: Request;
  env: { DB?: any; ASSESSMENT_DB?: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
}) {
  const { request, env } = context;
  const db = env.ASSESSMENT_DB || env.DB;
  const user = await getAuthenticatedUser(request, env);

  if (!user || !user.uid) {
    return errorResponse("Unauthorized - Teacher authentication required", 401);
  }

  if (!db) {
    return errorResponse("Database binding not found", 500);
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      subjectId?: string;
      subject_id?: string;
      title?: string;
      content?: string;
    };

    if (!body.title || !body.title.trim() || !body.content || !body.content.trim()) {
      return errorResponse("Title and content are required for an announcement", 400);
    }

    const annId = `ann_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const subjectId = body.subjectId || body.subject_id || "general";
    const title = body.title.trim();
    const content = body.content.trim();
    const nowIso = new Date().toISOString();

    await db.prepare(
      `INSERT INTO teacher_announcements (id, teacher_id, subject_id, title, content, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(annId, user.uid, subjectId, title, content, nowIso)
      .run()
      .catch(async () => {
        await db.prepare(
          `INSERT INTO teacher_announcements (id, teacher_id, subject_id, title, content)
           VALUES (?, ?, ?, ?, ?)`
        )
          .bind(annId, user.uid, subjectId, title, content)
          .run();
      });

    return jsonResponse({
      success: true,
      message: "Announcement posted successfully",
      announcement: {
        id: annId,
        teacherId: user.uid,
        subjectId,
        title,
        content,
        createdAt: nowIso,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to post announcement";
    return errorResponse(message, 500);
  }
}