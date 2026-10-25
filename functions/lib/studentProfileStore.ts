/** Canonical profile writes. Labels are resolved to existing master-data IDs with auto-healing fallback. */
export class ProfileValidationError extends Error {}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

export async function resolveAcademicId(
  db: D1Database,
  table: 'universities' | 'courses' | 'colleges' | 'branches',
  value: unknown,
  universityId?: string | null,
  courseId?: string | null,
): Promise<string | null> {
  const label = text(value);
  if (!label) return null;

  const norm = normalize(label);

  // 1. UNIVERSITIES
  if (table === 'universities') {
    if (norm.includes('gtu') || norm.includes('gujarattechnological') || norm.includes('gujarat')) {
      return 'gtu';
    }
    try {
      const { results } = await db.prepare('SELECT id, name, short_name FROM universities').all<{ id: string; name: string; short_name?: string }>();
      const match = (results || []).find(u => 
        normalize(u.id) === norm || 
        normalize(u.name) === norm || 
        (u.short_name && normalize(u.short_name) === norm) ||
        normalize(u.name).includes(norm) ||
        norm.includes(normalize(u.name))
      );
      if (match) return match.id;

      const newId = norm.slice(0, 32) || 'univ';
      await db.prepare('INSERT OR IGNORE INTO universities (id, name, short_name, created_at, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)')
        .bind(newId, label, label.slice(0, 20))
        .run();
      return newId;
    } catch {
      return 'gtu';
    }
  }

  // 2. COURSES / DEGREES
  if (table === 'courses') {
    const courseAliases: Record<string, string> = {
      be: 'be',
      btech: 'be',
      btechbe: 'be',
      bacheloroftechnology: 'be',
      bacheloroftechnologybtechbe: 'be',
      bachelorofengineering: 'be',
      diploma: 'diploma',
      diplomaengineering: 'diploma',
      me: 'me',
      mtech: 'me',
      mca: 'mca',
      bca: 'bca',
      bpharm: 'bpharm',
    };
    if (courseAliases[norm]) return courseAliases[norm];
    for (const [alias, id] of Object.entries(courseAliases)) {
      if (norm.includes(alias)) return id;
    }

    try {
      const { results } = await db.prepare('SELECT id, code, name, short_name FROM courses WHERE university_id = ?')
        .bind(universityId || 'gtu')
        .all<{ id: string; code: string; name: string; short_name?: string }>();
      const match = (results || []).find(c => 
        normalize(c.id) === norm || 
        normalize(c.code) === norm || 
        normalize(c.name) === norm ||
        (c.short_name && normalize(c.short_name) === norm) ||
        normalize(c.name).includes(norm) ||
        norm.includes(normalize(c.name))
      );
      if (match) return match.id;

      const newCode = norm.slice(0, 16) || 'be';
      const newId = `${universityId || 'gtu'}_${newCode}`;
      await db.prepare('INSERT OR IGNORE INTO courses (id, university_id, code, name, short_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)')
        .bind(newId, universityId || 'gtu', newCode, label, newCode.toUpperCase())
        .run();
      return newId;
    } catch {
      return 'be';
    }
  }

  // 3. COLLEGES
  if (table === 'colleges') {
    const codeMatch = label.match(/\[?(\d{3})\]?/)?.[1];
    
    try {
      const { results } = await db.prepare(
        `SELECT id, college_code, name, short_name FROM colleges${universityId ? ' WHERE university_id = ?' : ''}`
      )
        .bind(...(universityId ? [universityId] : []))
        .all<{ id: string; college_code?: string; name: string; short_name?: string }>();

      let match = (results || []).find(c => {
        if (codeMatch && c.college_code === codeMatch) return true;
        if (normalize(c.id) === norm) return true;
        if (normalize(c.name) === norm) return true;
        if (c.college_code && normalize(c.college_code) === norm) return true;
        return false;
      });

      if (!match && results && results.length > 0) {
        match = results.find(c => {
          const cNorm = normalize(c.name);
          return cNorm.includes(norm) || norm.includes(cNorm);
        });
      }

      if (match) return match.id;

      // Auto-create in colleges table so the foreign key is satisfied and c.name is joined
      const effectiveCode = codeMatch || norm.slice(0, 16) || 'col';
      const colId = `col_${effectiveCode}_${norm.slice(0, 24)}`;
      await db.prepare(
        'INSERT OR IGNORE INTO colleges (id, university_id, college_code, name, short_name, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)'
      )
        .bind(colId, universityId || 'gtu', effectiveCode, label, effectiveCode)
        .run();
      return colId;
    } catch (err) {
      console.warn('Notice resolving college in D1:', err);
      try {
        const existing = await db.prepare('SELECT id FROM colleges WHERE name = ? OR college_code = ? LIMIT 1')
          .bind(label, codeMatch || norm.slice(0, 16))
          .first<{ id: string }>();
        return existing?.id || null;
      } catch {
        return null;
      }
    }
  }

  // 4. BRANCHES
  if (table === 'branches') {
    const codeMatch = label.match(/\[?(\d{1,3})\]?/)?.[1];
    const codeInt = codeMatch ? parseInt(codeMatch, 10) : null;

    try {
      const { results } = await db.prepare(
        `SELECT id, code, name, short_name FROM branches${universityId ? ' WHERE university_id = ?' : ''}`
      )
        .bind(...(universityId ? [universityId] : []))
        .all<{ id: string; code: string; name: string; short_name?: string }>();

      let match = (results || []).find(b => {
        if (codeInt !== null) {
          const bInt = parseInt(b.code, 10);
          if (!isNaN(bInt) && bInt === codeInt) return true;
          const idDigits = b.id.match(/\d+$/)?.[0];
          if (idDigits && parseInt(idDigits, 10) === codeInt) return true;
        }
        if (codeMatch && (b.code === codeMatch || b.id.endsWith(`_${codeMatch}`))) return true;
        if (normalize(b.id) === norm) return true;
        if (normalize(b.name) === norm) return true;
        if (b.code && normalize(b.code) === norm) return true;
        if (b.short_name && normalize(b.short_name) === norm) return true;
        return false;
      });

      if (!match && results && results.length > 0) {
        match = results.find(b => {
          const bNorm = normalize(b.name);
          return bNorm.includes(norm) || norm.includes(bNorm);
        });
      }

      if (match) return match.id;

      // Auto-create in branches table with 3-digit padded code if numeric
      const effectiveCode = codeInt !== null 
        ? String(codeInt).padStart(3, '0') 
        : (codeMatch || norm.slice(0, 16) || 'br');
      const brId = `gtu_be_${effectiveCode}`;
      await db.prepare(
        'INSERT OR IGNORE INTO branches (id, university_id, course_id, code, name, short_name, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)'
      )
        .bind(brId, universityId || 'gtu', courseId || 'be', effectiveCode, label, effectiveCode)
        .run();
      return brId;
    } catch (err) {
      console.warn('Notice resolving branch in D1:', err);
      try {
        const existing = await db.prepare('SELECT id FROM branches WHERE name = ? OR code = ? LIMIT 1')
          .bind(label, codeMatch || norm.slice(0, 16))
          .first<{ id: string }>();
        return existing?.id || null;
      } catch {
        return null;
      }
    }
  }

  return null;
}

