// ============================================================
// ADMIN API: GET /api/admin/academic/subjects/history
// Returns history log of past CSV imports from Cloudflare D1
// ============================================================

import { jsonResponse, errorResponse } from "../../../../lib/json";
import { requireAdmin } from "../../../../lib/auth";

export async function onRequestGet(context: {
  request: Request;
  env: { DB: D1Database };
}) {
  const { request, env } = context;

  const { errorResponse: authError } = await requireAdmin(request, env);
  if (authError) {
    return authError;
  }

  try {
    const { results } = await env.DB.prepare(
      `SELECT
         id,
         filename,
         uploaded_by,
         uploaded_at,
         total_rows,
         imported_rows,
         updated_rows,
         unchanged_rows,
         skipped_rows,
         error_count,
         archived_count,
         error_log_json
       FROM subject_csv_imports
       ORDER BY uploaded_at DESC
       LIMIT 50`
    ).all();

    return jsonResponse({
      success: true,
      history: results || []
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}
