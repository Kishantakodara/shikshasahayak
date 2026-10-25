// ============================================================
// SHIKSHA SAHAYAK OS API: /api/student/profile
// SECURITY: User can only access/modify their own profile; admin can access any
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getStudentAcademicProfile, updateStudentAcademicProfile } from "../../lib/studentIdentityService";
import { getAuthenticatedUser, isAdmin } from "../../lib/auth";
import { Env } from "../../lib/contentEngine";
import { ProfileValidationError } from '../../lib/studentProfileStore';

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;

  // ── Auth Guard ──────────────────────────────────────────
  const user = await getAuthenticatedUser(request, env);
  if (!user) return errorResponse("Unauthorized", 401);
  // ────────────────────────────────────────────────────────

  const url = new URL(request.url);
  const requestedUserId = url.searchParams.get("userId");
  const requestedEmail = url.searchParams.get("email");

  // Enforce ownership: non-admin users can only read their own profile
  const targetUserId = isAdmin(user.email)
    ? (requestedUserId || user.uid)
    : user.uid;
  const targetEmail = isAdmin(user.email)
    ? (requestedEmail || user.email)
    : user.email;

  try {
    const profile = await getStudentAcademicProfile(env, targetUserId, targetEmail);
    return jsonResponse(profile, {
      headers: { "Cache-Control": "private, no-cache" },
    });
  } catch (error: unknown) {
    return errorResponse("Internal Server Error", 500);
  }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  // ── Auth Guard ──────────────────────────────────────────
  const user = await getAuthenticatedUser(request, env);
  if (!user) return errorResponse("Unauthorized", 401);
  // ────────────────────────────────────────────────────────

  try {
    const body = (await request.json()) as { userId?: string; profile: unknown };

    if (!body || !body.profile || typeof body.profile !== 'object' || Array.isArray(body.profile)) {
      return errorResponse("Missing profile body", 400);
    }

    // Enforce ownership: non-admin users can only update their own profile
    if (!isAdmin(user.email) && body.userId && body.userId !== user.uid) {
      return errorResponse("Forbidden: cannot modify another user's profile", 403);
    }

    const targetUserId = isAdmin(user.email)
      ? (body.userId || user.uid)
      : user.uid;

    const success = await updateStudentAcademicProfile(env, targetUserId, {
      ...body.profile,
      ...(targetUserId === user.uid ? { email: user.email, fullName: user.name } : {}),
    });
    return jsonResponse({ success, userId: targetUserId });
  } catch (error: unknown) {
    if (error instanceof ProfileValidationError) return errorResponse(error.message, 400);
    return errorResponse("Internal Server Error", 500);
  }
}
