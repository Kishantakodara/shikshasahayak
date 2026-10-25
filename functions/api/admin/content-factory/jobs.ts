import { jsonResponse, errorResponse } from "../../../lib/json";
import { getAuthenticatedUser, isAdmin } from "../../../lib/auth";

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function onRequestGet(context: {
  request: Request;
  env: {
    DB: any;
    FIREBASE_PROJECT_ID?: string;
    VITE_FIREBASE_PROJECT_ID?: string;
  };
}) {
  const { request, env } = context;
  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(user.email, user.role)) {
    return errorResponse("Unauthorized. Admin privileges required.", 403);
  }

    const { results } = await env.DB.prepare(`
      SELECT 
        j.*,
        s.name AS subject_name,
        b.name AS branch_name
      FROM content_factory_jobs j
      LEFT JOIN subjects s ON s.id = j.subject_id
      LEFT JOIN branches b ON b.id = j.branch_id
      ORDER BY j.created_at DESC
      LIMIT 50
    `).all();

    const jobs = results || [];
    return jsonResponse({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error: any) {
    return errorResponse(error.message || 'Error fetching generation jobs', 500);
  }
}

export async function onRequestPost(context: {
  request: Request;
  env: {
    DB: any;
    FIREBASE_PROJECT_ID?: string;
    VITE_FIREBASE_PROJECT_ID?: string;
  };
}) {
  const { request, env } = context;
  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(user.email, user.role)) {
    return errorResponse("Unauthorized. Admin privileges required.", 403);
  }

    const body = await request.json() as any;
    const universityId = (body.university_id || body.university || 'gtu').toLowerCase();
    const branchId = body.branch_id || body.branch || 'branch_computer';
    const semester = Number(body.semester || 5);
    const subjectId = body.subject_id || (body.subject_name || body.subject || 'computer_networks').toLowerCase().replace(/\s+/g, '_');
    const unitNo = Number(body.unit_no || body.unit || 1);
    const topics = Array.isArray(body.topics) ? body.topics : [body.topic || 'Core Curriculum Module'];
    const contentTypes = Array.isArray(body.content_types || body.contentTypes) ? (body.content_types || body.contentTypes) : ['Detailed Notes', 'MCQs & Solutions'];

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    await env.DB.prepare(`
      INSERT INTO content_factory_jobs (
        id, university_id, branch_id, semester, subject_id, unit_no, topics, content_types,
        status, total_topics, completed_topics, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, 0, ?, datetime('now'), datetime('now'))
    `).bind(
      jobId,
      universityId,
      branchId,
      semester,
      subjectId,
      unitNo,
      JSON.stringify(topics),
      JSON.stringify(contentTypes),
      topics.length,
      user.email || user.uid
    ).run();

    return jsonResponse({
      success: true,
      job_id: jobId,
      message: "Job queued successfully in Content Factory."
    });
  } catch (error: any) {
    return errorResponse(error.message || 'Error creating generation job', 500);
  }
}
