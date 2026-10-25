import { saveStudentProfile } from './studentProfileStore';
// ============================================================
// SHIKSHA SAHAYAK OS - STUDENT IDENTITY & ACADEMIC PROFILE EDGE SERVICE
// ============================================================

import {
  StudentAcademicProfileSpec,
  DeviceSessionSpec,
} from "../../src/types/academic-profile";
import { Env } from "./contentEngine";

const BRANCH_LOOKUP: Record<string, { id: string; name: string; slug: string; code: string }> = {
  // Information Technology (16 / 016)
  'information-technology': { id: 'gtu_be_016', name: 'Information Technology', slug: 'information-technology', code: '016' },
  'it': { id: 'gtu_be_016', name: 'Information Technology', slug: 'information-technology', code: '016' },
  '16': { id: 'gtu_be_016', name: 'Information Technology', slug: 'information-technology', code: '016' },
  '016': { id: 'gtu_be_016', name: 'Information Technology', slug: 'information-technology', code: '016' },
  'gtu_be_016': { id: 'gtu_be_016', name: 'Information Technology', slug: 'information-technology', code: '016' },
  'gtu_be_16': { id: 'gtu_be_016', name: 'Information Technology', slug: 'information-technology', code: '016' },
  'gtu-be-016': { id: 'gtu_be_016', name: 'Information Technology', slug: 'information-technology', code: '016' },
  'gtu-be-16': { id: 'gtu_be_016', name: 'Information Technology', slug: 'information-technology', code: '016' },

  // Computer Engineering (07 / 007)
  'computer-engineering': { id: 'gtu_be_007', name: 'Computer Engineering', slug: 'computer-engineering', code: '007' },
  'computer': { id: 'gtu_be_007', name: 'Computer Engineering', slug: 'computer-engineering', code: '007' },
  'cse': { id: 'gtu_be_007', name: 'Computer Engineering', slug: 'computer-engineering', code: '007' },
  'ce': { id: 'gtu_be_007', name: 'Computer Engineering', slug: 'computer-engineering', code: '007' },
  '7': { id: 'gtu_be_007', name: 'Computer Engineering', slug: 'computer-engineering', code: '007' },
  '07': { id: 'gtu_be_007', name: 'Computer Engineering', slug: 'computer-engineering', code: '007' },
  '007': { id: 'gtu_be_007', name: 'Computer Engineering', slug: 'computer-engineering', code: '007' },
  'gtu_be_007': { id: 'gtu_be_007', name: 'Computer Engineering', slug: 'computer-engineering', code: '007' },
  'gtu_be_07': { id: 'gtu_be_007', name: 'Computer Engineering', slug: 'computer-engineering', code: '007' },
  'gtu_be_7': { id: 'gtu_be_007', name: 'Computer Engineering', slug: 'computer-engineering', code: '007' },
  'gtu-be-007': { id: 'gtu_be_007', name: 'Computer Engineering', slug: 'computer-engineering', code: '007' },
  'gtu-be-07': { id: 'gtu_be_007', name: 'Computer Engineering', slug: 'computer-engineering', code: '007' },
  'gtu-be-7': { id: 'gtu_be_007', name: 'Computer Engineering', slug: 'computer-engineering', code: '007' },

  // Electrical Engineering (09 / 009)
  'electrical-engineering': { id: 'gtu_be_009', name: 'Electrical Engineering', slug: 'electrical-engineering', code: '009' },
  'electrical': { id: 'gtu_be_009', name: 'Electrical Engineering', slug: 'electrical-engineering', code: '009' },
  'ee': { id: 'gtu_be_009', name: 'Electrical Engineering', slug: 'electrical-engineering', code: '009' },
  '9': { id: 'gtu_be_009', name: 'Electrical Engineering', slug: 'electrical-engineering', code: '009' },
  '09': { id: 'gtu_be_009', name: 'Electrical Engineering', slug: 'electrical-engineering', code: '009' },
  '009': { id: 'gtu_be_009', name: 'Electrical Engineering', slug: 'electrical-engineering', code: '009' },
  'gtu_be_009': { id: 'gtu_be_009', name: 'Electrical Engineering', slug: 'electrical-engineering', code: '009' },
  'gtu_be_09': { id: 'gtu_be_009', name: 'Electrical Engineering', slug: 'electrical-engineering', code: '009' },
  'gtu_be_9': { id: 'gtu_be_009', name: 'Electrical Engineering', slug: 'electrical-engineering', code: '009' },
  'gtu-be-009': { id: 'gtu_be_009', name: 'Electrical Engineering', slug: 'electrical-engineering', code: '009' },
  'gtu-be-09': { id: 'gtu_be_009', name: 'Electrical Engineering', slug: 'electrical-engineering', code: '009' },
  'gtu-be-9': { id: 'gtu_be_009', name: 'Electrical Engineering', slug: 'electrical-engineering', code: '009' },

  // Electronics & Communication (011)
  'electronics-and-communication': { id: 'gtu_be_011', name: 'Electronics and Communication', slug: 'electronics-and-communication', code: '011' },
  'electronics': { id: 'gtu_be_011', name: 'Electronics and Communication', slug: 'electronics-and-communication', code: '011' },
  'ece': { id: 'gtu_be_011', name: 'Electronics and Communication', slug: 'electronics-and-communication', code: '011' },
  'ec': { id: 'gtu_be_011', name: 'Electronics and Communication', slug: 'electronics-and-communication', code: '011' },
  '11': { id: 'gtu_be_011', name: 'Electronics and Communication', slug: 'electronics-and-communication', code: '011' },
  '011': { id: 'gtu_be_011', name: 'Electronics and Communication', slug: 'electronics-and-communication', code: '011' },
  'gtu_be_011': { id: 'gtu_be_011', name: 'Electronics and Communication', slug: 'electronics-and-communication', code: '011' },
  'gtu_be_11': { id: 'gtu_be_011', name: 'Electronics and Communication', slug: 'electronics-and-communication', code: '011' },
  'gtu-be-011': { id: 'gtu_be_011', name: 'Electronics and Communication', slug: 'electronics-and-communication', code: '011' },
  'gtu-be-11': { id: 'gtu_be_011', name: 'Electronics and Communication', slug: 'electronics-and-communication', code: '011' },

  // Mechanical Engineering (019)
  'mechanical-engineering': { id: 'gtu_be_019', name: 'Mechanical Engineering', slug: 'mechanical-engineering', code: '019' },
  'mechanical': { id: 'gtu_be_019', name: 'Mechanical Engineering', slug: 'mechanical-engineering', code: '019' },
  'me': { id: 'gtu_be_019', name: 'Mechanical Engineering', slug: 'mechanical-engineering', code: '019' },
  '19': { id: 'gtu_be_019', name: 'Mechanical Engineering', slug: 'mechanical-engineering', code: '019' },
  '019': { id: 'gtu_be_019', name: 'Mechanical Engineering', slug: 'mechanical-engineering', code: '019' },
  'gtu_be_019': { id: 'gtu_be_019', name: 'Mechanical Engineering', slug: 'mechanical-engineering', code: '019' },
  'gtu_be_19': { id: 'gtu_be_019', name: 'Mechanical Engineering', slug: 'mechanical-engineering', code: '019' },
  'gtu-be-019': { id: 'gtu_be_019', name: 'Mechanical Engineering', slug: 'mechanical-engineering', code: '019' },
  'gtu-be-19': { id: 'gtu_be_019', name: 'Mechanical Engineering', slug: 'mechanical-engineering', code: '019' },

  // Civil Engineering (006)
  'civil-engineering': { id: 'gtu_be_006', name: 'Civil Engineering', slug: 'civil-engineering', code: '006' },
  'civil': { id: 'gtu_be_006', name: 'Civil Engineering', slug: 'civil-engineering', code: '006' },
  '6': { id: 'gtu_be_006', name: 'Civil Engineering', slug: 'civil-engineering', code: '006' },
  '06': { id: 'gtu_be_006', name: 'Civil Engineering', slug: 'civil-engineering', code: '006' },
  '006': { id: 'gtu_be_006', name: 'Civil Engineering', slug: 'civil-engineering', code: '006' },
  'gtu_be_006': { id: 'gtu_be_006', name: 'Civil Engineering', slug: 'civil-engineering', code: '006' },
  'gtu_be_06': { id: 'gtu_be_006', name: 'Civil Engineering', slug: 'civil-engineering', code: '006' },
  'gtu_be_6': { id: 'gtu_be_006', name: 'Civil Engineering', slug: 'civil-engineering', code: '006' },
  'gtu-be-006': { id: 'gtu_be_006', name: 'Civil Engineering', slug: 'civil-engineering', code: '006' },
  'gtu-be-06': { id: 'gtu_be_006', name: 'Civil Engineering', slug: 'civil-engineering', code: '006' },
  'gtu-be-6': { id: 'gtu_be_006', name: 'Civil Engineering', slug: 'civil-engineering', code: '006' },

  // Chemical Engineering (005)
  'chemical-engineering': { id: 'gtu_be_005', name: 'Chemical Engineering', slug: 'chemical-engineering', code: '005' },
  'chemical': { id: 'gtu_be_005', name: 'Chemical Engineering', slug: 'chemical-engineering', code: '005' },
  'ch': { id: 'gtu_be_005', name: 'Chemical Engineering', slug: 'chemical-engineering', code: '005' },
  '5': { id: 'gtu_be_005', name: 'Chemical Engineering', slug: 'chemical-engineering', code: '005' },
  '05': { id: 'gtu_be_005', name: 'Chemical Engineering', slug: 'chemical-engineering', code: '005' },
  '005': { id: 'gtu_be_005', name: 'Chemical Engineering', slug: 'chemical-engineering', code: '005' },
  'gtu_be_005': { id: 'gtu_be_005', name: 'Chemical Engineering', slug: 'chemical-engineering', code: '005' },
  'gtu_be_05': { id: 'gtu_be_005', name: 'Chemical Engineering', slug: 'chemical-engineering', code: '005' },
  'gtu_be_5': { id: 'gtu_be_005', name: 'Chemical Engineering', slug: 'chemical-engineering', code: '005' },
  'gtu-be-005': { id: 'gtu_be_005', name: 'Chemical Engineering', slug: 'chemical-engineering', code: '005' },
  'gtu-be-05': { id: 'gtu_be_005', name: 'Chemical Engineering', slug: 'chemical-engineering', code: '005' },
  'gtu-be-5': { id: 'gtu_be_005', name: 'Chemical Engineering', slug: 'chemical-engineering', code: '005' },
};

