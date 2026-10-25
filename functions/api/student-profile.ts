import { saveStudentProfile, ProfileValidationError } from '../lib/studentProfileStore';
import { resolveBranchInfo } from '../lib/studentIdentityService';
import { jsonResponse, errorResponse } from "../lib/json";
import { getAuthenticatedUser, isAdmin } from "../lib/auth";

export async function onRequestGet(context: { 
  env: { PADHAKU_CORE_DB?: D1Database; DB?: D1Database; ASSESSMENT_DB?: D1Database; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string }; 
  request: Request 
}) {
  const { env, request } = context;
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  const emailParam = url.searchParams.get("email");

  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const targetUserId = (userId || user.uid || '').trim();
    const targetEmail = (emailParam || user.email || '').trim().toLowerCase();

    if (!targetUserId && !targetEmail) {
      return errorResponse("User ID or Email is required", 400);
    }

    if (
      targetUserId !== user.uid &&
      targetEmail !== (user.email || '').toLowerCase() &&
      !isAdmin(user.email, user.role)
    ) {
      return errorResponse("Forbidden", 403);
    }

    const coreDb = env.PADHAKU_CORE_DB || env.DB;
    if (coreDb) {
      try {
        const sp = await coreDb.prepare(
          `SELECT 
             sp.*,
             u.display_name,
             u.email AS user_email,
             b.name AS branch_name,
             un.name AS university_name,
             c.name AS college_name,
             co.name AS course_name
           FROM student_profiles sp
           LEFT JOIN users u ON sp.user_id = u.id OR sp.user_id = u.firebase_uid OR (sp.email IS NOT NULL AND LOWER(sp.email) = LOWER(u.email))
           LEFT JOIN branches b ON sp.branch_id = b.id OR sp.branch_id = b.code
           LEFT JOIN universities un ON sp.university_id = un.id
           LEFT JOIN colleges c ON sp.college_id = c.id
           LEFT JOIN courses co ON sp.course_id = co.id
           WHERE sp.user_id = ? 
              OR u.firebase_uid = ?
              OR (sp.email IS NOT NULL AND LOWER(sp.email) = LOWER(?) AND ? != '')
              OR (u.email IS NOT NULL AND LOWER(u.email) = LOWER(?) AND ? != '')
           LIMIT 1`
        )
          .bind(targetUserId, targetUserId, targetEmail, targetEmail, targetEmail, targetEmail)
          .first<Record<string, any>>();

        if (sp) {
          const branchInfo = resolveBranchInfo(sp.branch_id || sp.branch_name || sp.branch);
          const mappedName = sp.full_name || sp.name || sp.display_name || '';
          const mappedEmail = sp.email || sp.user_email || targetEmail || '';
          const mappedPhone = sp.phone_number || '';
          const mappedBranch = branchInfo.name || sp.branch_name || 'Information Technology';
          const mappedCollege = sp.college_name || sp.college_id || sp.college || 'L.D. College of Engineering';
          const mappedUniversity = sp.university_name || sp.university_id || sp.university || 'Gujarat Technological University (GTU)';
          const mappedDegree = sp.course_name || sp.course_id || sp.degree || 'B.Tech / B.E.';

          // Sync users table firebase_uid if missing
          if (user && user.uid && (sp.user_id === user.uid || (sp.email && user.email && sp.email.toLowerCase() === user.email.toLowerCase()))) {
            try {
              await coreDb.prepare(`
                INSERT INTO users (id, firebase_uid, email, display_name, user_type, status, updated_at)
                VALUES (?, ?, ?, ?, 'student', 'active', CURRENT_TIMESTAMP)
                ON CONFLICT(id) DO UPDATE SET firebase_uid = excluded.firebase_uid, updated_at = CURRENT_TIMESTAMP
              `).bind(sp.user_id, user.uid, mappedEmail, mappedName).run();
            } catch (linkErr) {
              // Non-blocking sync
            }
          }

          return jsonResponse({
            ...sp,
            user_id: sp.user_id || targetUserId,
            name: mappedName,
            full_name: mappedName,
            fullName: mappedName,
            email: mappedEmail,
            phone_number: mappedPhone,
            phoneNumber: mappedPhone,
            dob: sp.dob || '',
            branch: mappedBranch,
            branch_name: mappedBranch,
            branchName: mappedBranch,
            branch_id: branchInfo.slug,
            branchId: branchInfo.slug,
            branch_db_id: sp.branch_id || branchInfo.id,
            branch_code: branchInfo.code,
            branch_slug: branchInfo.slug,
            semester: sp.semester ? Number(sp.semester) : 3,
            college: mappedCollege,
            college_name: mappedCollege,
            collegeName: mappedCollege,
            college_id: sp.college_id,
            university: mappedUniversity,
            university_name: mappedUniversity,
            universityName: mappedUniversity,
            university_id: sp.university_id,
            degree: mappedDegree,
            degree_name: mappedDegree,
            degreeName: mappedDegree,
            course_id: sp.course_id,
            enrollment_number: sp.enrollment_number || '',
            enrollmentNumber: sp.enrollment_number || '',
            enrollment_year: sp.enrollment_year || null,
            enrollmentYear: sp.enrollment_year || null,
            graduation_year: sp.graduation_year || null,
            graduationYear: sp.graduation_year || null,
            avatar_url: sp.avatar_url || '',
            avatarUrl: sp.avatar_url || '',
            marks_10th: sp.marks_10th || '',
            marks10th: sp.marks_10th || '',
            marks_12th: sp.marks_12th || '',
            marks12th: sp.marks_12th || '',
            special_skills: sp.special_skills || '',
            specialSkills: sp.special_skills || '',
            languages_known: sp.languages_known || '',
            languagesKnown: sp.languages_known || '',
            experience: sp.experience || '',
            certifications: sp.certifications || '',
            goals: sp.goals || '[]',
          });
        }
      } catch (coreErr) {
        console.warn("Notice querying shiksha-core-db student_profiles:", coreErr);
      }
    }

    // Fallback: Query ASSESSMENT_DB if not found in core-db
    const fallbackDb = env.ASSESSMENT_DB || env.DB;
    if (fallbackDb) {
      try {
        const profile = await fallbackDb.prepare(
          `SELECT * FROM student_profiles 
           WHERE user_id = ? 
              OR (email IS NOT NULL AND LOWER(email) = LOWER(?) AND ? != '') 
           LIMIT 1`
        )
          .bind(targetUserId, targetEmail, targetEmail)
          .first();

        if (profile) {
          const branchInfo = resolveBranchInfo((profile as any).branch || (profile as any).branch_id);
          return jsonResponse({
            ...profile,
            branch: branchInfo.name || (profile as any).branch,
            branch_name: branchInfo.name || (profile as any).branch,
            branchName: branchInfo.name || (profile as any).branch,
            branch_id: branchInfo.slug,
            branchId: branchInfo.slug,
          });
        }
      } catch (fallbackErr) {
        // Fallback DB does not contain student_profiles, ignore safely
      }
    }

    return jsonResponse(null);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}

