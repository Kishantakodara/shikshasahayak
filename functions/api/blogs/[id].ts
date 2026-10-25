import { jsonResponse, errorResponse } from "../../lib/json";
import { getAuthenticatedUser, isAdmin } from "../../lib/auth";

export async function onRequestGet(context: { request: Request, params: { id: string }, env: any }) {
  const { request, params, env } = context;
  const id = params.id;
  const db = env.PADHAKU_CORE_DB || env.DB;

  if (!db) {
    return errorResponse("Database binding not found", 500);
  }

  try {
    const url = new URL(request.url);
    const skipIncrement = url.searchParams.get("skip_increment") === "true";

    // Fetch the blog
    const blog = await db.prepare(
      `SELECT
         blog.*,
         d.title AS related_document_title,
         d.document_type AS related_document_type
       FROM blogs blog
       LEFT JOIN documents d ON d.id = blog.related_document_id
       WHERE blog.id = ?`
    ).bind(id).first();

    if (!blog) {
      return errorResponse("Blog post not found", 404);
    }

    // Increment views if not skipped
    if (!skipIncrement) {
      await db.prepare("UPDATE blogs SET views = views + 1 WHERE id = ?").bind(id).run();
      // Update local object to reflect incremented view
      (blog as any).views = ((blog as any).views || 0) + 1;
    }

    return jsonResponse(blog);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}

export async function onRequestPut(context: { request: Request, params: { id: string }, env: any }) {
  const { request, params, env } = context;
  const id = params.id;
  const db = env.PADHAKU_CORE_DB || env.DB;

  if (!db) {
    return errorResponse("Database binding not found", 500);
  }

  // ── Auth Guard ──────────────────────────────────────────
  const user = await getAuthenticatedUser(request, env);
  if (!user) return errorResponse("Unauthorized", 401);
  if (!isAdmin(user.email, user.role)) return errorResponse("Forbidden: admin access required", 403);
  // ────────────────────────────────────────────────────────

  try {
    const data: any = await request.json();
    const { title, content, author, category, tags, thumbnail, status, related_document_id } = data;

    // Fetch existing first
    const existing: any = await db.prepare("SELECT * FROM blogs WHERE id = ?").bind(id).first();
    if (!existing) {
      return errorResponse("Blog post not found", 404);
    }

    const updatedTitle = title !== undefined ? title : existing.title;
    const updatedContent = content !== undefined ? content : existing.content;
    const updatedAuthor = author !== undefined ? author : existing.author;
    const updatedCategory = category !== undefined ? category : existing.category;
    const updatedTags = tags !== undefined ? tags : existing.tags;
    const updatedThumbnail = thumbnail !== undefined ? thumbnail : existing.thumbnail;
    const updatedStatus = status !== undefined ? status : existing.status;
    const updatedRelatedDocumentId = related_document_id !== undefined ? related_document_id : existing.related_document_id;

    await db.prepare(
      `UPDATE blogs 
       SET related_document_id = ?, title = ?, content = ?, author = ?, category = ?, tags = ?, thumbnail = ?, status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
      .bind(
        updatedRelatedDocumentId || null,
        updatedTitle,
        updatedContent,
        updatedAuthor,
        updatedCategory,
        updatedTags,
        updatedThumbnail,
        updatedStatus,
        id
      )
      .run();

    if (updatedRelatedDocumentId !== existing.related_document_id) {
      if (existing.related_document_id) {
        await db.prepare("UPDATE documents SET blog_id = NULL WHERE id = ?")
          .bind(existing.related_document_id)
          .run();
      }
      if (updatedRelatedDocumentId) {
        await db.prepare("UPDATE documents SET blog_id = ? WHERE id = ?")
          .bind(id, updatedRelatedDocumentId)
          .run();
      }
    }

    return jsonResponse({ message: "Blog updated successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}

export async function onRequestDelete(context: { request: Request, params: { id: string }, env: any }) {
  const { request, params, env } = context;
  const id = params.id;
  const db = env.PADHAKU_CORE_DB || env.DB;

  if (!db) {
    return errorResponse("Database binding not found", 500);
  }

  // ── Auth Guard ──────────────────────────────────────────
  const user = await getAuthenticatedUser(request, env);
  if (!user) return errorResponse("Unauthorized", 401);
  if (!isAdmin(user.email, user.role)) return errorResponse("Forbidden: admin access required", 403);
  // ────────────────────────────────────────────────────────

  try {
    const existing: any = await db.prepare("SELECT * FROM blogs WHERE id = ?").bind(id).first();
    if (!existing) {
      return errorResponse("Blog post not found", 404);
    }

    await db.prepare("DELETE FROM blogs WHERE id = ?").bind(id).run();

    if (existing.related_document_id) {
      await db.prepare("UPDATE documents SET blog_id = NULL WHERE id = ?")
        .bind(existing.related_document_id)
        .run();
    }

    return jsonResponse({ message: "Blog deleted successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}
