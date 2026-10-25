import { jsonResponse, errorResponse } from "../../../../lib/json";
import { requireAdmin } from "../../../../lib/auth";

export async function onRequestGet(context: { request: Request; env: { DB: D1Database } }) {
  const { request, env } = context;

  const { errorResponse: authError } = await requireAdmin(request, env);
  if (authError) {
    return authError;
  }

  try {

    // Fetch Curriculum Versions
    const { results: versions } = await env.DB.prepare(
      `SELECT v.*, u.name as university_name, u.short_name as university_code
       FROM curriculum_versions v
       LEFT JOIN universities u ON u.id = v.university_id
       ORDER BY v.created_at DESC`
    ).all();

    // Fetch Recent Upload Logs
    const { results: logs } = await env.DB.prepare(
      `SELECT * FROM import_logs ORDER BY created_at DESC LIMIT 50`
    ).all();

    // Fetch Structure Overview Stats
    const totalUniversities = await env.DB.prepare(`SELECT COUNT(*) as cnt FROM universities`).first<{ cnt: number }>();
    const totalBranches = await env.DB.prepare(`SELECT COUNT(*) as cnt FROM branches`).first<{ cnt: number }>();
    const totalSubjects = await env.DB.prepare(`SELECT COUNT(*) as cnt FROM subjects`).first<{ cnt: number }>();
    const totalSyllabi = await env.DB.prepare(`SELECT COUNT(*) as cnt FROM syllabus_links WHERE is_active = 1`).first<{ cnt: number }>();

    return jsonResponse({
      success: true,
      versions: versions || [],
      logs: logs || [],
      stats: {
        totalUniversities: totalUniversities?.cnt || 0,
        totalBranches: totalBranches?.cnt || 0,
        totalSubjects: totalSubjects?.cnt || 0,
        totalSyllabi: totalSyllabi?.cnt || 0
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching curriculum history";
    return errorResponse(message, 500);
  }
}
