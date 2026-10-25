// ============================================================
// TEACHER API: GET / POST /api/teacher/profile
// Authenticated teacher identity & onboarding profile management in D1
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getAuthenticatedUser } from "../../lib/auth";

export async function onRequestGet(context: {
  request: Request;
  env: { DB: D1Database; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
}) {
  const { request, env } = context;
  const user = await getAuthenticatedUser(request, env);

  if (!user || !user.uid) {
    return errorResponse("Unauthorized - Teacher authentication required", 401);
  }

  try {
    // 1. Fetch user from unified_users
    const unifiedUser = await env.DB.prepare(
      `SELECT id, uid, email, display_name, user_type, created_at FROM unified_users WHERE uid = ? OR id = ?`
    )
      .bind(user.uid, user.uid)
      .first<{ id: string; uid: string; email: string; display_name: string; user_type: string; created_at: string }>();

    // 2. Fetch profile from teacher_profiles
    const profile = await env.DB.prepare(
      `SELECT user_id, full_name, institution, department, designation, phone, qualification, experience, bio, subjects_json, branches_json, semesters_json, is_onboarded, created_at, updated_at
       FROM teacher_profiles WHERE user_id = ?`
    )
      .bind(user.uid)
      .first<{
        user_id: string;
        full_name: string;
        institution: string;
        department: string;
        designation: string;
        phone?: string;
        qualification?: string;
        experience?: string;
        bio?: string;
        subjects_json: string;
        branches_json: string;
        semesters_json: string;
        is_onboarded: number;
        created_at: string;
        updated_at: string;
      }>()
      .catch(async () => {
        // Fallback for database schema before migration 060
        return await env.DB.prepare(
          `SELECT user_id, full_name, institution, department, designation, subjects_json, branches_json, semesters_json, is_onboarded, created_at, updated_at
           FROM teacher_profiles WHERE user_id = ?`
        )
          .bind(user.uid)
          .first<any>();
      });

    return jsonResponse({
      success: true,
      user: unifiedUser || {
        id: user.uid,
        uid: user.uid,
        email: user.email || "",
        display_name: user.name || "",
        user_type: user.role || "teacher",
      },
      profile: profile
        ? {
            ...profile,
            subjects: profile.subjects_json ? JSON.parse(profile.subjects_json) : [],
            branches: profile.branches_json ? JSON.parse(profile.branches_json) : [],
            semesters: profile.semesters_json ? JSON.parse(profile.semesters_json) : [],
            isOnboarded: Boolean(profile.is_onboarded),
          }
        : null,
      isOnboarded: Boolean(profile?.is_onboarded),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}

export async function onRequestPost(context: {
  request: Request;
  env: { DB: D1Database; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
}) {
  const { request, env } = context;
  const user = await getAuthenticatedUser(request, env);

  if (!user || !user.uid) {
    return errorResponse("Unauthorized - Teacher authentication required", 401);
  }

  // Verify user authentication
  const db = (env as any).ASSESSMENT_DB || env.DB;
  let isAuthorizedTeacher = user.role === 'teacher' || user.role === 'educator' || user.role === 'admin';
  if (!isAuthorizedTeacher && user.email && db) {
    const whitelisted = await db.prepare(
      `SELECT email FROM teacher_whitelist WHERE LOWER(email) = ? LIMIT 1`
    )
      .bind(user.email.toLowerCase())
      .first();
    if (whitelisted) {
      isAuthorizedTeacher = true;
    }
  }

  // Also check existing teacher_profiles record
  if (!isAuthorizedTeacher && user.uid && db) {
    const existing = await db.prepare(
      `SELECT user_id FROM teacher_profiles WHERE user_id = ? LIMIT 1`
    )
      .bind(user.uid)
      .first();
    if (existing) {
      isAuthorizedTeacher = true;
    }
  }

  // Allow authenticated users to complete teacher registration/onboarding
  if (!isAuthorizedTeacher && user.uid) {
    isAuthorizedTeacher = true;
  }

  if (!isAuthorizedTeacher) {
    return errorResponse("Forbidden - Teacher authorization required", 403);
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      fullName?: string;
      phone?: string;
      qualification?: string;
      experience?: string;
      institution?: string;
      department?: string;
      designation?: string;
      bio?: string;
      subjects?: string[];
      branches?: string[];
      semesters?: number[];
    };

    const fullName = body.fullName || user.name || user.email?.split("@")[0] || "Educator";
    const phone = body.phone || "";
    const qualification = body.qualification || "";
    const experience = body.experience || "";
    const institution = body.institution || "";
    const department = body.department || "Engineering";
    const designation = body.designation || "";
    const bio = body.bio || "";
    const subjectsJson = JSON.stringify(body.subjects || []);
    const branchesJson = JSON.stringify(body.branches || []);
    const semestersJson = JSON.stringify(body.semesters || [1, 2, 3, 4, 5, 6, 7, 8]);

    // 1. Ensure unified_users record exists with user_type = 'teacher'
    await env.DB.prepare(
      `INSERT INTO unified_users (id, uid, email, display_name, user_type)
       VALUES (?, ?, ?, ?, 'teacher')
       ON CONFLICT(uid) DO UPDATE SET
         display_name = excluded.display_name,
         user_type = 'teacher',
         updated_at = CURRENT_TIMESTAMP`
    )
      .bind(user.uid, user.uid, user.email || `${user.uid}@shikshasahayak.org`, fullName)
      .run();

    // Ensure email is present in teacher_whitelist
    if (user.email && db) {
      try {
        await db.prepare(
          `INSERT INTO teacher_whitelist (id, email, name, role, department, added_by, created_at)
           VALUES (?, ?, ?, 'teacher', ?, 'teacher_registration', CURRENT_TIMESTAMP)
           ON CONFLICT(email) DO NOTHING`
        )
          .bind(`tw_${Date.now()}`, user.email.toLowerCase(), fullName, department)
          .run();
      } catch (twErr) {
        // Table constraint or schema variant tolerance
      }
    }

    // 2. Upsert teacher_profiles with new fields (fallback to basic insert if columns not yet added)
    try {
      await env.DB.prepare(
        `INSERT INTO teacher_profiles (user_id, full_name, phone, qualification, experience, institution, department, designation, bio, subjects_json, branches_json, semesters_json, is_onboarded, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
         ON CONFLICT(user_id) DO UPDATE SET
           full_name = excluded.full_name,
           phone = excluded.phone,
           qualification = excluded.qualification,
           experience = excluded.experience,
           institution = excluded.institution,
           department = excluded.department,
           designation = excluded.designation,
           bio = excluded.bio,
           subjects_json = excluded.subjects_json,
           branches_json = excluded.branches_json,
           semesters_json = excluded.semesters_json,
           is_onboarded = 1,
           updated_at = CURRENT_TIMESTAMP`
      )
        .bind(
          user.uid,
          fullName,
          phone,
          qualification,
          experience,
          institution,
          department,
          designation,
          bio,
          subjectsJson,
          branchesJson,
          semestersJson
        )
        .run();
    } catch {
      // Fallback query if optional columns are pending D1 migration execution
      await env.DB.prepare(
        `INSERT INTO teacher_profiles (user_id, full_name, institution, department, designation, subjects_json, branches_json, semesters_json, is_onboarded, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
         ON CONFLICT(user_id) DO UPDATE SET
           full_name = excluded.full_name,
           institution = excluded.institution,
           department = excluded.department,
           designation = excluded.designation,
           subjects_json = excluded.subjects_json,
           branches_json = excluded.branches_json,
           semesters_json = excluded.semesters_json,
           is_onboarded = 1,
           updated_at = CURRENT_TIMESTAMP`
      )
        .bind(
          user.uid,
          fullName,
          institution,
          department,
          designation,
          subjectsJson,
          branchesJson,
          semestersJson
        )
        .run();
    }

    return jsonResponse({
      success: true,
      message: "Teacher profile saved successfully",
      profile: {
        userId: user.uid,
        fullName,
        phone,
        qualification,
        experience,
        institution,
        department,
        designation,
        bio,
        subjects: body.subjects || [],
        branches: body.branches || [],
        semesters: body.semesters || [],
        isOnboarded: true,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save teacher profile";
    return errorResponse(message, 500);
  }
}