export function resolveBranchInfo(input: string | undefined | null) {
  if (!input) return { id: 'gtu_be_007', name: 'Computer Engineering', slug: 'computer-engineering', code: '007' };
  const raw = String(input).trim().toLowerCase();
  const cleaned = raw.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const underscored = raw.replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');

  if (BRANCH_LOOKUP[raw]) return BRANCH_LOOKUP[raw];
  if (BRANCH_LOOKUP[cleaned]) return BRANCH_LOOKUP[cleaned];
  if (BRANCH_LOOKUP[underscored]) return BRANCH_LOOKUP[underscored];

  // Match GTU branch ID format like gtu_be_16 or gtu-be-016
  const gtuMatch = raw.match(/gtu[-_]?be[-_]?0*(\d+)/i);
  if (gtuMatch && gtuMatch[1]) {
    const codeNum = gtuMatch[1];
    if (BRANCH_LOOKUP[codeNum]) {
      return BRANCH_LOOKUP[codeNum];
    }
  }

  // Keyword matching
  if (raw.includes('information') || raw === 'it' || raw.includes(' it') || raw.startsWith('it ')) {
    return BRANCH_LOOKUP['information-technology'];
  }
  if (raw.includes('computer') || raw.includes('cse') || raw.includes('software')) {
    return BRANCH_LOOKUP['computer-engineering'];
  }
  if (raw.includes('electric') && !raw.includes('electronic')) {
    return BRANCH_LOOKUP['electrical-engineering'];
  }
  if (raw.includes('electronic') || raw.includes('comm') || raw.includes('telecom')) {
    return BRANCH_LOOKUP['electronics-and-communication'];
  }
  if (raw.includes('mechanic') || raw.includes('automobile')) {
    return BRANCH_LOOKUP['mechanical-engineering'];
  }
  if (raw.includes('civil') || raw.includes('construction') || raw.includes('infra')) {
    return BRANCH_LOOKUP['civil-engineering'];
  }
  if (raw.includes('chem')) {
    return BRANCH_LOOKUP['chemical-engineering'];
  }

  return {
    id: 'gtu_be_007',
    name: input.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    slug: cleaned || 'computer-engineering',
    code: '007'
  };
}

