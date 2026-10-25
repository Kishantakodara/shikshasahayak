// ============================================================
// SHIKSHA SAHAYAK OS API: /api/auth/profile
// Authenticated user identity and canonical role resolution from D1
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getAuthenticatedUser } from "../../lib/auth";
import { getUnifiedUserProfile } from "../../lib/identityAuth";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    const authUser = await getAuthenticatedUser(request, env);
    const url = new URL(request.url);
    const queryUserId = url.searchParams.get("userId");

    // If caller provided Bearer token
    if (authUser) {
      const targetUserId = authUser.uid;
      let profile = await getUnifiedUserProfile(env, targetUserId);

      // If user is not yet in unified_users, auto-sync them with resolved role
      if (!profile && env.DB) {
        try {
          await env.DB.prepare(
            `INSERT INTO unified_users (id, uid, email, display_name, user_type)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(uid) DO UPDATE SET
               display_name = COALESCE(excluded.display_name, unified_users.display_name),
               updated_at = CURRENT_TIMESTAMP`
          )
            .bind(
              targetUserId,
              targetUserId,
              authUser.email || `${targetUserId}@shikshasahayak.org`,
              authUser.name || authUser.email?.split('@')[0] || 'User',
              authUser.role || 'student'
            )
            .run();

          profile = await getUnifiedUserProfile(env, targetUserId);
        } catch (dbErr) {
          console.warn("Auto-sync unified_users notice in auth/profile:", dbErr);
        }
      }

      const canonicalRole = authUser.role || (profile?.userType as string) || 'student';

      return jsonResponse(
        {
          success: true,
          id: targetUserId,
          uid: targetUserId,
          email: authUser.email || profile?.email || '',
          displayName: authUser.name || profile?.displayName || '',
          role: canonicalRole,
          userType: canonicalRole,
          status: profile?.status || 'active',
          academicProfile: profile?.academicProfile || null,
          permissions: profile?.permissions || ['content:view'],
        },
        {
          headers: {
            "Cache-Control": "private, no-cache",
          },
        }
      );
    }

    // Unauthenticated fallback -> guest user response
    return jsonResponse(
      {
        id: "guest_user",
        userType: "guest",
        role: "guest",
        status: "active",
      },
      { headers: { "Cache-Control": "private, no-cache" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}

