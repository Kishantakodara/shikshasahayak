import { jsonResponse, errorResponse } from "../../../lib/json";
import { requireAdmin } from "../../../lib/auth";

export async function onRequestGet(context: any) {
  const { request, env } = context;

  const { errorResponse: authError } = await requireAdmin(request, env);
  if (authError) {
    return authError;
  }
  try {
    // Fetch all groups with their member subjects
    const { results: groups } = await env.DB.prepare(`
      SELECT id, name, created_at, updated_at
      FROM subject_groups
      ORDER BY name
    `).all();

    // For each group, fetch its member subjects
    const { results: members } = await env.DB.prepare(`
      SELECT
        s.id            AS subject_id,
        s.name          AS subject_name,
        s.code          AS subject_code,
        s.semester,
        s.wef_year,
        s.subject_group_id,
        b.name          AS branch_name,
        b.slug          AS branch_slug,
        b.id            AS branch_id
      FROM subjects s
      JOIN branches b ON b.id = s.branch_id
      WHERE s.subject_group_id IS NOT NULL
      ORDER BY s.subject_group_id, s.wef_year DESC, s.name
    `).all();

    // Group members under their group
    const membersByGroup: Record<string, any[]> = {};
    for (const m of members as any[]) {
      if (!membersByGroup[m.subject_group_id]) membersByGroup[m.subject_group_id] = [];
      membersByGroup[m.subject_group_id].push(m);
    }

    const result = (groups as any[]).map(g => ({
      ...g,
      members: membersByGroup[g.id] || [],
    }));

    return jsonResponse(result);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function onRequestPost(context: any) {
  const { request, env } = context;

  const { errorResponse: authError } = await requireAdmin(request, env);
  if (authError) {
    return authError;
  }

  try {
    const { name } = await request.json();
    if (!name || typeof name !== "string" || !name.trim()) {
      return errorResponse("Missing required field: name", 400);
    }

    const id = `sg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    await env.DB.prepare(
      `INSERT INTO subject_groups (id, name) VALUES (?, ?)`
    ).bind(id, name.trim()).run();

    return jsonResponse({ id, name: name.trim() }, 201);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