/**
 * Hydrates or creates default student academic profile synced with PADHAKU_CORE_DB student_profiles.
 */
export async function getStudentAcademicProfile(
  env: Env,
  userId: string,
  userEmail?: string
): Promise<StudentAcademicProfileSpec> {
  const coreDb = env.PADHAKU_CORE_DB || env.DB;
  const targetEmail = (userEmail || '').trim().toLowerCase();

  try {
    // 1. PRIMARY SOURCE OF TRUTH: Query student_profiles in PADHAKU_CORE_DB
    if (coreDb) {
      try {
        const sp = await coreDb.prepare(
          `SELECT 
             sp.user_id,
             sp.full_name,
             sp.email,
             sp.phone_number,
             sp.dob,
             sp.university_id,
             sp.course_id,
             sp.college_id,
             sp.branch_id,
             sp.semester,
             sp.enrollment_number,
             sp.enrollment_year,
             sp.graduation_year,
             sp.goals,
             sp.avatar_url,
             sp.created_at,
             sp.updated_at,
             u.display_name,
             u.email AS user_email,
             b.name AS branch_name,
             b.code AS branch_code,
             un.name AS university_name
           FROM student_profiles sp
           LEFT JOIN users u ON sp.user_id = u.id OR sp.user_id = u.firebase_uid OR (sp.email IS NOT NULL AND LOWER(sp.email) = LOWER(u.email))
           LEFT JOIN branches b ON sp.branch_id = b.id OR sp.branch_id = b.code
           LEFT JOIN universities un ON sp.university_id = un.id
           WHERE sp.user_id = ? 
              OR u.firebase_uid = ? 
              OR (sp.email IS NOT NULL AND LOWER(sp.email) = LOWER(?) AND ? != '')
              OR (u.email IS NOT NULL AND LOWER(u.email) = LOWER(?) AND ? != '')
           LIMIT 1`
        )
          .bind(userId, userId, targetEmail, targetEmail, targetEmail, targetEmail)
          .first<Record<string, unknown>>();

        if (sp) {
          const branchInfo = resolveBranchInfo(String(sp.branch_id || sp.branch_name || ''));
          let parsedGoals: string[] = [];
          if (sp.goals) {
            try {
              parsedGoals = typeof sp.goals === 'string' ? JSON.parse(sp.goals) : (sp.goals as string[]);
            } catch {
              parsedGoals = [String(sp.goals)];
            }
          }

          return {
            userId: String(sp.user_id || userId),
            fullName: String(sp.full_name || sp.display_name || ''),
            email: String(sp.email || sp.user_email || ''),
            phoneNumber: sp.phone_number ? String(sp.phone_number) : undefined,
            dob: sp.dob ? String(sp.dob) : undefined,
            universityId: String(sp.university_id || 'gtu'),
            universityName: String(sp.university_name || 'Gujarat Technological University'),
            college: sp.college_id ? String(sp.college_id) : undefined,
            degreeId: String(sp.course_id || 'btech'),
            degreeName: 'Bachelor of Technology',
            branchId: branchInfo.slug,
            branchName: String(sp.branch_name || branchInfo.name),
            semester: Number(sp.semester || 1),
            enrollmentNumber: sp.enrollment_number ? String(sp.enrollment_number) : undefined,
            academicYear: '2026-2027',
            enrollmentYear: sp.enrollment_year ? Number(sp.enrollment_year) : null,
            expectedGraduationYear: sp.graduation_year ? Number(sp.graduation_year) : null,
            preferredLanguage: 'en',
            goals: parsedGoals,
            avatarUrl: sp.avatar_url ? String(sp.avatar_url) : undefined,
            marks_10th: sp.marks_10th ? String(sp.marks_10th) : undefined,
            marks_12th: sp.marks_12th ? String(sp.marks_12th) : undefined,
            special_skills: sp.special_skills ? String(sp.special_skills) : undefined,
            languages_known: sp.languages_known ? String(sp.languages_known) : undefined,
            experience: sp.experience ? String(sp.experience) : undefined,
            certifications: sp.certifications ? String(sp.certifications) : undefined,
            isProfileComplete: Boolean(sp.semester && sp.branch_id),
            createdAt: String(sp.created_at || new Date().toISOString()),
            updatedAt: String(sp.updated_at || new Date().toISOString()),
          } as any;
        }

        // Check if user exists in users table in PADHAKU_CORE_DB
        const u = await coreDb.prepare(
          `SELECT id, firebase_uid, email, display_name FROM users 
           WHERE id = ? 
              OR firebase_uid = ? 
              OR (email IS NOT NULL AND LOWER(email) = LOWER(?) AND ? != '') 
           LIMIT 1`
        )
          .bind(userId, userId, targetEmail, targetEmail)
          .first<Record<string, unknown>>();

        if (u) {
          return {
            userId: String(u.id || userId),
            fullName: String(u.display_name || ''),
            email: String(u.email || ''),
            universityId: 'gtu',
            universityName: 'Gujarat Technological University',
            degreeId: 'btech',
            degreeName: 'Bachelor of Technology',
            branchId: 'computer-engineering',
            branchName: 'Computer Engineering',
            semester: 1,
            academicYear: '2026-2027',
            preferredLanguage: 'en',
            goals: [],
            isProfileComplete: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }
      } catch (coreErr) {
        console.warn('Notice querying core-db student_profiles:', coreErr);
      }
    }



    // Default clean profile
    return {
      userId,
      universityId: 'gtu',
      universityName: 'Gujarat Technological University',
      degreeId: 'btech',
      degreeName: 'Bachelor of Technology',
      branchId: 'computer-engineering',
      branchName: 'Computer Engineering',
      semester: 1,
      academicYear: '2026-2027',
      preferredLanguage: 'en',
      goals: [],
      isProfileComplete: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error in getStudentAcademicProfile:', error);
    return {
      userId,
      universityId: 'gtu',
      universityName: 'Gujarat Technological University',
      degreeId: 'btech',
      degreeName: 'Bachelor of Technology',
      branchId: 'computer-engineering',
      branchName: 'Computer Engineering',
      semester: 1,
      academicYear: '2026-2027',
      preferredLanguage: 'en',
      goals: [],
      isProfileComplete: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

/**
 * Updates or completes a student academic profile in D1 (syncs student_profiles & users in PADHAKU_CORE_DB).
 */
export async function updateStudentAcademicProfile(
  env: Env,
  userId: string,
  profile: Partial<StudentAcademicProfileSpec>
): Promise<boolean> {
  const db = env.PADHAKU_CORE_DB || env.DB;
  if (!db) throw new Error('Database binding not configured');
  await saveStudentProfile(db, userId, { ...profile }, env.ASSESSMENT_DB);
  return true;
}

/**
 * Fetches active device sessions for a student.
 */
export async function getStudentDeviceSessions(
  env: Env,
  userId: string
): Promise<DeviceSessionSpec[]> {
  try {
    const { results } = await env.DB.prepare(
      `SELECT id, user_id, device_name, user_agent, ip_address, last_active_at, is_active, created_at
       FROM student_device_sessions
       WHERE user_id = ? AND is_active = 1
       ORDER BY last_active_at DESC`
    )
      .bind(userId)
      .all<Record<string, unknown>>();

    return (results || []).map((row) => ({
      id: String(row.id),
      userId: String(row.user_id),
      deviceName: String(row.device_name),
      userAgent: row.user_agent ? String(row.user_agent) : null,
      ipAddress: row.ip_address ? String(row.ip_address) : null,
      lastActiveAt: String(row.last_active_at),
      isActive: Boolean(row.is_active),
      createdAt: String(row.created_at),
    }));
  } catch (error) {
    console.error("Error in getStudentDeviceSessions:", error);
    return [];
  }
}
