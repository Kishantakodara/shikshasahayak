import { COLLEGES } from '../src/config/colleges';
import { BRANCHES } from '../src/config/branches';
import { TECHNICAL_UNIVERSITIES } from '../src/config/universities';
import * as fs from 'fs';
import * as path from 'path';

// 1. Generate SQL for universities
const uniStatements = TECHNICAL_UNIVERSITIES.map(u => {
  const safeName = u.name.replace(/'/g, "''");
  const safeShort = (u.shortName || '').replace(/'/g, "''");
  return `INSERT OR IGNORE INTO universities (id, name, short_name, created_at, updated_at) VALUES ('${u.id}', '${safeName}', '${safeShort}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`;
});

// 2. Generate SQL for courses
const courseList = [
  { code: 'be', name: 'Bachelor of Engineering (B.E. / B.Tech)', short: 'B.E.' },
  { code: 'me', name: 'Master of Engineering (M.E. / M.Tech)', short: 'M.E.' },
  { code: 'diploma', name: 'Diploma Engineering', short: 'Diploma' },
  { code: 'mca', name: 'Master of Computer Applications', short: 'MCA' },
  { code: 'bca', name: 'Bachelor of Computer Applications', short: 'BCA' },
  { code: 'bpharm', name: 'Bachelor of Pharmacy', short: 'B.Pharm' },
];

const courseStatements = courseList.map(c => {
  const safeName = c.name.replace(/'/g, "''");
  return `INSERT OR IGNORE INTO courses (id, university_id, code, name, short_name, created_at, updated_at) VALUES ('${c.code}', 'gtu', '${c.code}', '${safeName}', '${c.short}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`;
});

// 3. Generate SQL for colleges
const collegeStatements = COLLEGES.map(c => {
  const safeName = c.name.replace(/'/g, "''");
  const id = `gtu_col_${c.code}`;
  return `INSERT OR IGNORE INTO colleges (id, university_id, college_code, name, short_name, is_active, created_at, updated_at) VALUES ('${id}', 'gtu', '${c.code}', '${safeName}', '${c.code}', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`;
});

// 4. Generate SQL for branches
const branchStatements = BRANCHES.map(b => {
  const safeName = b.name.replace(/'/g, "''");
  const id = `gtu_be_${b.code}`;
  return `INSERT OR IGNORE INTO branches (id, university_id, course_id, code, name, short_name, is_active, created_at, updated_at) VALUES ('${id}', 'gtu', 'be', '${b.code}', '${safeName}', '${b.code}', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`;
});

const allSql = [
  '-- SEED CORE MASTER DATA (Universities, Courses, Colleges, Branches)',
  ...uniStatements,
  ...courseStatements,
  ...collegeStatements,
  ...branchStatements,
].join('\n');

const outPath = path.resolve('./data/seed_colleges_core.sql');
fs.writeFileSync(outPath, allSql, 'utf-8');
console.log(`Generated ${collegeStatements.length} colleges, ${branchStatements.length} branches, ${uniStatements.length} universities into ${outPath}`);
