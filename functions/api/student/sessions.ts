import { jsonResponse, errorResponse } from "../../lib/json";
import { getStudentDeviceSessions } from "../../lib/studentIdentityService";
import { getAuthenticatedUser } from "../../lib/auth";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;

  const authUser = await getAuthenticatedUser(request, env as any);
  if (!authUser || !authUser.uid) {
    return errorResponse("Unauthorized", 401);
  }

  const userId = authUser.uid;

  try {
    const sessions = await getStudentDeviceSessions(env, userId);
    return jsonResponse(sessions, {
      headers: {
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
