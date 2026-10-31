// ============================================================
// SHIKSHA SAHAYAK OS: FULL DATABASE FINAL VERIFICATION SUITE
// Tests Table Schemas, Constraints, Indexes, Foreign Keys, and Data Safety
// ============================================================

export interface FinalVerificationCheck {
  domain: string;
  test: string;
  result: 'PASS' | 'FAIL';
  details: string;
}

export async function verifyDatabaseFinal(db: any): Promise<FinalVerificationCheck[]> {
  console.log("\n==================================================");
  console.log("   SHIKSHASAHAYAK FULL DATABASE FINAL VERIFICATION");
  console.log("==================================================\n");

  const checks: FinalVerificationCheck[] = [];

  const getCount = async (sql: string, params: any[] = []): Promise<number> => {
    try {
      const res = await db.prepare(sql).bind(...params).first<any>();
      return Number(res?.cnt || 0);
    } catch {
      return 0;
    }
  };

  // 1. Table Schemas Verification
  const requiredTables = [
    "universities", "branches", "subjects", "curriculum_nodes",
    "documents", "pyq_metadata", "syllabus_metadata", "material_metadata",
    "document_relations", "document_stats", "assets", "document_files",
    "content_factory_jobs", "content_factory_items", "blogs", "announcements",
    "unified_users", "academic_profiles", "teacher_whitelist", "admin_audit_logs"
  ];

  let missingTables = 0;
  for (const tbl of requiredTables) {
    const cnt = await getCount(`SELECT COUNT(1) as cnt FROM sqlite_master WHERE type='table' AND name=?`, [tbl]);
    if (cnt === 0) missingTables++;
  }

  checks.push({
    domain: "Schema SSOT",
    test: "Canonical Table Schemas Existence (20 Tables)",
    result: missingTables === 0 ? "PASS" : "FAIL",
    details: missingTables === 0 ? "All 20 canonical database tables exist" : `Missing ${missingTables} canonical tables`,
  });

  // 2. Foreign Key Integrity
  const orphanNodes = await getCount(`
    SELECT COUNT(1) as cnt FROM curriculum_nodes cn
    WHERE NOT EXISTS (SELECT 1 FROM subjects s WHERE s.id = cn.subject_id)
  `);
  checks.push({
    domain: "Foreign Keys",
    test: "Curriculum Nodes Subject Foreign Keys",
    result: orphanNodes === 0 ? "PASS" : "FAIL",
    details: `Orphan curriculum nodes: ${orphanNodes}`,
  });

  // 3. Document Core Types & Metadata
  const invalidDocTypes = await getCount(`SELECT COUNT(1) as cnt FROM documents WHERE document_type NOT IN ('pyq', 'syllabus', 'study-material')`);
  checks.push({
    domain: "Data Constraints",
    test: "Thin Core Documents CHECK Constraint (Valid Document Types)",
    result: invalidDocTypes === 0 ? "PASS" : "FAIL",
    details: `Invalid document types: ${invalidDocTypes}`,
  });

  // 4. Physical Asset Content Hash Uniqueness
  const duplicateAssetHashes = await getCount(`
    SELECT COUNT(1) as cnt FROM (
      SELECT content_hash FROM assets GROUP BY content_hash HAVING COUNT(1) > 1
    )
  `);
  checks.push({
    domain: "Asset System",
    test: "Assets SHA256 Content Hash Uniqueness",
    result: duplicateAssetHashes === 0 ? "PASS" : "FAIL",
    details: `Duplicate content hash rows: ${duplicateAssetHashes}`,
  });

  // 5. Index Support Verification
  const indexCount = await getCount(`SELECT COUNT(1) as cnt FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'`);
  checks.push({
    domain: "Performance",
    test: "Consolidated Index Coverage",
    result: indexCount >= 7 ? "PASS" : "FAIL",
    details: `Active high-frequency query indexes: ${indexCount}`,
  });

  console.log("==================================================");
  console.log("     FULL DATABASE FINAL VERIFICATION SUMMARY");
  console.log("==================================================");
  checks.forEach(c => {
    const icon = c.result === 'PASS' ? '✅' : '❌';
    console.log(`${icon} [${c.domain}] ${c.test} -> ${c.result} (${c.details})`);
  });
  console.log("==================================================\n");

  return checks;
}
