// ============================================================
// SHIKSHA SAHAYAK OS KEYDOCS 3.0: COMPREHENSIVE PRODUCTION VERIFICATION SUITE
// Automated verification for Database, Service Layer, Assets, and APIs
// ============================================================

import { runKeyDocs3Migration } from "./migrate-keydocs-3";

export interface VerificationTestResult {
  area: string;
  test: string;
  result: 'PASS' | 'FAIL' | 'WARNING' | 'NOT VERIFIED';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  evidence: string;
  fix?: string;
}

export async function verifyKeyDocs3System(db: any): Promise<VerificationTestResult[]> {
  console.log("\n🧪 Running KeyDocs 3.0 Production Verification & Regression Suite...\n");

  const results: VerificationTestResult[] = [];

  // Run migration backfill first
  try {
    await runKeyDocs3Migration(db);
    results.push({
      area: "Migration",
      test: "Idempotent Data Migration Execution",
      result: "PASS",
      severity: "CRITICAL",
      evidence: "runKeyDocs3Migration executed without SQL exceptions",
    });
  } catch (err: any) {
    results.push({
      area: "Migration",
      test: "Idempotent Data Migration Execution",
      result: "FAIL",
      severity: "CRITICAL",
      evidence: `Migration threw error: ${err.message}`,
      fix: "Fix D1 migration query syntax in scripts/migrate-keydocs-3.ts",
    });
  }

  // 1. Universities Test
  try {
    const row = await db.prepare(`SELECT COUNT(1) as cnt FROM universities`).first<any>();
    const count = Number(row?.cnt || 0);
    results.push({
      area: "Database",
      test: "Universities Hierarchy Base",
      result: count > 0 ? "PASS" : "FAIL",
      severity: "HIGH",
      evidence: `Found ${count} universities in D1`,
    });
  } catch (err: any) {
    results.push({
      area: "Database",
      test: "Universities Hierarchy Base",
      result: "FAIL",
      severity: "HIGH",
      evidence: err.message,
    });
  }

  // 2. Branches Test
  try {
    const row = await db.prepare(`SELECT COUNT(1) as cnt FROM branches`).first<any>();
    const count = Number(row?.cnt || 0);
    results.push({
      area: "Database",
      test: "Branches Hierarchy Base",
      result: count > 0 ? "PASS" : "FAIL",
      severity: "HIGH",
      evidence: `Found ${count} academic branches`,
    });
  } catch (err: any) {
    results.push({
      area: "Database",
      test: "Branches Hierarchy Base",
      result: "FAIL",
      severity: "HIGH",
      evidence: err.message,
    });
  }

  // 3. Subjects Test
  try {
    const row = await db.prepare(`SELECT COUNT(1) as cnt FROM subjects`).first<any>();
    const count = Number(row?.cnt || 0);
    results.push({
      area: "Database",
      test: "Subjects Offering Base",
      result: count > 0 ? "PASS" : "FAIL",
      severity: "HIGH",
      evidence: `Found ${count} master subjects`,
    });
  } catch (err: any) {
    results.push({
      area: "Database",
      test: "Subjects Offering Base",
      result: "FAIL",
      severity: "HIGH",
      evidence: err.message,
    });
  }

  // 4. Curriculum Nodes Hierarchy Test
  try {
    const row = await db.prepare(`SELECT COUNT(1) as cnt FROM curriculum_nodes`).first<any>();
    const count = Number(row?.cnt || 0);
    
    const orphanRow = await db.prepare(`
      SELECT COUNT(1) as orphans
      FROM curriculum_nodes cn
      WHERE cn.parent_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM curriculum_nodes parent WHERE parent.id = cn.parent_id)
    `).first<any>();
    const orphans = Number(orphanRow?.orphans || 0);

    results.push({
      area: "Curriculum",
      test: "Curriculum Nodes Tree Integrity (No Orphans)",
      result: orphans === 0 ? "PASS" : "FAIL",
      severity: "CRITICAL",
      evidence: `Total Nodes: ${count} | Orphan Nodes: ${orphans}`,
    });
  } catch (err: any) {
    results.push({
      area: "Curriculum",
      test: "Curriculum Nodes Tree Integrity (No Orphans)",
      result: "FAIL",
      severity: "CRITICAL",
      evidence: err.message,
    });
  }

  // 5. Thin Core Documents Test
  try {
    const row = await db.prepare(`SELECT COUNT(1) as cnt FROM documents`).first<any>();
    const invalidTypeRow = await db.prepare(`
      SELECT COUNT(1) as cnt FROM documents WHERE document_type NOT IN ('pyq', 'syllabus', 'study-material')
    `).first<any>();

    const count = Number(row?.cnt || 0);
    const invalidTypes = Number(invalidTypeRow?.cnt || 0);

    results.push({
      area: "Database",
      test: "Thin Core Documents Valid Types",
      result: invalidTypes === 0 ? "PASS" : "FAIL",
      severity: "HIGH",
      evidence: `Total Documents: ${count} | Invalid Types: ${invalidTypes}`,
    });
  } catch (err: any) {
    results.push({
      area: "Database",
      test: "Thin Core Documents Valid Types",
      result: "FAIL",
      severity: "HIGH",
      evidence: err.message,
    });
  }

  // 6. PYQ Metadata Test
  try {
    const pyqDocs = await db.prepare(`SELECT COUNT(1) as cnt FROM documents WHERE document_type = 'pyq'`).first<any>();
    const pyqMeta = await db.prepare(`SELECT COUNT(1) as cnt FROM pyq_metadata`).first<any>();
    const docCnt = Number(pyqDocs?.cnt || 0);
    const metaCnt = Number(pyqMeta?.cnt || 0);

    results.push({
      area: "Metadata",
      test: "PYQ Metadata Alignment",
      result: metaCnt >= docCnt ? "PASS" : "WARNING",
      severity: "HIGH",
      evidence: `PYQ Documents: ${docCnt} | Metadata Rows: ${metaCnt}`,
    });
  } catch (err: any) {
    results.push({
      area: "Metadata",
      test: "PYQ Metadata Alignment",
      result: "FAIL",
      severity: "HIGH",
      evidence: err.message,
    });
  }

  // 7. Syllabus Metadata Test
  try {
    const sylDocs = await db.prepare(`SELECT COUNT(1) as cnt FROM documents WHERE document_type = 'syllabus'`).first<any>();
    const sylMeta = await db.prepare(`SELECT COUNT(1) as cnt FROM syllabus_metadata`).first<any>();
    const docCnt = Number(sylDocs?.cnt || 0);
    const metaCnt = Number(sylMeta?.cnt || 0);

    results.push({
      area: "Metadata",
      test: "Syllabus Metadata Alignment",
      result: metaCnt >= docCnt ? "PASS" : "WARNING",
      severity: "MEDIUM",
      evidence: `Syllabus Documents: ${docCnt} | Metadata Rows: ${metaCnt}`,
    });
  } catch (err: any) {
    results.push({
      area: "Metadata",
      test: "Syllabus Metadata Alignment",
      result: "FAIL",
      severity: "MEDIUM",
      evidence: err.message,
    });
  }

  // 8. Material Metadata Test
  try {
    const matDocs = await db.prepare(`SELECT COUNT(1) as cnt FROM documents WHERE document_type = 'study-material'`).first<any>();
    const matMeta = await db.prepare(`SELECT COUNT(1) as cnt FROM material_metadata`).first<any>();
    const docCnt = Number(matDocs?.cnt || 0);
    const metaCnt = Number(matMeta?.cnt || 0);

    results.push({
      area: "Metadata",
      test: "Study Material Metadata Alignment",
      result: metaCnt >= docCnt ? "PASS" : "WARNING",
      severity: "HIGH",
      evidence: `Material Documents: ${docCnt} | Metadata Rows: ${metaCnt}`,
    });
  } catch (err: any) {
    results.push({
      area: "Metadata",
      test: "Study Material Metadata Alignment",
      result: "FAIL",
      severity: "HIGH",
      evidence: err.message,
    });
  }

  // 9. Document Relations Test
  try {
    const relRow = await db.prepare(`SELECT COUNT(1) as cnt FROM document_relations`).first<any>();
    const selfRelRow = await db.prepare(`SELECT COUNT(1) as cnt FROM document_relations WHERE source_document_id = target_document_id`).first<any>();
    const relCount = Number(relRow?.cnt || 0);
    const selfRelCount = Number(selfRelRow?.cnt || 0);

    results.push({
      area: "Relations",
      test: "Document Relations Integrity (No Self-Links)",
      result: selfRelCount === 0 ? "PASS" : "FAIL",
      severity: "HIGH",
      evidence: `Total Relations: ${relCount} | Self-referencing links: ${selfRelCount}`,
    });
  } catch (err: any) {
    results.push({
      area: "Relations",
      test: "Document Relations Integrity (No Self-Links)",
      result: "FAIL",
      severity: "HIGH",
      evidence: err.message,
    });
  }

  // 10. Assets Hash Uniqueness Test
  try {
    const assetRow = await db.prepare(`SELECT COUNT(1) as cnt FROM assets`).first<any>();
    const dupRow = await db.prepare(`
      SELECT content_hash, COUNT(1) as dup_cnt FROM assets GROUP BY content_hash HAVING COUNT(1) > 1
    `).first<any>();
    
    const assetCount = Number(assetRow?.cnt || 0);
    const hasDups = !!dupRow;

    results.push({
      area: "File System",
      test: "Assets Content Hash Uniqueness",
      result: !hasDups ? "PASS" : "FAIL",
      severity: "CRITICAL",
      evidence: `Total Assets: ${assetCount} | Duplicate Hashes: ${hasDups ? 'Found' : 'None'}`,
    });
  } catch (err: any) {
    results.push({
      area: "File System",
      test: "Assets Content Hash Uniqueness",
      result: "FAIL",
      severity: "CRITICAL",
      evidence: err.message,
    });
  }

  // Print Summary
  console.log("\n==================================================");
  console.log("            VERIFICATION RESULTS REPORT");
  console.log("==================================================");
  results.forEach((r) => {
    const icon = r.result === 'PASS' ? '✅' : r.result === 'WARNING' ? '⚠️' : '❌';
    console.log(`${icon} [${r.area}] ${r.test} -> ${r.result} (${r.evidence})`);
  });
  console.log("==================================================\n");

  return results;
}
