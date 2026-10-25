import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

// Locate local D1 SQLite file
const d1Dir = path.join(process.cwd(), '.wrangler/state/v3/d1');

function findD1DbFile(dir: string): string | null {
  if (!fs.existsSync(dir)) return null;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = findD1DbFile(full);
      if (found) return found;
    } else if (entry.name.endsWith('.sqlite')) {
      return full;
    }
  }
  return null;
}

const dbPath = findD1DbFile(d1Dir);
console.log('Found local D1 SQLite file:', dbPath);

if (!dbPath) {
  console.log('No local .wrangler D1 SQLite file found (skipping local db inspection test)');
  process.exit(0);
}

const db = new DatabaseSync(dbPath);

const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='branches'").get();
if (!tableCheck) {
  console.log('Local D1 sqlite database does not have tables applied yet (skipping raw SQL test)');
  process.exit(0);
}

console.log('\n--- 1. Testing Subject Browse Query (/api/branches/computer/semesters/5/subjects/computer-networks) ---');
const branch = db.prepare(`SELECT id, name, slug, short_name FROM branches WHERE slug = ? OR id = ?`).get('computer', 'computer');
console.log('Branch:', branch);

if (branch) {
  const offering = db.prepare(`
    SELECT
      s.id AS offering_id,
      s.semester AS semester,
      'branch_core' AS subject_group,
      s.id AS subject_id,
      s.code AS subject_code,
      s.name AS subject_name,
      s.slug AS subject_slug
    FROM subjects s
    WHERE s.branch_id = ?
      AND s.semester = ?
      AND (s.slug = ? OR s.id = ?)
  `).get((branch as any).id, 5, 'computer-networks', 'computer-networks');
  console.log('Offering:', offering);
}

const otherMaterials = db.prepare(`
  SELECT d.id, d.title, d.document_type AS material_type, cf.unit_no, cf.topic, cf.raw_markdown, d.created_at
  FROM documents d
  LEFT JOIN content_factory_items cf ON cf.published_document_id = d.id
  WHERE d.subject_id = ?
    AND d.document_type = 'study-material'
    AND d.approval_status = 'approved'
  ORDER BY d.created_at DESC
`).all((offering as any).subject_id);

console.log('Materials Found:', otherMaterials.length);
otherMaterials.forEach((m: any, i) => {
  console.log(`[${i + 1}] ID: ${m.id} | Title: ${m.title} | Unit: ${m.unit_no} | Markdown length: ${m.raw_markdown?.length || 0}`);
});

console.log('\n--- 2. Testing Material Detail Query (/api/materials/:id) for Topic 1 ---');
const doc1 = db.prepare(`
  SELECT
    d.*,
    d.document_type AS material_type,
    u.name AS university,
    b.name AS branch_name,
    b.short_name AS branch_short_name,
    b.slug AS branch_slug,
    s.name AS subject_name,
    s.code AS subject_code,
    s.slug AS subject_slug,
    s.semester AS semester_no,
    cf.raw_markdown AS raw_markdown
  FROM documents d
  LEFT JOIN universities u ON u.id = d.university_id
  LEFT JOIN branches b ON b.id = d.branch_id
  LEFT JOIN subjects s ON s.id = d.subject_id
  LEFT JOIN content_factory_items cf ON cf.published_document_id = d.id
  WHERE d.id = ?
`).get('doc_pilot_cn_1');

console.log('Document 1 Detail:', {
  id: (doc1 as any)?.id,
  title: (doc1 as any)?.title,
  branch_name: (doc1 as any)?.branch_name,
  semester: (doc1 as any)?.semester_no,
  subject_name: (doc1 as any)?.subject_name,
  raw_markdown_length: (doc1 as any)?.raw_markdown?.length
});
