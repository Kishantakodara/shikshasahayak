// ============================================================
// SHIKSHA SAHAYAK OS API: /api/taxonomy/tags
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const search = url.searchParams.get("q") || "";
  const limit = url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : 50;

  try {
    const qCond = search ? "WHERE name LIKE ? OR slug LIKE ?" : "";
    const qBind = search ? [`%${search}%`, `%${search}%`, limit] : [limit];

    const { results } = await env.DB.prepare(
      `SELECT id, name, slug, category, usage_count, created_at
       FROM content_tags
       ${qCond}
       ORDER BY usage_count DESC, name ASC
       LIMIT ?`
    )
      .bind(...qBind)
      .all<Record<string, unknown>>();

    return jsonResponse(results || [], {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=3600",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
