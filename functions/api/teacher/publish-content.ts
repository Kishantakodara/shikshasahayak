import { jsonResponse, errorResponse } from "../../lib/json";
import { publishTeacherMaterial } from "../../lib/teacherPortalService";
import { getAuthenticatedUser } from "../../lib/auth";
import { Env } from "../../lib/contentEngine";

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  const user = await getAuthenticatedUser(request, env as any);
  if (!user || !user.uid) {
    return errorResponse("Unauthorized - Teacher authentication required", 401);
  }

  try {
    const body = (await request.json()) as {
      subjectId: string;
      branchId: string;
      semester: number;
      unitId?: string;
      title: string;
      description?: string;
      resourceType: string;
      fileUrl: string;
      fileSizeBytes?: number;
    };

    if (!body || !body.subjectId || !body.title || !body.fileUrl) {
      return errorResponse("Missing required publishing payload fields", 400);
    }

    const success = await publishTeacherMaterial(env, {
      ...body,
      teacherId: user.uid,
      fileSizeBytes: body.fileSizeBytes || 1024,
    });

    return jsonResponse({ success, title: body.title });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
