// ============================================================
// SHIKSHA SAHAYAK OS API: /api/student/career
// Student career profile, skills, projects & certifications
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { fetchStudentCareerProfile, addStudentProject } from "../../lib/studentCareerService";
import { getAuthenticatedUser } from "../../lib/auth";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const user = await getAuthenticatedUser(request, env);
  const userId = user ? user.uid : "guest_student";

  const profile = await fetchStudentCareerProfile(env, userId);
  return jsonResponse({ success: true, profile });
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const user = await getAuthenticatedUser(request, env);
  if (!user) return errorResponse("Unauthorized", 401);

  try {
    const body = (await request.json()) as {
      type: "project" | "skill";
      title?: string;
      description?: string;
      technologies?: string[];
      projectUrl?: string;
      githubUrl?: string;
      isPublic?: boolean;
    };

    if (body.type === "project" && body.title && body.description) {
      const ok = await addStudentProject(env, user.uid, {
        title: body.title,
        description: body.description,
        technologies: body.technologies || [],
        projectUrl: body.projectUrl,
        githubUrl: body.githubUrl,
        isPublic: body.isPublic !== false,
      });
      return jsonResponse({ success: ok });
    }

    return errorResponse("Invalid payload", 400);
  } catch {
    return errorResponse("Internal Server Error", 500);
  }
}
