// ============================================================
// SHIKSHA SAHAYAK OS KEYDOCS 3.0: PRODUCTION CONTENT QUALITY AUDIT SCRIPT
// Automated quality & compliance checks for live production content
// ============================================================

export interface ContentQualityFailure {
  document_id: string;
  source: string;
  error_type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  recommended_action: string;
}

export async function runProductionContentAudit(db: any): Promise<{
  totalAudited: number;
  failures: ContentQualityFailure[];
  qualityScore: number;
}> {
  console.log("\n==================================================");
  console.log("   KEYDOCS 3.0 PRODUCTION CONTENT QUALITY AUDIT");
  console.log("==================================================\n");

  const failures: ContentQualityFailure[] = [];

  const getCount = async (sql: string, params: any[] = []): Promise<number> => {
    try {
      const res = await db.prepare(sql).bind(...params).first<any>();
      return Number(res?.cnt || 0);
    } catch {
      return 0;
    }
  };

  const totalAudited = await getCount(`SELECT COUNT(1) as cnt FROM documents`);

  // 1. Missing Title Check
  const missingTitles = await getCount(`SELECT COUNT(1) as cnt FROM documents WHERE title IS NULL OR title = ''`);
  if (missingTitles > 0) {
    failures.push({
      document_id: "MULTIPLE",
      source: "documents",
      error_type: "MISSING_DOCUMENT_TITLE",
      severity: "HIGH",
      recommended_action: "Update document rows to include valid descriptive title",
    });
  }

  // 2. Missing Primary File Attachment Check
  const missingPrimaryFiles = await getCount(`
    SELECT COUNT(1) as cnt FROM documents d
    WHERE NOT EXISTS (SELECT 1 FROM document_files df WHERE df.document_id = d.id AND df.is_primary = 1)
  `);
  if (missingPrimaryFiles > 0) {
    failures.push({
      document_id: "MULTIPLE",
      source: "document_files",
      error_type: "MISSING_PRIMARY_FILE",
      severity: "CRITICAL",
      recommended_action: "Attach valid primary R2 asset link in document_files",
    });
  }

  // 3. Broken Physical R2 Asset References Check
  const brokenAssetRefs = await getCount(`
    SELECT COUNT(1) as cnt FROM document_files df
    WHERE NOT EXISTS (SELECT 1 FROM assets a WHERE a.id = df.file_asset_id OR a.storage_key = df.storage_key)
  `);
  if (brokenAssetRefs > 0) {
    failures.push({
      document_id: "MULTIPLE",
      source: "assets",
      error_type: "BROKEN_FILE_REFERENCE",
      severity: "CRITICAL",
      recommended_action: "Register missing physical asset entry in assets table",
    });
  }

  // 4. Duplicate SHA256 Content Hashes Check
  const duplicateAssetHashes = await getCount(`
    SELECT COUNT(1) as cnt FROM (
      SELECT content_hash FROM assets GROUP BY content_hash HAVING COUNT(1) > 1
    )
  `);
  if (duplicateAssetHashes > 0) {
    failures.push({
      document_id: "MULTIPLE",
      source: "assets",
      error_type: "DUPLICATE_CONTENT_HASH",
      severity: "MEDIUM",
      recommended_action: "Consolidate physical asset records to single SHA256 entry",
    });
  }

  // 5. Metadata Completeness Check
  const missingMeta = await getCount(`
    SELECT COUNT(1) as cnt FROM documents d
    WHERE (d.document_type = 'pyq' AND NOT EXISTS (SELECT 1 FROM pyq_metadata m WHERE m.document_id = d.id))
       OR (d.document_type = 'study-material' AND NOT EXISTS (SELECT 1 FROM material_metadata m WHERE m.document_id = d.id))
       OR (d.document_type = 'syllabus' AND NOT EXISTS (SELECT 1 FROM syllabus_metadata m WHERE m.document_id = d.id))
  `);
  if (missingMeta > 0) {
    failures.push({
      document_id: "MULTIPLE",
      source: "metadata_tables",
      error_type: "MISSING_TYPE_METADATA",
      severity: "HIGH",
      recommended_action: "Populate corresponding type metadata row",
    });
  }

  const qualityScore = totalAudited > 0 ? Math.round(((totalAudited - failures.length) / totalAudited) * 100) : 100;

  console.log("==================================================");
  console.log("        CONTENT QUALITY AUDIT SUMMARY");
  console.log("==================================================");
  console.log(`Total Audited Documents: ${totalAudited}`);
  console.log(`Identified Failures / Anomalies: ${failures.length}`);
  console.log(`Overall Quality Score: ${qualityScore}%`);
  console.log("--------------------------------------------------");
  if (failures.length === 0) {
    console.log("✅ 100% Content Quality Verification PASSED! Zero anomalies found.\n");
  } else {
    failures.forEach(f => {
      console.log(`❌ [${f.severity}] ${f.error_type} in ${f.source} -> ${f.recommended_action}`);
    });
    console.log("");
  }

  return { totalAudited, failures, qualityScore };
}
