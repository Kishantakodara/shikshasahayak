import { execSync } from 'child_process';

const keyTables = [
  'unified_users',
  'academic_profiles',
  'student_academic_profiles',
  'teacher_whitelist',
  'teacher_profiles',
  'user_beta_access',
  'user_entitlements',
  'universities',
  'branches',
  'subjects',
  'curriculum_nodes',
  'documents',
  'pyq_metadata',
  'syllabus_metadata',
  'material_metadata',
  'document_files',
  'assets',
  'document_relations',
  'document_stats',
  'blogs'
];

const batchCountSql = keyTables.map(t => `SELECT '${t}' as table_name, COUNT(*) as count FROM ${t};`).join(' ');

console.log('Querying remote D1 row counts...');
const outputStr = execSync(
  `npx wrangler d1 execute DB --remote --command="${batchCountSql}" --json`,
  { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
);

const parsed = JSON.parse(outputStr);
const counts: Record<string, number> = {};

for (let i = 0; i < keyTables.length; i++) {
  const row = parsed[i]?.results?.[0];
  if (row) {
    counts[row.table_name] = Number(row.count);
  }
}

console.log('--- REMOTE D1 DATA PRESERVATION ROW COUNTS ---');
console.log(JSON.stringify(counts, null, 2));
