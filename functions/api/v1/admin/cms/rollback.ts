import { jsonResponse, errorResponse } from "../../../../lib/json";
import { requireAdmin } from "../../../../lib/auth";

export async function onRequestPost(context: { request: Request; env: { DB: D1Database } }) {
  const { request, env } = context;

  const { errorResponse: authError } = await requireAdmin(request, env);
  if (authError) {
    return authError;
  }

  try {
    const body = await request.json() as { versionId: string; action: 'activate' | 'archive' | 'rollback' };

    if (!body.versionId) {
      return errorResponse("Version ID is required", 400);
    }

    const version = await env.DB.prepare(
      `SELECT * FROM curriculum_versions WHERE id = ?`
    ).bind(body.versionId).first<{ id: string; university_id: string; version_number: number }>();

    if (!version) {
      return errorResponse("Curriculum version not found", 404);
    }

    if (body.action === 'activate' || body.action === 'rollback') {
      // Archive all other versions for this university
      await env.DB.prepare(
        `UPDATE curriculum_versions SET status = 'archived' WHERE university_id = ?`
      ).bind(version.university_id).run();

      // Activate selected version
      await env.DB.prepare(
        `UPDATE curriculum_versions SET status = 'active' WHERE id = ?`
      ).bind(body.versionId).run();

      return jsonResponse({
        success: true,
        message: `Curriculum Version #${version.version_number} is now active.`
      });
    } else if (body.action === 'archive') {
      await env.DB.prepare(
        `UPDATE curriculum_versions SET status = 'archived' WHERE id = ?`
      ).bind(body.versionId).run();

      return jsonResponse({
        success: true,
        message: `Curriculum Version #${version.version_number} has been archived.`
      });
    }

    return errorResponse("Invalid rollback action", 400);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Rollback failed";
    return errorResponse(message, 500);
  }
}
