import { jsonResponse, errorResponse } from "../lib/json";
import { getAuthenticatedUser, isAdmin } from "../lib/auth";

export async function onRequestGet(context: { env: { ASSESSMENT_DB: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string }; request: Request }) {
  const { env, request } = context;
  const url = new URL(request.url);
  const isAdminFlag = url.searchParams.get("admin") === "true";

  try {
    let query = `SELECT * FROM student_projects`;
    if (!isAdminFlag) {
      query += ` WHERE status = 'Approved by Faculty'`;
    } else {
      const user = await getAuthenticatedUser(request, env);
      if (!user || !isAdmin(user.email, user.role)) {
        return errorResponse("Unauthorized: Admin privilege required", 403);
      }
    }
    query += ` ORDER BY created_at DESC`;

    const db = (env as any).DB || env.ASSESSMENT_DB;
    const { results } = await db.prepare(query).all();

    // Parse comma-separated tech stack back into array for frontend compliance
    const mappedProjects = results.map((p: any) => ({
      ...p,
      tech: p.tech ? p.tech.split(",").map((s: string) => s.trim()) : []
    }));

    return jsonResponse(mappedProjects);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}

export async function onRequestPost(context: { env: { ASSESSMENT_DB: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string }; request: Request }) {
  const { env, request } = context;

  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const body: any = await request.json();
    const { title, author, dept, github, desc, tech } = body;

    if (!title || !author || !dept || !github) {
      return errorResponse("Missing required project fields", 400);
    }

    const projectId = `p-${Date.now()}`;
    const techString = Array.isArray(tech) ? tech.join(", ") : (tech || "");

    const db = (env as any).DB || env.ASSESSMENT_DB;
    await db.prepare(
      `INSERT INTO student_projects (id, title, author, dept, github, desc, status, upvotes, tech)
       VALUES (?, ?, ?, ?, ?, ?, 'Under Faculty Review', 1, ?)`
    ).bind(projectId, title, author, dept, github, desc || "", techString).run();

    return jsonResponse({
      id: projectId,
      title,
      author,
      dept,
      github,
      desc,
      status: "Under Faculty Review",
      upvotes: 1,
      tech: Array.isArray(tech) ? tech : (tech ? tech.split(",").map((s: string) => s.trim()) : [])
    }, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}

export async function onRequestPatch(context: { env: { ASSESSMENT_DB: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string }; request: Request }) {
  const { env, request } = context;

  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const body: any = await request.json();
    const { projectId, action } = body;

    if (!projectId || !action) {
      return errorResponse("Missing projectId or action", 400);
    }

    if (action === "approve" || action === "reject") {
      if (!isAdmin(user.email, user.role)) {
        return errorResponse("Unauthorized: Admin privilege required", 403);
      }
    }

    const db = (env as any).DB || env.ASSESSMENT_DB;

    // Verify project exists
    const project: any = await db.prepare(
      `SELECT * FROM student_projects WHERE id = ? LIMIT 1`
    ).bind(projectId).first();

    if (!project) {
      return errorResponse("Project not found", 404);
    }

    if (action === "upvote") {
      const newUpvotes = project.upvotes + 1;
      await db.prepare(
        `UPDATE student_projects SET upvotes = ? WHERE id = ?`
      ).bind(newUpvotes, projectId).run();
      return jsonResponse({ success: true, upvotes: newUpvotes });
    }

    if (action === "approve") {
      await db.prepare(
        `UPDATE student_projects SET status = 'Approved by Faculty' WHERE id = ?`
      ).bind(projectId).run();
      return jsonResponse({ success: true, status: "Approved by Faculty" });
    }

    if (action === "reject") {
      await db.prepare(
        `UPDATE student_projects SET status = 'Changes Requested' WHERE id = ?`
      ).bind(projectId).run();
      return jsonResponse({ success: true, status: "Changes Requested" });
    }

    return errorResponse("Invalid action", 400);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}
