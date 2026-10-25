/**
 * Class Management Helper Functions
 * 
 * Utilities for join code generation, validation, and class operations
 */

/**
 * Generate a unique 8-character alphanumeric join code
 * Format: Uppercase letters and numbers for readability
 * Example: AB12CD34
 */
export function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars (0, O, I, 1)
  let code = '';
  
  for (let i = 0; i < 8; i++) {
    const randomIndex = crypto.getRandomValues(new Uint8Array(1))[0] % chars.length;
    code += chars[randomIndex];
  }
  
  return code;
}

/**
 * Validate join code format
 * Must be 8 characters, alphanumeric
 */
export function isValidJoinCode(code: string): boolean {
  return /^[A-Z0-9]{8}$/.test(code);
}

/**
 * Check if join code is unique in database
 */
export async function isJoinCodeUnique(
  db: D1Database, 
  joinCode: string, 
  excludeClassId?: string
): Promise<boolean> {
  const query = excludeClassId
    ? `SELECT COUNT(*) as count FROM classes WHERE join_code = ? AND id != ? AND is_active = 1`
    : `SELECT COUNT(*) as count FROM classes WHERE join_code = ? AND is_active = 1`;
  
  const params = excludeClassId ? [joinCode, excludeClassId] : [joinCode];
  
  const result = await db
    .prepare(query)
    .bind(...params)
    .first<{ count: number }>();
  
  return result?.count === 0;
}

/**
 * Generate a unique join code (retry until unique)
 * Maximum 10 attempts to prevent infinite loops
 */
export async function generateUniqueJoinCode(
  db: D1Database,
  excludeClassId?: string
): Promise<string> {
  const maxAttempts = 10;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateJoinCode();
    const isUnique = await isJoinCodeUnique(db, code, excludeClassId);
    
    if (isUnique) {
      return code;
    }
  }
  
  throw new Error('Unable to generate a unique class join code');
}

/**
 * Returns the active classroom database instance.
 * Prefers PADHAKU_CORE_DB, falling back to ASSESSMENT_DB or DB.
 */
export function getTeacherDb(env: Partial<Pick<WorkerBindings, 'PADHAKU_CORE_DB' | 'ASSESSMENT_DB' | 'DB'>>): D1Database | null {
  return env?.PADHAKU_CORE_DB || env?.ASSESSMENT_DB || env?.DB || null;
}

/**
 * Ensures user is registered in the canonical `users` table
 * Satisfies FOREIGN KEY (teacher_id) / FOREIGN KEY (student_id) constraints in classes and class_enrollments
 */
export async function ensureUserExists(
  db: D1Database,
  uid: string,
  email?: string,
  name?: string,
  userType: 'student' | 'teacher' | 'admin' = 'student'
): Promise<string> {
  if (!db || !uid) return uid;

  // 1. Check if user already exists by id or firebase_uid
  try {
    const existing = await db
      .prepare(`SELECT id FROM users WHERE id = ? OR firebase_uid = ? LIMIT 1`)
      .bind(uid, uid)
      .first<{ id: string }>();

    if (existing?.id) {
      return existing.id;
    }
  } catch (err) {
    console.warn('[ensureUserExists] lookup error:', err);
  }

  // 2. Safe unique email
  let safeEmail = (email || '').trim().toLowerCase();
  if (!safeEmail) {
    safeEmail = `${uid.toLowerCase().replace(/[^a-z0-9]/g, '')}@shikshasahayak.org`;
  }

  try {
    const emailCheck = await db
      .prepare(`SELECT id, firebase_uid FROM users WHERE LOWER(email) = ? LIMIT 1`)
      .bind(safeEmail)
      .first<{ id: string; firebase_uid: string }>();

    if (emailCheck) {
      if (emailCheck.firebase_uid === uid || emailCheck.id === uid) {
        return emailCheck.id;
      }
      safeEmail = `${uid.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Date.now()}@shikshasahayak.org`;
    }
  } catch {}

  const displayName = (name || '').trim() || (userType === 'teacher' ? 'Faculty Professor' : 'Student');
  const userId = uid;

  try {
    await db
      .prepare(
        `INSERT INTO users (id, firebase_uid, email, display_name, user_type, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      )
      .bind(userId, uid, safeEmail, displayName, userType)
      .run();
    return userId;
  } catch (err) {
    // If conflict on concurrent insert, re-check
    const found = await db
      .prepare(`SELECT id FROM users WHERE id = ? OR firebase_uid = ? LIMIT 1`)
      .bind(uid, uid)
      .first<{ id: string }>();
    if (found?.id) return found.id;
    throw err;
  }
}

/**
 * Calculate student count for a class
 */
export async function getClassStudentCount(
  db: D1Database, 
  classId: string
): Promise<number> {
  const result = await db
    .prepare(
      `SELECT COUNT(*) as count FROM class_enrollments 
       WHERE class_id = ? AND (enrollment_status = 'ACTIVE' OR enrollment_status = 'active')`
    )
    .bind(classId)
    .first<{ count: number }>();
  
  return result?.count || 0;
}

/**
 * Calculate assignment count for a class
 */
export async function getClassAssignmentCount(
  db: D1Database, 
  classId: string
): Promise<number> {
  const result = await db
    .prepare(
      `SELECT COUNT(*) as count FROM assignments 
       WHERE class_id = ? AND LOWER(status) != 'draft'`
    )
    .bind(classId)
    .first<{ count: number }>();
  
  return result?.count || 0;
}

/**
 * Calculate material count for a class
 */
export async function getClassMaterialCount(
  db: D1Database, 
  classId: string
): Promise<number> {
  const result = await db
    .prepare(
      `SELECT COUNT(*) as count FROM class_materials 
       WHERE class_id = ? AND is_visible = 1`
    )
    .bind(classId)
    .first<{ count: number }>();
  
  return result?.count || 0;
}

/**
 * Check if user is teacher of a specific class
 */
export async function isClassTeacher(
  db: D1Database, 
  classId: string, 
  teacherId: string
): Promise<boolean> {
  const result = await db
    .prepare(
      `SELECT COUNT(*) as count FROM classes 
       WHERE id = ? AND (teacher_id = ? OR teacher_id IN (SELECT id FROM users WHERE firebase_uid = ?))`
    )
    .bind(classId, teacherId, teacherId)
    .first<{ count: number }>();
  
  return (result?.count || 0) > 0;
}

/**
 * Check if user has HOD permissions
 */
export async function isHOD(
  db: D1Database, 
  teacherId: string
): Promise<boolean> {
  const result = await db
    .prepare(
      `SELECT COUNT(*) as count FROM teacher_departments 
       WHERE teacher_id = ? AND hierarchy = 'HOD'`
    )
    .bind(teacherId)
    .first<{ count: number }>();
  
  return (result?.count || 0) > 0;
}

