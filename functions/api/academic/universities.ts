// ============================================================
// SHIKSHA SAHAYAK OS API: /api/academic/universities
// Multi-University catalog, programs, and equivalence endpoints
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { fetchUniversities, fetchAcademicPrograms, createSubjectEquivalence } from "../../lib/multiUniversityService";
import { getAuthenticatedUser } from "../../lib/auth";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  const universityId = url.searchParams.get("universityId") || "gtu";

  if (action === "programs") {
    const programs = await fetchAcademicPrograms(env, universityId);
    return jsonResponse({ success: true, programs });
  }

  const universities = await fetchUniversities(env);
  return jsonResponse({ success: true, universities });
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const user = await getAuthenticatedUser(request, env);
  if (!user) return errorResponse("Unauthorized", 401);

  try {
    const body = (await request.json()) as {
      sourceSubjectId: string;
      targetSubjectId: string;
      notes?: string;
    };

    if (!body || !body.sourceSubjectId || !body.targetSubjectId) {
      return errorResponse("Missing required subject mapping IDs", 400);
    }

    const success = await createSubjectEquivalence(env, body.sourceSubjectId, body.targetSubjectId, body.notes, user.uid);
    return jsonResponse({ success });
  } catch (error) {
    return errorResponse("Internal Server Error", 500);
  }
}