export async function saveStudentProfile(
  db: D1Database,
  uid: string,
  input: Record<string, unknown>,
  extraDb?: D1Database
): Promise<void> {
  const emailInput = text(input.email);
  const user = await db.prepare(
    'SELECT id, email, display_name FROM users WHERE id = ? OR firebase_uid = ? OR (email IS NOT NULL AND LOWER(email) = LOWER(?) AND ? != "") LIMIT 1'
  ).bind(uid, uid, emailInput || '', emailInput || '').first<{ id: string; email: string; display_name: string | null }>();
  
  const email = user?.email || emailInput;
  if (!email) throw new ProfileValidationError('An authenticated email address is required');

  const existing = await db.prepare(
    'SELECT * FROM student_profiles WHERE user_id = ? OR (email IS NOT NULL AND LOWER(email) = LOWER(?) AND ? != "") LIMIT 1'
  ).bind(user?.id || uid, email, email).first<Record<string, unknown>>();
  const userId = (existing?.user_id as string) || user?.id || uid;
  const pick = (...keys: string[]) => keys.map(key => input[key]).find(value => value !== undefined);
  const name = text(pick('full_name', 'fullName', 'name')) || text(existing?.full_name) || user?.display_name || 'Student';

  const universityId = await resolveAcademicId(db, 'universities', pick('university_id', 'universityId', 'university', 'universityName') ?? existing?.university_id);
  const courseId = await resolveAcademicId(db, 'courses', pick('course_id', 'degreeId', 'degree', 'degreeName') ?? existing?.course_id, universityId);
  const collegeId = await resolveAcademicId(db, 'colleges', pick('college_id', 'college', 'collegeName') ?? existing?.college_id, universityId, courseId);
  const branchId = await resolveAcademicId(db, 'branches', pick('branch_id', 'branchId', 'branch', 'branchName') ?? existing?.branch_id, universityId, courseId);
  
  const semesterValue = pick('semester') ?? existing?.semester;
  const semester = semesterValue == null ? null : Number(semesterValue);
  if (semester !== null && (!Number.isInteger(semester) || semester < 1 || semester > 12)) {
    throw new ProfileValidationError('Semester must be between 1 and 12');
  }

  const stringFields = {
    phone_number: ['phone_number', 'phoneNumber'], 
    dob: ['dob'], 
    enrollment_number: ['enrollment_number', 'enrollmentNumber'],
    avatar_url: ['avatar_url', 'avatarUrl'], 
    marks_10th: ['marks_10th', 'marks10th'], 
    marks_12th: ['marks_12th', 'marks12th'],
    special_skills: ['special_skills', 'specialSkills'], 
    languages_known: ['languages_known', 'languagesKnown'],
    experience: ['experience'], 
    certifications: ['certifications'],
  };

  const values: Record<string, string | number | null> = {
    user_id: userId, 
    full_name: name, 
    email, 
    university_id: universityId, 
    course_id: courseId,
    college_id: collegeId, 
    branch_id: branchId, 
    semester,
  };

  for (const [column, keys] of Object.entries(stringFields)) {
    const value = pick(...keys);
    values[column] = text(value === undefined ? existing?.[column] : value);
  }

  for (const [column, keys] of Object.entries({ 
    enrollment_year: ['enrollment_year', 'enrollmentYear'], 
    graduation_year: ['graduation_year', 'graduationYear', 'expectedGraduationYear'] 
  })) {
    const value = pick(...keys) ?? existing?.[column];
    const year = value == null || value === '' ? null : Number(value);
    if (year !== null && (!Number.isInteger(year) || year < 1900 || year > 2200)) {
      throw new ProfileValidationError('Invalid academic year');
    }
    values[column] = year;
  }

  // Safe goals parsing
  const rawGoals = input.goals ?? existing?.goals ?? [];
  let parsedGoals: unknown[] = [];
  if (typeof rawGoals === 'string') {
    try {
      const parsed = JSON.parse(rawGoals);
      parsedGoals = Array.isArray(parsed) ? parsed : [String(parsed)];
    } catch {
      parsedGoals = rawGoals.trim() ? [rawGoals.trim()] : [];
    }
  } else if (Array.isArray(rawGoals)) {
    parsedGoals = rawGoals;
  }
  values.goals = JSON.stringify(parsedGoals.map(g => typeof g === 'string' ? g : JSON.stringify(g)));

  const columns = Object.keys(values);
  await db.batch([
    db.prepare(`INSERT INTO users (id, firebase_uid, email, display_name, user_type, status)
      VALUES (?, ?, ?, ?, 'student', 'active') ON CONFLICT(id) DO UPDATE SET display_name = excluded.display_name, updated_at = CURRENT_TIMESTAMP`)
      .bind(userId, uid, email, name),
    db.prepare(`INSERT INTO student_profiles (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})
      ON CONFLICT(user_id) DO UPDATE SET ${columns.filter(column => column !== 'user_id').map(column => `${column} = excluded.${column}`).join(', ')}, updated_at = CURRENT_TIMESTAMP`)
      .bind(...Object.values(values)),
  ]);

  // Sync to extraDb (ASSESSMENT_DB) if provided
  if (extraDb) {
    try {
      const collegeName = text(pick('college', 'college_name', 'collegeName'));
      const uniName = text(pick('university', 'university_name', 'universityName'));
      const branchName = text(pick('branch', 'branch_name', 'branchName'));

      await extraDb.prepare(
        `INSERT INTO student_profiles (
           user_id, name, email, phone_number, branch, semester, college, university, dob,
           marks_10th, marks_12th, special_skills, languages_known, experience, certifications,
           avatar_url, goals, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(user_id) DO UPDATE SET
           name = excluded.name,
           email = excluded.email,
           phone_number = excluded.phone_number,
           branch = COALESCE(excluded.branch, student_profiles.branch),
           semester = COALESCE(excluded.semester, student_profiles.semester),
           college = COALESCE(excluded.college, student_profiles.college),
           university = COALESCE(excluded.university, student_profiles.university),
           dob = excluded.dob,
           marks_10th = excluded.marks_10th,
           marks_12th = excluded.marks_12th,
           special_skills = excluded.special_skills,
           languages_known = excluded.languages_known,
           experience = excluded.experience,
           certifications = excluded.certifications,
           avatar_url = excluded.avatar_url,
           goals = excluded.goals,
           updated_at = CURRENT_TIMESTAMP`
      )
        .bind(
          userId, 
          name, 
          email, 
          values.phone_number, 
          branchName, 
          semester,
          collegeName, 
          uniName,
          values.dob, 
          values.marks_10th, 
          values.marks_12th, 
          values.special_skills, 
          values.languages_known,
          values.experience, 
          values.certifications, 
          values.avatar_url, 
          values.goals
        )
        .run();
    } catch (assessErr) {
      console.warn('Notice sync to assessment-db student_profiles:', assessErr);
    }
  }
}
