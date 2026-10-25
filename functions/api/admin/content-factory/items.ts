import { jsonResponse, errorResponse } from "../../../lib/json";
import { getAuthenticatedUser, isAdmin } from "../../../lib/auth";
import { recordAdminAuditLog } from "../../../lib/adminPlatformService";

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, PATCH, DELETE, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

// GET: Filter and retrieve content factory items
export async function onRequestGet(context: {
  request: Request;
  env: {
    DB: D1Database;
    FIREBASE_PROJECT_ID?: string;
    VITE_FIREBASE_PROJECT_ID?: string;
  };
}) {
  const { request, env } = context;
  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(user.email, user.role)) {
    return errorResponse("Unauthorized. Admin privileges required.", 403);
  }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const subject_id = url.searchParams.get('subject_id');
    const branch_id = url.searchParams.get('branch_id');
    const semester = url.searchParams.get('semester');

    let query = `
      SELECT 
        cf.*,
        s.name AS subject_name,
        b.name AS branch_name
      FROM content_factory_items cf
      LEFT JOIN subjects s ON s.id = cf.subject_id
      LEFT JOIN branches b ON b.id = cf.branch_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && status !== 'all') {
      query += ` AND cf.status = ?`;
      params.push(status.toUpperCase());
    }
    if (subject_id && subject_id !== 'all') {
      query += ` AND cf.subject_id = ?`;
      params.push(subject_id);
    }
    if (branch_id && branch_id !== 'all') {
      query += ` AND cf.branch_id = ?`;
      params.push(branch_id);
    }
    if (semester && semester !== 'all') {
      query += ` AND cf.semester = ?`;
      params.push(Number(semester));
    }

    query += ` ORDER BY cf.created_at DESC LIMIT 100`;

    const stmt = env.DB.prepare(query);
    const { results } = await (params.length > 0 ? stmt.bind(...params) : stmt).all();

    return jsonResponse(results || []);
  } catch (error: any) {
    return errorResponse(error.message || 'Error fetching content items', 500);
  }
}

// PATCH: Update item status (DRAFT, REVIEW, APPROVED, PUBLISHED) or edit markdown
export async function onRequestPatch(context: {
  request: Request;
  env: {
    DB: D1Database;
    FIREBASE_PROJECT_ID?: string;
    VITE_FIREBASE_PROJECT_ID?: string;
  };
}) {
  const { request, env } = context;
  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(user.email, user.role)) {
    return errorResponse("Unauthorized. Admin privileges required.", 403);
  }

    const body = await request.json() as {
      id: string;
      status?: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PUBLISHED';
      raw_markdown?: string;
      difficulty?: 'easy' | 'medium' | 'hard';
    };

    if (!body.id) {
      return errorResponse("Missing item ID", 400);
    }

    // Fetch existing item
    const existing = await env.DB.prepare(`
      SELECT * FROM content_factory_items WHERE id = ?
    `).bind(body.id).first<any>();

    if (!existing) {
      return errorResponse("Content item not found", 404);
    }

    const newStatus = body.status || existing.status;
    const newMarkdown = body.raw_markdown !== undefined ? body.raw_markdown : existing.raw_markdown;
    const newDifficulty = body.difficulty || existing.difficulty;
    let publishedDocId = existing.published_document_id;

    // If publishing, sync into live `documents` table for immediate student access!
    if (newStatus === 'PUBLISHED') {
      const docTitle = `${existing.topic} — Complete Revision Notes & Question Bank`;
      const docDescription = newMarkdown || existing.raw_markdown || `Authoritative study material for ${existing.topic}`;

      if (!publishedDocId) {
        publishedDocId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        
        await env.DB.prepare(`
          INSERT INTO documents (
            id, document_type, university_id, branch_id, semester, subject_id,
            title, description, status, approval_status, material_kind, unit_no, topic,
            author, uploaded_by, approved_by, approved_at, created_at, updated_at
          ) VALUES (
            ?, 'study-material', ?, ?, ?, ?,
            ?, ?, 'published', 'approved', 'notes', ?, ?,
            'ShikshaSahayak Editorial', ?, ?, datetime('now'), datetime('now'), datetime('now')
          )
        `).bind(
          publishedDocId,
          existing.university_id,
          existing.branch_id,
          existing.semester,
          existing.subject_id,
          docTitle,
          docDescription,
          Number(existing.unit_no || 1),
          existing.topic,
          user.email || user.uid,
          user.email || user.uid
        ).run();

        // Write into material_metadata and document_stats
        await env.DB.prepare(`
          INSERT INTO material_metadata (document_id, material_kind, author)
          VALUES (?, 'notes', 'ShikshaSahayak Editorial')
          ON CONFLICT(document_id) DO NOTHING
        `).bind(publishedDocId).run();

        await env.DB.prepare(`
          INSERT INTO document_stats (document_id, views, likes, downloads)
          VALUES (?, 0, 0, 0)
          ON CONFLICT(document_id) DO NOTHING
        `).bind(publishedDocId).run();
      } else {
        // Idempotently update existing live document
        await env.DB.prepare(`
          UPDATE documents
          SET title = ?, description = ?, status = 'published', approval_status = 'approved', updated_at = datetime('now')
          WHERE id = ?
        `).bind(docTitle, docDescription, publishedDocId).run();
      }

      await recordAdminAuditLog(
        env as any,
        user.email || user.uid,
        'CONTENT_PUBLISH',
        'content_factory_item',
        body.id,
        { topic: existing.topic, publishedDocId }
      );
    } else if (existing.status === 'PUBLISHED' && newStatus !== 'PUBLISHED' && publishedDocId) {
      // Unpublish: revert document approval status
      await env.DB.prepare(`
        UPDATE documents
        SET approval_status = 'pending', updated_at = datetime('now')
        WHERE id = ?
      `).bind(publishedDocId).run();

      await recordAdminAuditLog(
        env as any,
        user.email || user.uid,
        'CONTENT_UNPUBLISH',
        'content_factory_item',
        body.id,
        { topic: existing.topic, newStatus }
      );
    } else {
      // Other status transitions
      await recordAdminAuditLog(
        env as any,
        user.email || user.uid,
        `CONTENT_TRANSITION_${newStatus}`,
        'content_factory_item',
        body.id,
        { topic: existing.topic, previousStatus: existing.status, newStatus }
      );
    }

    await env.DB.prepare(`
      UPDATE content_factory_items
      SET status = ?, raw_markdown = ?, difficulty = ?, published_document_id = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(newStatus, newMarkdown, newDifficulty, publishedDocId, body.id).run();

    return jsonResponse({
      success: true,
      id: body.id,
      status: newStatus,
      published_document_id: publishedDocId,
      item: {
        id: body.id,
        status: newStatus,
        raw_markdown: newMarkdown,
        difficulty: newDifficulty,
        published_document_id: publishedDocId
      }
    });

  } catch (error: any) {
    return errorResponse(error.message || 'Error updating content item', 500);
  }
}

// DELETE: Remove item
export async function onRequestDelete(context: {
  request: Request;
  env: {
    DB: D1Database;
    FIREBASE_PROJECT_ID?: string;
    VITE_FIREBASE_PROJECT_ID?: string;
  };
}) {
  const { request, env } = context;
  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(user.email, user.role)) {
    return errorResponse("Unauthorized. Admin privileges required.", 403);
  }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return errorResponse("Missing item ID", 400);
    }

    const existing = await env.DB.prepare(`SELECT topic, published_document_id FROM content_factory_items WHERE id = ?`).bind(id).first<any>();

    if (existing?.published_document_id) {
      await env.DB.prepare(`DELETE FROM documents WHERE id = ?`).bind(existing.published_document_id).run();
    }

    await env.DB.prepare(`DELETE FROM content_factory_items WHERE id = ?`).bind(id).run();

    await recordAdminAuditLog(
      env as any,
      user.email || user.uid,
      'CONTENT_DELETE',
      'content_factory_item',
      id,
      { topic: existing?.topic || 'Unknown' }
    );

    return jsonResponse({ success: true, id });
  } catch (error: any) {
    return errorResponse(error.message || 'Error deleting content item', 500);
  }
}
