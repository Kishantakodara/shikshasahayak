import { jsonResponse, errorResponse } from "../../../lib/json";
import { resolveBranch, resolveSubject } from "../../../lib/materialUpload";
import { requireAdmin } from "../../../lib/auth";

export async function onRequestGet(context: any) {
  const { request, env } = context;

  const { errorResponse: authError } = await requireAdmin(request, env);
  if (authError) {
    return authError;
  }

  try {
    const { results } = await env.DB.prepare(`
      SELECT
        s.id,
        s.id AS offering_id,
        s.code,
        s.name,
        s.slug AS normalized_name,
        s.slug AS subject_slug,
        s.semester AS semester_no,
        b.id AS branch_id,
        b.name AS branch_name,
        b.short_name AS branches,
        u.name AS university
      FROM subjects s
      JOIN branches b ON b.id = s.branch_id
      JOIN universities u ON u.id = s.university_id
      ORDER BY b.name, s.semester, s.name
    `).all();
    return jsonResponse(results);
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
    const data = await request.json();
    const { name, code, branch_id, semester } = data;

    if (!name || !branch_id || !semester) {
      return errorResponse("Missing required fields: name, branch_id, semester", 400);
    }

    const branch = await resolveBranch(env, { branchId: branch_id });
    if (!branch) {
      return errorResponse("Branch not found", 404);
    }

    const subject = await resolveSubject(env, {
      branchId: branch.id,
      universityId: branch.university_id,
      semester: Number(semester),
      subjectName: name,
      subjectCode: code || "",
    });

    return jsonResponse({ success: true, id: subject.id, offeringId: subject.id });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
