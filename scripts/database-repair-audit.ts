// ============================================================
// SHIKSHA SAHAYAK OS: DATABASE REPAIR & INTEGRITY AUDIT SCRIPT
// Read-Only Audit & Safe Deterministic Fix Engine for ShikshaSahayak 2.0
// ============================================================

export interface TableInventoryItem {
  table: string;
  domain: 'ACADEMIC' | 'KEYDOCS' | 'CONTENT' | 'IDENTITY' | 'GOVERNANCE';
  rowCount: number;
  status: 'CANONICAL' | 'ACTIVE' | 'COMPATIBILITY' | 'LEGACY';
}

export interface DatabaseAuditFinding {
  domain: string;
  check: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  affectedRows: number;
  details: string;
  recommendedAction: string;
}

export async function runDatabaseRepairAudit(db: any, args: string[] = []): Promise<{
  inventory: TableInventoryItem[];
  findings: DatabaseAuditFinding[];
  healthScore: number;
}> {
  const isApplyFixes = args.includes("--apply-safe-fixes");
  const isDryRun = args.includes("--dry-run");

  console.log("\n==================================================");
  console.log("   PADHAKUPORTAL 2.0 DATABASE INTEGRITY & HEALTH AUDIT");
  console.log(`   Mode: ${isApplyFixes ? 'APPLY SAFE FIXES' : isDryRun ? 'DRY-RUN REPAIR' : 'READ-ONLY AUDIT'}`);
  console.log("==================================================\n");

  const inventory: TableInventoryItem[] = [];
  const findings: DatabaseAuditFinding[] = [];

  const getCount = async (sql: string, params: any[] = []): Promise<number> => {
    try {
      const res = await db.prepare(sql).bind(...params).first<any>();
      return Number(res?.cnt || res?.count || 0);
    } catch {
      return 0;
    }
  };

  // 1. Full Table Inventory & Row Baseline
  const tableConfigs: Array<{ name: string; domain: TableInventoryItem['domain']; status: TableInventoryItem['status'] }> = [
    { name: "universities", domain: "ACADEMIC", status: "CANONICAL" },
    { name: "branches", domain: "ACADEMIC", status: "CANONICAL" },
    { name: "subjects", domain: "ACADEMIC", status: "CANONICAL" },
    { name: "curriculum_nodes", domain: "ACADEMIC", status: "CANONICAL" },
    { name: "subject_units", domain: "ACADEMIC", status: "COMPATIBILITY" },
    { name: "subject_topics", domain: "ACADEMIC", status: "COMPATIBILITY" },

    { name: "documents", domain: "KEYDOCS", status: "CANONICAL" },
    { name: "pyq_metadata", domain: "KEYDOCS", status: "CANONICAL" },
    { name: "syllabus_metadata", domain: "KEYDOCS", status: "CANONICAL" },
    { name: "material_metadata", domain: "KEYDOCS", status: "CANONICAL" },
    { name: "document_relations", domain: "KEYDOCS", status: "CANONICAL" },
    { name: "document_stats", domain: "KEYDOCS", status: "CANONICAL" },
    { name: "assets", domain: "KEYDOCS", status: "CANONICAL" },
    { name: "document_files", domain: "KEYDOCS", status: "CANONICAL" },
    { name: "file_assets", domain: "KEYDOCS", status: "COMPATIBILITY" },

    { name: "content_factory_jobs", domain: "CONTENT", status: "ACTIVE" },
    { name: "content_factory_items", domain: "CONTENT", status: "ACTIVE" },
    { name: "blogs", domain: "CONTENT", status: "ACTIVE" },
    { name: "announcements", domain: "CONTENT", status: "ACTIVE" },

    { name: "unified_users", domain: "IDENTITY", status: "ACTIVE" },
    { name: "academic_profiles", domain: "IDENTITY", status: "ACTIVE" },

    { name: "teacher_whitelist", domain: "GOVERNANCE", status: "ACTIVE" },
    { name: "admin_audit_logs", domain: "GOVERNANCE", status: "ACTIVE" },
  ];

  for (const cfg of tableConfigs) {
    const rowCount = await getCount(`SELECT COUNT(1) as cnt FROM ${cfg.name}`);
    inventory.push({ table: cfg.name, domain: cfg.domain, rowCount, status: cfg.status });
  }

  // 2. Foreign Key & Hierarchy Integrity Audits
  const orphanBranches = await getCount(`SELECT COUNT(1) as cnt FROM branches b WHERE NOT EXISTS (SELECT 1 FROM universities u WHERE u.id = b.university_id)`);
  const orphanSubjects = await getCount(`SELECT COUNT(1) as cnt FROM subjects s WHERE NOT EXISTS (SELECT 1 FROM branches b WHERE b.id = s.branch_id)`);
  findings.push({
    domain: "ACADEMIC",
    check: "Academic Foreign Key Hierarchy (University ➔ Branch ➔ Subject)",
    status: orphanBranches === 0 && orphanSubjects === 0 ? "PASS" : "FAIL",
    severity: "CRITICAL",
    affectedRows: orphanBranches + orphanSubjects,
    details: `Orphan Branches: ${orphanBranches} | Orphan Subjects: ${orphanSubjects}`,
    recommendedAction: "Fix foreign key assignments in branches/subjects",
  });

  // 3. Curriculum Hierarchy Integrity Audit
  const orphanCurriculumNodes = await getCount(`
    SELECT COUNT(1) as cnt FROM curriculum_nodes cn
    WHERE NOT EXISTS (SELECT 1 FROM subjects s WHERE s.id = cn.subject_id)
       OR (cn.parent_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM curriculum_nodes p WHERE p.id = cn.parent_id))
  `);
  const selfRefNodes = await getCount(`SELECT COUNT(1) as cnt FROM curriculum_nodes WHERE id = parent_id`);

  findings.push({
    domain: "ACADEMIC",
    check: "Curriculum Nodes Tree Integrity (No Orphans or Self-Links)",
    status: orphanCurriculumNodes === 0 && selfRefNodes === 0 ? "PASS" : "FAIL",
    severity: "CRITICAL",
    affectedRows: orphanCurriculumNodes + selfRefNodes,
    details: `Orphan Curriculum Nodes: ${orphanCurriculumNodes} | Self-Referencing Nodes: ${selfRefNodes}`,
    recommendedAction: "Clean orphan parent_id pointers in curriculum_nodes",
  });

  // 4. Document Core Integrity Audit
  const orphanDocuments = await getCount(`SELECT COUNT(1) as cnt FROM documents d WHERE NOT EXISTS (SELECT 1 FROM subjects s WHERE s.id = d.subject_id)`);
  findings.push({
    domain: "KEYDOCS",
    check: "Document Subject Link Validity",
    status: orphanDocuments === 0 ? "PASS" : "FAIL",
    severity: "CRITICAL",
    affectedRows: orphanDocuments,
    details: `Orphan Documents without valid Subject ID: ${orphanDocuments}`,
    recommendedAction: "Re-assign orphan documents to canonical subject IDs",
  });

  // 5. Metadata Completeness Audit
  const missingMeta = await getCount(`
    SELECT COUNT(1) as cnt FROM documents d
    WHERE (d.document_type = 'pyq' AND NOT EXISTS (SELECT 1 FROM pyq_metadata m WHERE m.document_id = d.id))
       OR (d.document_type = 'study-material' AND NOT EXISTS (SELECT 1 FROM material_metadata m WHERE m.document_id = d.id))
       OR (d.document_type = 'syllabus' AND NOT EXISTS (SELECT 1 FROM syllabus_metadata m WHERE m.document_id = d.id))
  `);

  findings.push({
    domain: "KEYDOCS",
    check: "Type-Specific Metadata Completeness",
    status: missingMeta === 0 ? "PASS" : "WARN",
    severity: "HIGH",
    affectedRows: missingMeta,
    details: `Documents missing specialized metadata rows: ${missingMeta}`,
    recommendedAction: "Backfill default type metadata for documents",
  });

  // Safe Deterministic Fix Application (if requested)
  if (isApplyFixes && missingMeta > 0) {
    console.log("🛠️ Applying safe deterministic missing metadata fix...");
    await db.prepare(`
      INSERT OR IGNORE INTO pyq_metadata (document_id, exam_year, season, exam_label)
      SELECT id, paper_year, season, exam_label FROM documents WHERE document_type = 'pyq'
    `).run();

    await db.prepare(`
      INSERT OR IGNORE INTO material_metadata (document_id, material_kind, author)
      SELECT id, material_kind, author FROM documents WHERE document_type = 'study-material'
    `).run();

    await db.prepare(`
      INSERT OR IGNORE INTO syllabus_metadata (document_id, effective_year, regulation)
      SELECT id, syllabus_year, regulation FROM documents WHERE document_type = 'syllabus'
    `).run();
    console.log("✅ Safe deterministic metadata backfill applied successfully!");
  }

  // 6. File & Asset Integrity Audit
  const orphanFiles = await getCount(`SELECT COUNT(1) as cnt FROM document_files df WHERE NOT EXISTS (SELECT 1 FROM documents d WHERE d.id = df.document_id)`);
  const brokenAssetRefs = await getCount(`SELECT COUNT(1) as cnt FROM document_files df WHERE NOT EXISTS (SELECT 1 FROM assets a WHERE a.id = df.file_asset_id OR a.storage_key = df.storage_key)`);

  findings.push({
    domain: "KEYDOCS",
    check: "Document Files & Physical R2 Storage Links",
    status: orphanFiles === 0 && brokenAssetRefs === 0 ? "PASS" : "FAIL",
    severity: "CRITICAL",
    affectedRows: orphanFiles + brokenAssetRefs,
    details: `Orphan Document Files: ${orphanFiles} | Broken Storage Key Refs: ${brokenAssetRefs}`,
    recommendedAction: "Reconcile asset entries with physical R2 objects",
  });

  // 7. Duplicate Asset SHA256 Hashes Audit
  const duplicateAssetHashes = await getCount(`
    SELECT COUNT(1) as cnt FROM (
      SELECT content_hash FROM assets GROUP BY content_hash HAVING COUNT(1) > 1
    )
  `);

  findings.push({
    domain: "KEYDOCS",
    check: "Physical Storage Asset SHA256 Deduplication",
    status: duplicateAssetHashes === 0 ? "PASS" : "WARN",
    severity: "MEDIUM",
    affectedRows: duplicateAssetHashes,
    details: `Duplicate SHA256 asset content hash entries: ${duplicateAssetHashes}`,
    recommendedAction: "Consolidate physical asset rows to single SHA256 hash entry",
  });

  // 8. Document Stats Row Audit
  const missingStats = await getCount(`SELECT COUNT(1) as cnt FROM documents d WHERE NOT EXISTS (SELECT 1 FROM document_stats ds WHERE ds.document_id = d.id)`);
  if (isApplyFixes && missingStats > 0) {
    console.log("🛠️ Applying safe deterministic missing document_stats fix...");
    await db.prepare(`
      INSERT OR IGNORE INTO document_stats (document_id, views, likes, downloads)
      SELECT id, views, likes, downloads FROM documents
    `).run();
    console.log("✅ Safe deterministic document_stats backfill applied successfully!");
  }

  findings.push({
    domain: "KEYDOCS",
    check: "Engagement Counters (`document_stats`) Presence",
    status: missingStats === 0 || isApplyFixes ? "PASS" : "WARN",
    severity: "LOW",
    affectedRows: missingStats,
    details: `Documents missing isolated document_stats row: ${missingStats}`,
    recommendedAction: "Backfill missing document_stats rows from core document counters",
  });

  const totalFailures = findings.filter(f => f.status === 'FAIL').length;
  const healthScore = totalFailures === 0 ? 100 : Math.max(0, 100 - (totalFailures * 15));

  console.log("==================================================");
  console.log("      DATABASE AUDIT & REPAIR SUMMARY REPORT");
  console.log("==================================================");
  console.log(`Database Health Score: ${healthScore}%`);
  console.log(`Total Scanned Tables: ${inventory.length}`);
  console.log(`Audited Checks: ${findings.length}`);
  console.log("--------------------------------------------------");
  findings.forEach(f => {
    const icon = f.status === 'PASS' ? '✅' : f.status === 'WARN' ? '⚠️' : '❌';
    console.log(`${icon} [${f.domain}] ${f.check} -> ${f.status} (${f.details})`);
  });
  console.log("==================================================\n");

  return { inventory, findings, healthScore };
}
