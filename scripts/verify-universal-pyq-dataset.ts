// ============================================================================
// VERIFICATION TEST SUITE: UNIVERSAL GTU PYQ DATASET & SCHEMA
// ============================================================================
// Performs complete in-memory SQLite dry run of:
//   1. 01_pyq_schema.sql
//   2. 02_pyq_data.sql
// Validates:
//   • Foreign key integrity (PRAGMA foreign_key_check)
//   • Universal GTU URL format compliance
//   • Query performance & canonical tree aggregation
// ============================================================================

import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';

export async function verifyUniversalPyqDataset() {
  console.log('================================================================');
  console.log('🧪 VERIFYING UNIVERSAL GTU PYQ DATASET & SCHEMA INTEGRITY');
  console.log('================================================================\n');

  const db = new DatabaseSync(':memory:');
  const root = process.cwd();

  // 1. Apply 01_pyq_schema.sql (creates all tables including universities, branches, subjects)
  console.log('Step 1: Applying 01_pyq_schema.sql...');
  const schemaSql = fs.readFileSync(path.join(root, 'data', 'pyq_universal_push', '01_pyq_schema.sql'), 'utf8');
  db.exec(schemaSql);
  console.log('✅ 01_pyq_schema.sql executed successfully.');

  // 2. Insert baseline university, branches, and subjects from export
  console.log('\nStep 2: Populating baseline university, branches, and subjects...');
  const baselineSql = fs.readFileSync(path.join(root, 'data_exports', 'keydocs', 'keydocs_full_export.sql'), 'utf8');

  db.exec('PRAGMA foreign_keys = OFF;');
  const lines = baselineSql.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (
      trimmed.startsWith('INSERT INTO "universities"') ||
      trimmed.startsWith('INSERT INTO "branches"') ||
      trimmed.startsWith('INSERT INTO "subjects"')
    ) {
      db.exec(trimmed);
    }
  }
  db.exec('PRAGMA foreign_keys = ON;');

  const univCount = (db.prepare('SELECT COUNT(*) AS c FROM universities').get() as any).c;
  const branchCount = (db.prepare('SELECT COUNT(*) AS c FROM branches').get() as any).c;
  const subjCount = (db.prepare('SELECT COUNT(*) AS c FROM subjects').get() as any).c;
  console.log(`✅ Loaded: ${univCount} university, ${branchCount} branches, ${subjCount} subjects.`);

  // 3. Apply 02_pyq_data.sql
  console.log('\nStep 3: Applying 02_pyq_data.sql (68,000+ statements)...');
  const startTime = Date.now();
  const dataSql = fs.readFileSync(path.join(root, 'data', 'pyq_universal_push', '02_pyq_data.sql'), 'utf8');
  db.exec(dataSql);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`✅ 02_pyq_data.sql loaded into SQLite in ${elapsed}s.`);

  // 4. Foreign Key Integrity Check
  console.log('\nStep 4: Checking foreign key integrity...');
  const fkViolations = db.prepare('PRAGMA foreign_key_check;').all();
  if (fkViolations.length > 0) {
    console.error('❌ Foreign key violations detected:', fkViolations.slice(0, 5));
    throw new Error(`Foreign key check failed with ${fkViolations.length} violations`);
  }
  console.log('✅ Foreign key check passed: 0 violations.');

  // 5. Verify Universal URL format
  console.log('\nStep 5: Auditing Universal GTU URL format compliance...');
  const urlCheck = db.prepare(`
    SELECT 
      COUNT(*) AS total,
      SUM(CASE WHEN file_url LIKE 'https://www.gtu.ac.in/api/v1/question-papers/archive/file/%/%/%.pdf' THEN 1 ELSE 0 END) AS valid_doc_urls
    FROM document_files
    WHERE file_type = 'paper';
  `).get() as { total: number; valid_doc_urls: number };

  console.log(`• Document Files Paper URLs Checked: ${urlCheck.total}`);
  console.log(`• Valid GTU Universal Links:        ${urlCheck.valid_doc_urls}`);
  if (urlCheck.total !== urlCheck.valid_doc_urls) {
    throw new Error('Some document_files do not match the GTU universal URL pattern!');
  }

  const gqpUrlCheck = db.prepare(`
    SELECT 
      COUNT(*) AS total,
      SUM(CASE WHEN canonical_url LIKE 'https://www.gtu.ac.in/api/v1/question-papers/archive/file/%/%/%.pdf' THEN 1 ELSE 0 END) AS valid_gqp_urls
    FROM gtu_question_papers;
  `).get() as { total: number; valid_gqp_urls: number };

  console.log(`• Canonical Question Papers Checked: ${gqpUrlCheck.total}`);
  console.log(`• Valid GTU Universal Links:        ${gqpUrlCheck.valid_gqp_urls}`);
  if (gqpUrlCheck.total !== gqpUrlCheck.valid_gqp_urls) {
    throw new Error('Some gtu_question_papers do not match the GTU universal URL pattern!');
  }
  console.log('✅ 100% of generated URLs strictly match https://www.gtu.ac.in/api/v1/question-papers/archive/file/{SESSION}/{COURSE}/{CODE}.pdf');

  // 6. Distribution & Row Count Summary
  console.log('\nStep 6: Querying database summary stats...');
  const counts = {
    documents: (db.prepare("SELECT COUNT(*) AS c FROM documents WHERE document_type = 'pyq'").get() as any).c,
    document_files: (db.prepare("SELECT COUNT(*) AS c FROM document_files WHERE file_type = 'paper'").get() as any).c,
    pyq_details: (db.prepare('SELECT COUNT(*) AS c FROM pyq_details').get() as any).c,
    document_stats: (db.prepare('SELECT COUNT(*) AS c FROM document_stats').get() as any).c,
    canonical_subjects: (db.prepare('SELECT COUNT(*) AS c FROM canonical_subjects').get() as any).c,
    gtu_subject_mappings: (db.prepare('SELECT COUNT(*) AS c FROM gtu_subject_mappings').get() as any).c,
    gtu_question_papers: (db.prepare('SELECT COUNT(*) AS c FROM gtu_question_papers').get() as any).c,
    gtu_paper_registry: (db.prepare('SELECT COUNT(*) AS c FROM gtu_paper_registry').get() as any).c,
  };

  console.log('----------------------------------------------------------------');
  console.log('📊 DATABASE ROW COUNTS SUMMARY');
  console.log('----------------------------------------------------------------');
  console.log(`• documents (type = 'pyq'):        ${counts.documents.toLocaleString()}`);
  console.log(`• document_files (type = 'paper'): ${counts.document_files.toLocaleString()}`);
  console.log(`• pyq_details:                     ${counts.pyq_details.toLocaleString()}`);
  console.log(`• document_stats:                  ${counts.document_stats.toLocaleString()}`);
  console.log(`• canonical_subjects:              ${counts.canonical_subjects.toLocaleString()}`);
  console.log(`• gtu_subject_mappings:            ${counts.gtu_subject_mappings.toLocaleString()}`);
  console.log(`• gtu_question_papers:             ${counts.gtu_question_papers.toLocaleString()}`);
  console.log(`• gtu_paper_registry:              ${counts.gtu_paper_registry.toLocaleString()}`);
  console.log('----------------------------------------------------------------');

  // 7. Test Student Academic PYQ API query
  console.log('\nStep 7: Testing simulated Student API query (Computer Eng, Sem 1/2)...');
  const sampleStudentPyqs = db.prepare(`
    SELECT
      d.id,
      d.title,
      b.name AS branch_name,
      s.semester,
      s.name AS subject_name,
      s.code AS subject_code,
      d.paper_year AS exam_year,
      d.season AS exam_season,
      paper.file_url AS question_paper_url
    FROM documents d
    JOIN branches b ON b.id = d.branch_id
    JOIN subjects s ON s.id = d.subject_id
    JOIN document_files paper ON paper.document_id = d.id AND paper.file_type = 'paper'
    WHERE d.document_type = 'pyq' AND b.slug = 'computer' AND s.semester = 2
    LIMIT 3;
  `).all();
  console.log('Sample Student Query Output:', JSON.stringify(sampleStudentPyqs, null, 2));

  // 8. Test Canonical Tree API query
  console.log('\nStep 8: Testing simulated Canonical Tree query...');
  const sampleCanonicalPapers = db.prepare(`
    SELECT 
      cs.canonical_name,
      qp.title,
      qp.subject_code,
      qp.exam_year,
      qp.exam_session,
      qp.canonical_url
    FROM gtu_question_papers qp
    JOIN canonical_subjects cs ON cs.id = qp.canonical_subject_id
    WHERE qp.branch_id = 'branch_computer'
    ORDER BY qp.exam_year DESC
    LIMIT 3;
  `).all();
  console.log('Sample Canonical Query Output:', JSON.stringify(sampleCanonicalPapers, null, 2));

  console.log('\n================================================================');
  console.log('🎉 ALL INTEGRITY CHECKS PASSED WITH ZERO ERRORS');
  console.log('================================================================\n');

  return { success: true, counts };
}

verifyUniversalPyqDataset().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
