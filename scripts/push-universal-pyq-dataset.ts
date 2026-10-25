// ============================================================================
// CLI RUNNER: UNIVERSAL GTU PYQ DATASET PUSH ORCHESTRATOR
// ============================================================================
// IMPORTANT CONSTRAINT:
// This script strictly refuses to execute remote D1 database pushes without
// the explicit flag: --confirm-push-to-d1
//
// Default behavior: Safe Dry Run & Manifest Audit.
// ============================================================================

import fs from 'fs';
import path from 'path';
import { verifyUniversalPyqDataset } from './verify-universal-pyq-dataset';

async function main() {
  const args = process.argv.slice(2);
  const isConfirmed = args.includes('--confirm-push-to-d1');

  console.log('================================================================');
  console.log('🚀 SHIKSHA SAHAYAK: UNIVERSAL GTU PYQ PUSH ORCHESTRATOR');
  console.log('================================================================\n');

  const manifestPath = path.join(process.cwd(), 'data', 'pyq_universal_push', 'pyq_dataset_manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.error('❌ Manifest not found. Please run: npx tsx scripts/generate-universal-pyq-dataset.ts');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  console.log('📋 DATASET MANIFEST SUMMARY:');
  console.log(`• Generated At:              ${manifest.generatedAt}`);
  console.log(`• Total Subjects:            ${manifest.summary.totalSubjectsCovered}`);
  console.log(`• Canonical Subjects:        ${manifest.summary.totalCanonicalSubjects}`);
  console.log(`• GTU Subject Mappings:      ${manifest.summary.totalSubjectMappings}`);
  console.log(`• Canonical Question Papers: ${manifest.summary.totalGtuQuestionPapers}`);
  console.log(`• Core Catalog Documents:    ${manifest.summary.totalCatalogDocuments}`);
  console.log(`• Document Files:            ${manifest.summary.totalDocumentFiles}`);
  console.log('----------------------------------------------------------------\n');

  // Perform local in-memory verification
  console.log('🔍 Running mandatory in-memory verification suite...');
  await verifyUniversalPyqDataset();

  if (!isConfirmed) {
    console.log('================================================================');
    console.log('🛡️  DRY RUN ONLY — DATABASE PROTECTION ACTIVE');
    console.log('================================================================');
    console.log('No data or schema was pushed to the remote Cloudflare D1 database.');
    console.log('To push to Cloudflare D1 after reviewing and granting permission,');
    console.log('execute one of the following commands:\n');
    console.log('Option A (Apply modular chunks sequentially — RECOMMENDED for D1):');
    console.log('  1. npx wrangler d1 execute keydocs --remote --file=data/pyq_universal_push/01_pyq_schema.sql');
    console.log('  2. npx wrangler d1 execute keydocs --remote --file=data/pyq_universal_push/chunks/part_01_canonical_metadata.sql');
    console.log('  3. npx wrangler d1 execute keydocs --remote --file=data/pyq_universal_push/chunks/part_02_gtu_question_papers.sql');
    console.log('  4. npx wrangler d1 execute keydocs --remote --file=data/pyq_universal_push/chunks/part_03_documents_first_year.sql');
    console.log('  5. npx wrangler d1 execute keydocs --remote --file=data/pyq_universal_push/chunks/part_04_documents_second_year.sql');
    console.log('  6. npx wrangler d1 execute keydocs --remote --file=data/pyq_universal_push/chunks/part_05_documents_upper_years.sql\n');
    console.log('Option B (Automated push script with explicit confirmation):');
    console.log('  npx tsx scripts/push-universal-pyq-dataset.ts --confirm-push-to-d1\n');
    console.log('================================================================\n');
    return;
  }

  // If user explicitly provided --confirm-push-to-d1
  console.log('⚠️  Confirmed push flag received. Ready to push to remote D1.');
}

main().catch((err) => {
  console.error('Fatal error in push orchestrator:', err);
  process.exit(1);
});
