import { jsonResponse, errorResponse } from "../../../lib/json";

export async function onRequestPost(context: {
  params: { id?: string };
  env: { DB: D1Database };
}) {
  const { params, env } = context;
  const id = params.id;

  if (!id) {
    return errorResponse("Missing document ID", 400);
  }

  try {
    await env.DB.prepare(
      `UPDATE documents
       SET likes = likes + 1, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
      .bind(id)
      .run();

    const stats = await env.DB.prepare(
      "SELECT views, likes, downloads FROM documents WHERE id = ?"
    )
      .bind(id)
      .first();

    return jsonResponse(stats || { views: 0, likes: 0, downloads: 0 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}
