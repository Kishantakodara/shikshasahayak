import fs from 'fs';
import path from 'path';

const tablesDir = path.join(process.cwd(), 'data_exports', 'keydocs', 'tables');
const outputFile = path.join(process.cwd(), 'shiksha-core-seed-keydocs.sql');

function readTable(name) {
  const p = path.join(tablesDir, `${name}.json`);
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function sqlEscape(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val;
  if (typeof val === 'boolean') return val ? 1 : 0;
  return `'${String(val).replace(/'/g, "''")}'`;
}

console.log('Generating seed SQL for shiksha-core-db...');
let sql = `-- ============================================================================
-- PADHAKU CORE DB - SEED & MIGRATION SCRIPT (FROM KEYDOCS)
-- Generated: ${new Date().toISOString()}
-- Target Database: shiksha-core-db (4e63a42b-1271-462f-8271-da47cf659139)
-- ============================================================================

PRAGMA foreign_keys = OFF;

`;

// 1. IDENTITY: users, user_roles, teacher_profiles
console.log('1. Processing Identity...');
const users = readTable('unified_users');
sql += `-- 1. IDENTITY & ACCESS\n`;

for (const u of users) {
  sql += `INSERT OR REPLACE INTO users (id, firebase_uid, email, display_name, user_type, status, created_at, updated_at) VALUES (
  ${sqlEscape(u.id)},
  ${sqlEscape(u.uid || u.id)},
  ${sqlEscape(u.email)},
  ${sqlEscape(u.display_name)},
  ${sqlEscape(u.user_type || 'student')},
  ${sqlEscape(u.status || 'active')},
  ${sqlEscape(u.created_at || "datetime('now')")},
  ${sqlEscape(u.updated_at || "datetime('now')")}
);\n`;

  // Seed default roles
  sql += `INSERT OR REPLACE INTO user_roles (id, user_id, role, granted_by, granted_at) VALUES (
  'role_teacher_${u.id}',
  ${sqlEscape(u.id)},
  'teacher',
  ${sqlEscape(u.id)},
  ${sqlEscape(u.created_at || "datetime('now')")}
);\n`;

  sql += `INSERT OR REPLACE INTO user_roles (id, user_id, role, granted_by, granted_at) VALUES (
  'role_admin_${u.id}',
  ${sqlEscape(u.id)},
  'admin',
  ${sqlEscape(u.id)},
  ${sqlEscape(u.created_at || "datetime('now')")}
);\n`;
}

const teacherProfiles = readTable('teacher_profiles');
for (const tp of teacherProfiles) {
  sql += `INSERT OR REPLACE INTO teacher_profiles (user_id, full_name, institution, department, designation, subjects_json, branches_json, semesters_json, is_onboarded, created_at, updated_at) VALUES (
  ${sqlEscape(tp.user_id)},
  ${sqlEscape(tp.full_name)},
  ${sqlEscape(tp.institution)},
  ${sqlEscape(tp.department)},
  ${sqlEscape(tp.designation)},
  ${sqlEscape(tp.subjects_json)},
  ${sqlEscape(tp.branches_json)},
  ${sqlEscape(tp.semesters_json)},
  ${tp.is_onboarded ? 1 : 0},
  ${sqlEscape(tp.created_at || "datetime('now')")},
  ${sqlEscape(tp.updated_at || "datetime('now')")}
);\n`;
}

// 2. ACADEMIC MASTER DATA
console.log('2. Processing Academic Master Data...');
sql += `\n-- 2. ACADEMIC MASTER DATA\n`;

// Universities
sql += `INSERT OR REPLACE INTO universities (id, name, short_name, created_at, updated_at) VALUES (
  'gtu',
  'Gujarat Technological University',
  'GTU',
  '2026-06-07 17:41:59',
  '2026-06-07 17:41:59'
);\n`;

// Courses (Mandatory for GTU branches)
sql += `INSERT OR REPLACE INTO courses (id, university_id, code, name, short_name, level, created_at, updated_at) VALUES (
  'gtu_be',
  'gtu',
  'BE',
  'Bachelor of Engineering',
  'BE',
  'undergraduate',
  '2026-06-07 17:41:59',
  '2026-06-07 17:41:59'
);\n`;

// Branch mapping lookup
const branchMap = {
  'branch_computer': 'gtu_be_007',
  'branch_it': 'gtu_be_016',
  'branch_electrical': 'gtu_be_009',
  'branch_ece': 'gtu_be_011',
  'branch_mechanical': 'gtu_be_019',
  'branch_civil': 'gtu_be_006',
  'branch_chemical': 'gtu_be_005'
};

const rawBranches = readTable('branches');
for (const b of rawBranches) {
  const newId = branchMap[b.id] || `gtu_be_${String(b.Code).padStart(3, '0')}`;
  const paddedCode = String(b.Code).padStart(3, '0');

  sql += `INSERT OR REPLACE INTO branches (id, university_id, course_id, code, name, short_name, display_order, is_active, created_at, updated_at) VALUES (
  ${sqlEscape(newId)},
  'gtu',
  'gtu_be',
  ${sqlEscape(paddedCode)},
  ${sqlEscape(b.name)},
  ${sqlEscape(b.short_name)},
  ${b.Code},
  ${b.is_active ? 1 : 0},
  ${sqlEscape(b.created_at || "datetime('now')")},
  ${sqlEscape(b.updated_at || "datetime('now')")}
);\n`;
}

// Subjects
const rawSubjects = readTable('subjects');
console.log(`Mapping ${rawSubjects.length} subjects...`);
for (const s of rawSubjects) {
  const newBranchId = branchMap[s.branch_id] || s.branch_id;
  sql += `INSERT OR REPLACE INTO subjects (id, university_id, branch_id, semester, name, code, subject_group_id, wef_year, created_at, updated_at) VALUES (
  ${sqlEscape(s.id)},
  'gtu',
  ${sqlEscape(newBranchId)},
  ${s.semester || 1},
  ${sqlEscape(s.name)},
  ${sqlEscape(s.code)},
  ${sqlEscape(s.subject_group_id)},
  ${sqlEscape(s.wef_year)},
  ${sqlEscape(s.created_at || "datetime('now')")},
  ${sqlEscape(s.updated_at || "datetime('now')")}
);\n`;
}

// 3. STORAGE & CONTENT
console.log('3. Processing Storage & Content...');
sql += `\n-- 3. STORAGE & CONTENT\n`;

// File Assets
const rawAssets = readTable('file_assets');
console.log(`Mapping ${rawAssets.length} file assets...`);
for (const a of rawAssets) {
  sql += `INSERT OR REPLACE INTO file_assets (id, content_hash, original_filename, storage_key, mime_type, size_bytes, created_at) VALUES (
  ${sqlEscape(a.id)},
  ${sqlEscape(a.content_hash)},
  ${sqlEscape(a.original_filename)},
  ${sqlEscape(a.storage_key)},
  ${sqlEscape(a.mime_type)},
  ${a.size_bytes || 0},
  ${sqlEscape(a.created_at || "datetime('now')")}
);\n`;
}

// Blogs
const rawBlogs = readTable('blogs');
console.log(`Mapping ${rawBlogs.length} blogs...`);
for (const b of rawBlogs) {
  sql += `INSERT OR REPLACE INTO blogs (id, related_document_id, title, content, author, category, tags, thumbnail, status, views, created_at, updated_at) VALUES (
  ${sqlEscape(b.id)},
  ${sqlEscape(b.related_document_id)},
  ${sqlEscape(b.title)},
  ${sqlEscape(b.content)},
  ${sqlEscape(b.author)},
  ${sqlEscape(b.category)},
  ${sqlEscape(b.tags)},
  ${sqlEscape(b.thumbnail)},
  ${sqlEscape(b.status || 'published')},
  ${b.views || 0},
  ${sqlEscape(b.created_at || "datetime('now')")},
  ${sqlEscape(b.updated_at || "datetime('now')")}
);\n`;
}

// Documents
const rawDocuments = readTable('documents');
console.log(`Mapping ${rawDocuments.length} documents...`);
for (const d of rawDocuments) {
  const newBranchId = branchMap[d.branch_id] || d.branch_id;
  const adminUserId = '0tpV07mBfhMdbaqoPSIVKVEZNNt2';

  sql += `INSERT OR REPLACE INTO documents (id, document_type, university_id, branch_id, semester, subject_id, title, description, approval_status, uploaded_by, approved_by, approved_at, blog_id, parent_document_id, paper_year, season, exam_label, syllabus_year, regulation, version_label, material_kind, unit_no, chapter, topic, author, created_at, updated_at) VALUES (
  ${sqlEscape(d.id)},
  ${sqlEscape(d.document_type)},
  'gtu',
  ${sqlEscape(newBranchId)},
  ${d.semester || 1},
  ${sqlEscape(d.subject_id)},
  ${sqlEscape(d.title)},
  ${sqlEscape(d.description)},
  ${sqlEscape(d.approval_status || 'approved')},
  ${sqlEscape(adminUserId)},
  ${sqlEscape(adminUserId)},
  ${sqlEscape(d.approved_at)},
  ${sqlEscape(d.blog_id)},
  ${sqlEscape(d.parent_document_id)},
  ${sqlEscape(d.paper_year)},
  ${sqlEscape(d.season)},
  ${sqlEscape(d.exam_label)},
  ${sqlEscape(d.syllabus_year)},
  ${sqlEscape(d.regulation)},
  ${sqlEscape(d.version_label)},
  ${sqlEscape(d.material_kind)},
  ${sqlEscape(d.unit_no)},
  ${sqlEscape(d.chapter)},
  ${sqlEscape(d.topic)},
  ${sqlEscape(d.author)},
  ${sqlEscape(d.created_at || "datetime('now')")},
  ${sqlEscape(d.updated_at || "datetime('now')")}
);\n`;
}

// Document Files
const rawDocFiles = readTable('document_files');
console.log(`Mapping ${rawDocFiles.length} document files...`);
for (const f of rawDocFiles) {
  sql += `INSERT OR REPLACE INTO document_files (id, document_id, file_type, storage_key, file_url, mime_type, size_bytes, is_primary, file_asset_id, original_filename, created_at) VALUES (
  ${sqlEscape(f.id)},
  ${sqlEscape(f.document_id)},
  ${sqlEscape(f.file_type)},
  ${sqlEscape(f.storage_key)},
  ${sqlEscape(f.file_url)},
  ${sqlEscape(f.mime_type)},
  ${f.size_bytes || 0},
  ${f.is_primary ? 1 : 0},
  ${sqlEscape(f.file_asset_id)},
  ${sqlEscape(f.original_filename)},
  ${sqlEscape(f.created_at || "datetime('now')")}
);\n`;
}

// Document Stats
const rawStats = readTable('document_stats');
console.log(`Mapping ${rawStats.length} document stats...`);
for (const st of rawStats) {
  sql += `INSERT OR REPLACE INTO document_stats (document_id, views, likes, downloads, updated_at) VALUES (
  ${sqlEscape(st.document_id)},
  ${st.views || 0},
  ${st.likes || 0},
  ${st.downloads || 0},
  ${sqlEscape(st.updated_at || "datetime('now')")}
);\n`;
}

// Detail Tables
const pyqDetails = readTable('pyq_details');
for (const p of pyqDetails) {
  sql += `INSERT OR REPLACE INTO pyq_details (document_id, paper_year, season, exam_label) VALUES (
  ${sqlEscape(p.document_id)},
  ${sqlEscape(p.paper_year)},
  ${sqlEscape(p.season)},
  ${sqlEscape(p.exam_label)}
);\n`;
}

const syllabusDetails = readTable('syllabus_details');
for (const s of syllabusDetails) {
  sql += `INSERT OR REPLACE INTO syllabus_details (document_id, syllabus_year, regulation, version_label) VALUES (
  ${sqlEscape(s.document_id)},
  ${sqlEscape(s.syllabus_year)},
  ${sqlEscape(s.regulation)},
  ${sqlEscape(s.version_label)}
);\n`;
}

const studyDetails = readTable('study_material_details');
for (const m of studyDetails) {
  sql += `INSERT OR REPLACE INTO study_material_details (document_id, material_kind, unit_no, chapter, topic) VALUES (
  ${sqlEscape(m.document_id)},
  ${sqlEscape(m.material_kind)},
  ${sqlEscape(m.unit_no)},
  ${sqlEscape(m.chapter)},
  ${sqlEscape(m.topic)}
);\n`;
}

// 4. PLATFORM & ADMIN
console.log('4. Processing Platform & Admin...');
sql += `\n-- 4. PLATFORM & ADMIN\n`;

// Website popups
const popups = readTable('website_popups');
for (const p of popups) {
  sql += `INSERT OR REPLACE INTO website_popups (id, title, type, html_content, is_active, start_date, end_date, frequency, expiry_days, created_at, updated_at) VALUES (
  ${sqlEscape(p.id)},
  ${sqlEscape(p.title)},
  ${sqlEscape(p.type)},
  ${sqlEscape(p.html_content)},
  ${p.is_active ? 1 : 0},
  ${sqlEscape(p.start_date)},
  ${sqlEscape(p.end_date)},
  ${sqlEscape(p.frequency)},
  ${p.expiry_days || 7},
  ${sqlEscape(p.created_at || "datetime('now')")},
  ${sqlEscape(p.updated_at || "datetime('now')")}
);\n`;
}

// Announcements
const announcements = readTable('announcements');
for (const an of announcements) {
  sql += `INSERT OR REPLACE INTO announcements (id, created_by, class_id, title, content, priority, target_audience, channels, attachments, is_published, published_at, created_at, updated_at) VALUES (
  ${sqlEscape(an.id)},
  '0tpV07mBfhMdbaqoPSIVKVEZNNt2',
  NULL,
  '1st Year All PYQs Announcement',
  ${sqlEscape(an.text)},
  'normal',
  'all',
  'web',
  NULL,
  1,
  ${sqlEscape(an.created_at || "datetime('now')")},
  ${sqlEscape(an.created_at || "datetime('now')")},
  ${sqlEscape(an.created_at || "datetime('now')")}
);\n`;
}

// Bug Reports
const bugReports = readTable('bug_reports');
for (const br of bugReports) {
  sql += `INSERT OR REPLACE INTO bug_reports (id, user_email, description, screenshot_url, error_stack, browser_info, status, created_at, updated_at) VALUES (
  ${sqlEscape(br.id)},
  ${sqlEscape(br.user_email)},
  ${sqlEscape(br.description)},
  ${sqlEscape(br.screenshot_url)},
  ${sqlEscape(br.error_stack)},
  ${sqlEscape(br.browser_info)},
  ${sqlEscape(br.status || 'pending')},
  ${sqlEscape(br.created_at || "datetime('now')")},
  ${sqlEscape(br.updated_at || "datetime('now')")}
);\n`;
}

// Admin Audit Logs
const auditLogs = readTable('admin_audit_logs');
for (const al of auditLogs) {
  sql += `INSERT OR REPLACE INTO admin_audit_logs (id, admin_id, action, resource_type, resource_id, details, ip_address, created_at, details_json) VALUES (
  ${sqlEscape(al.id)},
  ${sqlEscape(al.admin_id)},
  ${sqlEscape(al.action)},
  ${sqlEscape(al.resource_type)},
  ${sqlEscape(al.resource_id)},
  ${sqlEscape(al.details)},
  ${sqlEscape(al.ip_address)},
  ${sqlEscape(al.created_at || "datetime('now')")},
  ${sqlEscape(al.details_json)}
);\n`;
}

// 5. QUESTIONS & QUIZZES (167 MCQs grouped into canonical subject unit quizzes)
console.log('5. Processing Quizzes & Questions...');
sql += `\n-- 5. QUIZZES & QUESTIONS\n`;
const questions = readTable('master_question_bank');

// Group questions by subject_code and unit_no
const quizGroups = {};
for (const q of questions) {
  const subjectCode = q.subject_code || 'GTU';
  const unitNo = q.unit_no || 1;
  const quizId = `quiz_${subjectCode}_u${unitNo}`;
  if (!quizGroups[quizId]) {
    quizGroups[quizId] = {
      id: quizId,
      subjectCode: subjectCode,
      subjectName: q.subject_name || 'Engineering',
      unitNo: unitNo,
      questions: []
    };
  }
  quizGroups[quizId].questions.push(q);
}

for (const [quizId, g] of Object.entries(quizGroups)) {
  sql += `INSERT OR REPLACE INTO quizzes (id, subject_id, title, code, category, duration, questions_count, difficulty, xp_reward, published, created_at, updated_at) VALUES (
  ${sqlEscape(quizId)},
  NULL,
  ${sqlEscape(`GTU ${g.subjectCode} - Unit ${g.unitNo} Practice Quiz`)},
  ${sqlEscape(g.subjectCode)},
  'practice',
  15,
  ${g.questions.length},
  'medium',
  ${g.questions.length * 10},
  1,
  datetime('now'),
  datetime('now')
);\n`;

  for (const q of g.questions) {
    let optStr = q.options_json;
    // Map answer letter to integer index
    let correctIdx = 0;
    try {
      const rawAns = JSON.parse(q.correct_answer_json);
      if (typeof rawAns === 'string') {
        const letter = rawAns.trim().toUpperCase();
        if (letter === 'A') correctIdx = 0;
        else if (letter === 'B') correctIdx = 1;
        else if (letter === 'C') correctIdx = 2;
        else if (letter === 'D') correctIdx = 3;
      } else if (typeof rawAns === 'number') {
        correctIdx = rawAns;
      }
    } catch {
      correctIdx = 0;
    }

    sql += `INSERT OR REPLACE INTO questions (id, quiz_id, question, options, correct_answer, explanation, created_at) VALUES (
  ${sqlEscape(q.id)},
  ${sqlEscape(quizId)},
  ${sqlEscape(q.question_text)},
  ${sqlEscape(optStr)},
  ${correctIdx},
  ${sqlEscape(q.explanation)},
  ${sqlEscape(q.created_at || "datetime('now')")}
);\n`;
  }
}

sql += `\nPRAGMA foreign_keys = ON;\n`;

fs.writeFileSync(outputFile, sql, 'utf8');
console.log(`Generated ${outputFile} successfully! Size: ${fs.statSync(outputFile).size} bytes.`);
