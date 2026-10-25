import { jsonResponse, errorResponse } from "../../lib/json";
import { getAuthenticatedUser } from "../../lib/auth";

export async function onRequestGet(context: {
  request: Request;
  env: {
    PADHAKU_CORE_DB?: D1Database;
    ASSESSMENT_DB?: D1Database;
    DB?: D1Database;
    FIREBASE_PROJECT_ID?: string;
    VITE_FIREBASE_PROJECT_ID?: string;
  };
}) {
  const { request, env } = context;

  try {
    // Verify Firebase ID Token server-side
    const user = await getAuthenticatedUser(request, env);
    if (!user) {
      return errorResponse("Unauthorized: Invalid or missing Firebase token", 401);
    }

    const db = env.PADHAKU_CORE_DB || env.DB || env.ASSESSMENT_DB;
    if (!db) {
      return errorResponse("Database binding error (DB missing)", 500);
    }

    let profile: any = null;
    const userEmail = (user.email || '').trim().toLowerCase();

    try {
      profile = await db
        .prepare(
          `SELECT * FROM student_profiles 
           WHERE user_id = ? 
              OR (email IS NOT NULL AND LOWER(email) = LOWER(?) AND ? != '') 
           LIMIT 1`
        )
        .bind(user.uid, userEmail, userEmail)
        .first();
    } catch (err) {
      // Fallback query in case alias student_profile is directly targeted
      try {
        profile = await db
          .prepare(
            `SELECT * FROM student_profile 
             WHERE user_id = ? 
                OR (email IS NOT NULL AND LOWER(email) = LOWER(?) AND ? != '') 
             LIMIT 1`
          )
          .bind(user.uid, userEmail, userEmail)
          .first();
      } catch (fallbackErr) {
        console.warn("D1 student_profile query notice:", fallbackErr);
      }
    }

    const hasProfile = Boolean(
      profile &&
      (profile.branch || profile.branch_id || profile.branchName || profile.branch_name) &&
      (Number(profile.semester) > 0 || profile.college || profile.college_id)
    );

    return jsonResponse({
      authenticated: true,
      uid: user.uid,
      email: user.email || null,
      name: user.name || null,
      hasProfile,
      profile: profile || null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}
