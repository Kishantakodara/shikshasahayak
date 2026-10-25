import { jsonResponse, errorResponse } from "../../lib/json";
import { getAuthenticatedUser, isAdmin } from "../../lib/auth";

export async function onRequestGet(context: { request: Request, env: any }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const isAdminParam = url.searchParams.get("admin") === "true";
  const db = env.PADHAKU_CORE_DB || env.DB;

  if (!db) {
    return errorResponse("Database binding not found", 500);
  }

  try {
    let query = `
      SELECT
        blog.*,
        d.title AS related_document_title,
        d.document_type AS related_document_type
      FROM blogs blog
      LEFT JOIN documents d ON d.id = blog.related_document_id
    `;
    if (!isAdminParam) {
      query += " WHERE blog.status = 'published'";
    }
    query += " ORDER BY blog.created_at DESC";

    const { results } = await db.prepare(query).all();
    if (!isAdminParam) {
      return jsonResponse(results, {
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=1800"
        }
      });
    }
    return jsonResponse(results);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")          // Replace spaces with -
    .replace(/[^\w\-]+/g, "")       // Remove all non-word chars
    .replace(/\-\-+/g, "-")         // Replace multiple - with single -
    .replace(/^-+/, "")             // Trim - from start of text
    .replace(/-+$/, "");            // Trim - from end of text
}

export async function onRequestPost(context: { request: Request, env: any }) {
  const { request, env } = context;
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

    if (!title || !content) {
      return errorResponse("Title and content are required", 400);
    }

    const slug = slugify(title);
    const uniqueSuffix = crypto.randomUUID().split("-")[0];
    const id = slug ? `${slug}-${uniqueSuffix}` : `blog-${uniqueSuffix}`;
    const blogAuthor = author || "Admin";
    const blogCategory = category || "Study Guides";
    const blogStatus = status || "draft";
    const blogViews = 0;

    await db.prepare(
      `INSERT INTO blogs
         (id, related_document_id, title, content, author, category, tags, thumbnail, status, views)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        related_document_id || null,
        title,
        content,
        blogAuthor,
        blogCategory,
        tags || null,
        thumbnail || null,
        blogStatus,
        blogViews
      )
      .run();

    if (related_document_id) {
      await db.prepare("UPDATE documents SET blog_id = ? WHERE id = ?")
        .bind(id, related_document_id)
        .run();
    }

    const newBlog = {
      id,
      related_document_id: related_document_id || null,
      title,
      content,
      author: blogAuthor,
      category: blogCategory,
      tags: tags || null,
      thumbnail: thumbnail || null,
      status: blogStatus,
      views: blogViews,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return jsonResponse(newBlog, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}
