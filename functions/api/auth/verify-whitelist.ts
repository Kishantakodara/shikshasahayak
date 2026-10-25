import { jsonResponse, errorResponse } from "../../lib/json";
import { isAdmin } from "../../lib/auth";

/**
 * GET /api/auth/verify-whitelist?email=user@gmail.com
 * Verifies if an email address exists in Cloudflare D1 `teacher_whitelist` table or is an Admin.
 */
export async function onRequestGet(context: { 
  env: { ASSESSMENT_DB: D1Database }; 
  request: Request; 
}) {
  const { env, request } = context;
  const url = new URL(request.url);
  const email = url.searchParams.get("email")?.toLowerCase().trim();

  if (!email) {
    return errorResponse("Email parameter is required", 400);
  }

  try {
    if (isAdmin(email)) {
      return jsonResponse({
        email,
        isWhitelisted: true,
      });
    }

    const whitelisted = await env.ASSESSMENT_DB.prepare(
      `SELECT email FROM teacher_whitelist WHERE LOWER(email) = ? LIMIT 1`
    )
      .bind(email)
      .first();

    return jsonResponse({
      email,
      isWhitelisted: !!whitelisted,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Database error";
    return errorResponse(message, 500);
  }
}