export async function onRequestPost(context: {
  env: { PADHAKU_CORE_DB?: D1Database; DB?: D1Database; ASSESSMENT_DB?: D1Database; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
}) {
  const { env, request } = context;
  const user = await getAuthenticatedUser(request, env);
  if (!user) return errorResponse('Unauthorized', 401);
  const db = env.PADHAKU_CORE_DB || env.DB;
  if (!db) return errorResponse('Database binding not configured', 503);
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) return errorResponse('Invalid profile', 400);
    const profile = body as Record<string, unknown>;
    const targetId = typeof profile.userId === 'string' ? profile.userId : user.uid;
    if (targetId !== user.uid && !isAdmin(user.email, user.role)) return errorResponse('Forbidden', 403);
    await saveStudentProfile(db, targetId, { ...profile, email: targetId === user.uid ? user.email : profile.email }, env.ASSESSMENT_DB);
    return jsonResponse({ success: true, userId: targetId });
  } catch (error) {
    if (error instanceof ProfileValidationError || error instanceof SyntaxError) return errorResponse(error.message, 400);
    console.error('Profile persistence failed', error);
    return errorResponse('Profile could not be saved. Please retry.', 500);
  }
}

export async function onRequestDelete(context: { 
  env: { PADHAKU_CORE_DB?: D1Database; ASSESSMENT_DB?: D1Database; DB?: D1Database }; 
  request: Request 
}) {
  const { env, request } = context;
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");

  try {
    if (!userId) {
      return errorResponse("User ID is required for profile deletion", 400);
    }

    const user = await getAuthenticatedUser(request, env);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    if (userId !== user.uid && !isAdmin(user.email)) {
      return errorResponse("Forbidden: Cannot delete another user's profile", 403);
    }

    const coreDb = env.PADHAKU_CORE_DB || env.DB;
    if (coreDb) {
      try {
        await coreDb.prepare(`DELETE FROM student_profiles WHERE user_id = ?`).bind(userId).run();
      } catch (e) {
        console.warn("Core db delete failed:", e);
      }
    }

    const assessDb = env.ASSESSMENT_DB;
    if (assessDb) {
      try {
        await assessDb.prepare(`DELETE FROM student_profiles WHERE user_id = ?`).bind(userId).run();
      } catch (e) {
        console.warn("Assessment db delete failed:", e);
      }
    }

    return jsonResponse({ 
      success: true, 
      message: "Student profile permanently deleted." 
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}
