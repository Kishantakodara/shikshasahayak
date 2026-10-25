import { getPilotSeedData } from './pilot-seed-data';
import fs from 'fs';
import path from 'path';

const { subject, items } = getPilotSeedData();

let sql = `-- Pilot Content GTU Computer Engineering Sem 5 Computer Networks\n`;

// Ensure subject exists
sql += `INSERT OR IGNORE INTO subjects (id, university_id, branch_id, semester, name, code, slug)
VALUES ('${subject.id}', '${subject.university_id}', '${subject.branch_id}', ${subject.semester}, '${subject.name}', '${subject.code}', '${subject.slug}');\n\n`;

items.forEach(item => {
  const safeMarkdown = item.markdown.replace(/'/g, "''");
  const safeJson = JSON.stringify(item.payload).replace(/'/g, "''");
  const safeValidation = JSON.stringify({
    issues: item.validation.issues,
    warnings: item.validation.warnings,
    flags: item.validation.qualityReviewFlags
  }).replace(/'/g, "''");

  // Insert or update document
  sql += `INSERT OR REPLACE INTO documents (
    id, document_type, university_id, branch_id, semester, subject_id,
    title, description, approval_status,
    uploaded_by, approved_by, approved_at, created_at, updated_at
  ) VALUES (
    '${item.docId}', 'study-material', '${item.universityId}', '${item.branchId}', ${item.semester}, '${item.subjectId}',
    '${item.title.replace(/'/g, "''")}', '${item.description.replace(/'/g, "''")}', 'approved',
    'admin@shikshasahayak.org', 'admin@shikshasahayak.org', datetime('now'), datetime('now'), datetime('now')
  );\n`;

  // Insert or update content_factory_items
  sql += `INSERT OR REPLACE INTO content_factory_items (
    id, university_id, branch_id, semester, subject_id, unit_no, unit_title, topic,
    content_type, structured_content, raw_markdown, status, validation_status,
    validation_notes, published_document_id, created_at, updated_at
  ) VALUES (
    '${item.cfId}', '${item.universityId}', '${item.branchId}', ${item.semester}, '${item.subjectId}', ${item.unitNo}, 'Unit 1: Introduction to Computer Networks', '${item.topic.replace(/'/g, "''")}',
    'full_bundle', '${safeJson}', '${safeMarkdown}', 'PUBLISHED', 'valid',
    '${safeValidation}', '${item.docId}', datetime('now'), datetime('now')
  );\n\n`;
});

const outDir = path.join(process.cwd(), 'scratch');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}
const outPath = path.join(outDir, 'seed_pilot.sql');
fs.writeFileSync(outPath, sql);
console.log(`Generated SQL to ${outPath}`);
