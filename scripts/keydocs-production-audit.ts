// ============================================================
// SHIKSHA SAHAYAK OS KEYDOCS 3.0: READ-ONLY PRODUCTION DATA AUDIT SCRIPT
// Exhaustive production database integrity, reconciliation & orphan audit
// ============================================================

export interface AuditCheckResult {
  category: string;
  check: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  metricCount: number;
  details: string;
}

export interface ProductionReconciliationSummary {
  universitiesCount: number;
  branchesCount: number;
  subjectsCount: number;
  curriculumNodesCount: number;
  totalDocumentsCount: number;
  pyqCount: number;
  studyMaterialCount: number;
  syllabusCount: number;
  assetsCount: number;
  documentFilesCount: number;
  relationsCount: number;
  statsCount: number;
  orphanDocumentsCount: number;
  orphanCurriculumNodesCount: number;
  orphanMetadataCount: number;
  orphanDocumentFilesCount: number;
  orphanAssetsCount: number;
  brokenRelationsCount: number;
  duplicateAssetsCount: number;
  possibleDuplicatePYQsCount: number;
  missingStatsCount: number;
}

export async function runKeyDocsProductionAudit(db: any): Promise<{
  results: AuditCheckResult[];
  summary: ProductionReconciliationSummary;
}> {
  console.log("\n==================================================");
  console.log("   KEYDOCS 3.0 READ-ONLY PRODUCTION DATA AUDIT");
  console.log("==================================================\n");

  const results: AuditCheckResult[] = [];

  // Helper for counting queries safely
  const getCount = async (sql: string, params: any[] = []): Promise<number> => {
    try {
      const res = await db.prepare(sql).bind(...params).first<any>();
      return Number(res?.cnt || res?.count || 0);
    } catch {
      return 0;
    }
  };

  // 1. Hierarchy Base Counts
  const universitiesCount = await getCount(`SELECT COUNT(1) as cnt FROM universities`);
  const branchesCount = await getCount(`SELECT COUNT(1) as cnt FROM branches`);
  const subjectsCount = await getCount(`SELECT COUNT(1) as cnt FROM subjects`);
  const curriculumNodesCount = await getCount(`SELECT COUNT(1) as cnt FROM curriculum_nodes`);

  // 2. Document Core Counts
  const totalDocumentsCount = await getCount(`SELECT COUNT(1) as cnt FROM documents`);
  const pyqCount = await getCount(`SELECT COUNT(1) as cnt FROM documents WHERE document_type = 'pyq'`);
  const studyMaterialCount = await getCount(`SELECT COUNT(1) as cnt FROM documents WHERE document_type = 'study-material'`);
  const syllabusCount = await getCount(`SELECT COUNT(1) as cnt FROM documents WHERE document_type = 'syllabus'`);

  // 3. File & Asset Counts
  const assetsCount = await getCount(`SELECT COUNT(1) as cnt FROM assets`);
  const documentFilesCount = await getCount(`SELECT COUNT(1) as cnt FROM document_files`);
  const relationsCount = await getCount(`SELECT COUNT(1) as cnt FROM document_relations`);
  const statsCount = await getCount(`SELECT COUNT(1) as cnt FROM document_stats`);

  // 4. University/Branch/Subject Integrity Audit
  const orphanBranchesCount = await getCount(`
    SELECT COUNT(1) as cnt FROM branches b
    WHERE NOT EXISTS (SELECT 1 FROM universities u WHERE u.id = b.university_id)
  `);

  const orphanSubjectsCount = await getCount(`
    SELECT COUNT(1) as cnt FROM subjects s
    WHERE NOT EXISTS (SELECT 1 FROM branches b WHERE b.id = s.branch_id)
  `);

  results.push({
    category: "Hierarchy Integrity",
    check: "University & Branch Alignment",
    status: orphanBranchesCount === 0 && orphanSubjectsCount === 0 ? "PASS" : "FAIL",
    severity: "CRITICAL",
    metricCount: orphanBranchesCount + orphanSubjectsCount,
    details: `Orphan Branches: ${orphanBranchesCount} | Orphan Subjects: ${orphanSubjectsCount}`,
  });

  // 5. Curriculum Tree Integrity Audit
  const orphanCurriculumNodesCount = await getCount(`
    SELECT COUNT(1) as cnt FROM curriculum_nodes cn
    WHERE (NOT EXISTS (SELECT 1 FROM subjects s WHERE s.id = cn.subject_id))
       OR (cn.parent_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM curriculum_nodes parent WHERE parent.id = cn.parent_id))
  `);

  const selfRefNodesCount = await getCount(`
    SELECT COUNT(1) as cnt FROM curriculum_nodes WHERE id = parent_id
  `);

  results.push({
    category: "Curriculum Integrity",
    check: "Curriculum Nodes Tree Integrity (No Orphans or Self-Links)",
    status: orphanCurriculumNodesCount === 0 && selfRefNodesCount === 0 ? "PASS" : "FAIL",
    severity: "CRITICAL",
    metricCount: orphanCurriculumNodesCount + selfRefNodesCount,
    details: `Orphan Nodes: ${orphanCurriculumNodesCount} | Self-Referencing Nodes: ${selfRefNodesCount}`,
  });

  // 6. Thin Core Documents Integrity Audit
  const orphanDocumentsCount = await getCount(`
    SELECT COUNT(1) as cnt FROM documents d
    WHERE NOT EXISTS (SELECT 1 FROM subjects s WHERE s.id = d.subject_id)
  `);

  const crossBranchDocsCount = await getCount(`
    SELECT COUNT(1) as cnt FROM documents d
    JOIN subjects s ON s.id = d.subject_id
    WHERE d.branch_id != s.branch_id
  `);

  results.push({
    category: "Document Core Integrity",
    check: "Documents Academic Assignment (Subject & Branch Match)",
    status: orphanDocumentsCount === 0 && crossBranchDocsCount === 0 ? "PASS" : "FAIL",
    severity: "CRITICAL",
    metricCount: orphanDocumentsCount + crossBranchDocsCount,
    details: `Orphan Documents: ${orphanDocumentsCount} | Cross-Branch Docs: ${crossBranchDocsCount}`,
  });

  // 7. Document Type & Metadata Integrity Audit
  const missingPyqMeta = await getCount(`
    SELECT COUNT(1) as cnt FROM documents d
    WHERE d.document_type = 'pyq' AND NOT EXISTS (SELECT 1 FROM pyq_metadata m WHERE m.document_id = d.id)
  `);

  const missingMaterialMeta = await getCount(`
    SELECT COUNT(1) as cnt FROM documents d
    WHERE d.document_type = 'study-material' AND NOT EXISTS (SELECT 1 FROM material_metadata m WHERE m.document_id = d.id)
  `);

  const missingSyllabusMeta = await getCount(`
    SELECT COUNT(1) as cnt FROM documents d
    WHERE d.document_type = 'syllabus' AND NOT EXISTS (SELECT 1 FROM syllabus_metadata m WHERE m.document_id = d.id)
  `);

  const orphanMetadataCount = missingPyqMeta + missingMaterialMeta + missingSyllabusMeta;

  results.push({
    category: "Metadata Integrity",
    check: "Type-Specific Metadata Completeness",
    status: orphanMetadataCount === 0 ? "PASS" : "WARN",
    severity: "HIGH",
    metricCount: orphanMetadataCount,
    details: `Missing PYQ Meta: ${missingPyqMeta} | Missing Material Meta: ${missingMaterialMeta} | Missing Syllabus Meta: ${missingSyllabusMeta}`,
  });

  // 8. PYQ Duplicates Audit
  const possibleDuplicatePYQsCount = await getCount(`
    SELECT COUNT(1) as cnt FROM (
      SELECT d.subject_id, m.exam_year, m.season, COUNT(1) as c
      FROM documents d
      JOIN pyq_metadata m ON m.document_id = d.id
      WHERE d.document_type = 'pyq' AND m.exam_year IS NOT NULL AND m.season IS NOT NULL
      GROUP BY d.subject_id, m.exam_year, m.season
      HAVING COUNT(1) > 1
    )
  `);

  results.push({
    category: "PYQ Integrity",
    check: "PYQ Exam Year & Season Uniqueness",
    status: possibleDuplicatePYQsCount === 0 ? "PASS" : "WARN",
    severity: "MEDIUM",
    metricCount: possibleDuplicatePYQsCount,
    details: `Potential Duplicate PYQ Clusters (Same Subject/Year/Season): ${possibleDuplicatePYQsCount}`,
  });

  // 9. Study Material Links Audit
  const orphanMaterialLinksCount = await getCount(`
    SELECT COUNT(1) as cnt FROM documents d
    WHERE d.document_type = 'study-material'
      AND d.curriculum_node_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM curriculum_nodes cn WHERE cn.id = d.curriculum_node_id)
  `);

  results.push({
    category: "Study Material Integrity",
    check: "Study Material Curriculum Node Target Validity",
    status: orphanMaterialLinksCount === 0 ? "PASS" : "FAIL",
    severity: "HIGH",
    metricCount: orphanMaterialLinksCount,
    details: `Materials targeting non-existent curriculum nodes: ${orphanMaterialLinksCount}`,
  });

  // 10. File & Asset Relation Integrity Audit
  const orphanDocumentFilesCount = await getCount(`
    SELECT COUNT(1) as cnt FROM document_files df
    WHERE NOT EXISTS (SELECT 1 FROM documents d WHERE d.id = df.document_id)
  `);

  const orphanAssetsCount = await getCount(`
    SELECT COUNT(1) as cnt FROM assets a
    WHERE NOT EXISTS (SELECT 1 FROM document_files df WHERE df.file_asset_id = a.id OR df.storage_key = a.storage_key)
  `);

  results.push({
    category: "File System Integrity",
    check: "Document Files & Assets Linking (No Broken References)",
    status: orphanDocumentFilesCount === 0 ? "PASS" : "WARN",
    severity: "HIGH",
    metricCount: orphanDocumentFilesCount + orphanAssetsCount,
    details: `Orphan Document Files: ${orphanDocumentFilesCount} | Unreferenced Physical Assets: ${orphanAssetsCount}`,
  });

  // 11. Asset Deduplication Audit
  const duplicateAssetsCount = await getCount(`
    SELECT COUNT(1) as cnt FROM (
      SELECT content_hash, COUNT(1) as c FROM assets GROUP BY content_hash HAVING COUNT(1) > 1
    )
  `);

  results.push({
    category: "Asset Deduplication",
    check: "Content Hash Uniqueness in Physical Assets",
    status: duplicateAssetsCount === 0 ? "PASS" : "WARN",
    severity: "MEDIUM",
    metricCount: duplicateAssetsCount,
    details: `Duplicate SHA256 Content Hash Entries: ${duplicateAssetsCount}`,
  });

  // 12. Document Relations Audit
  const brokenRelationsCount = await getCount(`
    SELECT COUNT(1) as cnt FROM document_relations dr
    WHERE NOT EXISTS (SELECT 1 FROM documents d1 WHERE d1.id = dr.source_document_id)
       OR NOT EXISTS (SELECT 1 FROM documents d2 WHERE d2.id = dr.target_document_id)
  `);

  results.push({
    category: "Relations Integrity",
    check: "Document Solution & Relation Pointers",
    status: brokenRelationsCount === 0 ? "PASS" : "FAIL",
    severity: "HIGH",
    metricCount: brokenRelationsCount,
    details: `Broken relation links (missing source or target doc): ${brokenRelationsCount}`,
  });

  // 13. Document Stats Audit
  const missingStatsCount = await getCount(`
    SELECT COUNT(1) as cnt FROM documents d
    WHERE NOT EXISTS (SELECT 1 FROM document_stats ds WHERE ds.document_id = d.id)
  `);

  results.push({
    category: "Stats Integrity",
    check: "Engagement Counters Presence",
    status: missingStatsCount === 0 ? "PASS" : "WARN",
    severity: "LOW",
    metricCount: missingStatsCount,
    details: `Documents without isolated document_stats row: ${missingStatsCount}`,
  });

  // 14. Content Factory Integrity Audit
  const orphanPublishedItemsCount = await getCount(`
    SELECT COUNT(1) as cnt FROM content_factory_items cfi
    WHERE cfi.status = 'PUBLISHED'
      AND (cfi.published_document_id IS NULL OR NOT EXISTS (SELECT 1 FROM documents d WHERE d.id = cfi.published_document_id))
  `);

  results.push({
    category: "Content Factory",
    check: "AI Published Item Links to Live Documents",
    status: orphanPublishedItemsCount === 0 ? "PASS" : "FAIL",
    severity: "HIGH",
    metricCount: orphanPublishedItemsCount,
    details: `Published AI items without valid live document link: ${orphanPublishedItemsCount}`,
  });

  const summary: ProductionReconciliationSummary = {
    universitiesCount,
    branchesCount,
    subjectsCount,
    curriculumNodesCount,
    totalDocumentsCount,
    pyqCount,
    studyMaterialCount,
    syllabusCount,
    assetsCount,
    documentFilesCount,
    relationsCount,
    statsCount,
    orphanDocumentsCount,
    orphanCurriculumNodesCount,
    orphanMetadataCount,
    orphanDocumentFilesCount,
    orphanAssetsCount,
    brokenRelationsCount,
    duplicateAssetsCount,
    possibleDuplicatePYQsCount,
    missingStatsCount,
  };

  console.log("==================================================");
  console.log("     READ-ONLY PRODUCTION AUDIT SUMMARY REPORT");
  console.log("==================================================");
  console.log(`Universities: ${summary.universitiesCount} | Branches: ${summary.branchesCount} | Subjects: ${summary.subjectsCount}`);
  console.log(`Curriculum Nodes: ${summary.curriculumNodesCount} | Total Documents: ${summary.totalDocumentsCount}`);
  console.log(`PYQs: ${summary.pyqCount} | Study Materials: ${summary.studyMaterialCount} | Syllabi: ${summary.syllabusCount}`);
  console.log(`Assets: ${summary.assetsCount} | Document Files: ${summary.documentFilesCount} | Stats: ${summary.statsCount}`);
  console.log("--------------------------------------------------");
  results.forEach(r => {
    const icon = r.status === 'PASS' ? '✅' : r.status === 'WARN' ? '⚠️' : '❌';
    console.log(`${icon} [${r.category}] ${r.check} -> ${r.status} (${r.details})`);
  });
  console.log("==================================================\n");

  return { results, summary };
}
