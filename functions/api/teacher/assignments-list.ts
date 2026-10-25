import { jsonResponse, errorResponse } from "../../lib/json";
import { getTeacherAssignments } from "../../lib/teacherPortalService";
import { getAuthenticatedUser } from "../../lib/auth";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;

  const user = await getAuthenticatedUser(request, env as any);
  if (!user || !user.uid) {
    return errorResponse("Unauthorized - Teacher authentication required", 401);
  }

  const teacherId = user.uid;

  try {
    const assignments = await getTeacherAssignments(env, teacherId);
    return jsonResponse(assignments, {
      headers: { "Cache-Control": "private, no-cache" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
