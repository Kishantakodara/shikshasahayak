// ============================================================
// GTU PYQ DISCOVERY & SAMPLE INGESTION CLI RUNNER
// Command: npx tsx scripts/run-gtu-sample-ingestion.ts
// ============================================================

import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import { runGtuSampleIngestionPipeline } from '../functions/lib/questionIntelligence/gtuIngestion';

function createMockD1Database() {
  const db = new DatabaseSync(':memory:');

  const root = process.cwd();
  let schemaSql = fs.readFileSync(path.join(root, 'schema.sql'), 'utf8');
  schemaSql = schemaSql.replace(/Code INT,/g, '');

  db.exec(schemaSql);
  return {
    prepare(sql: string) {
      return {
        bind(...params: any[]) {
          return {
            async first<T = Record<string, unknown>>(): Promise<T | null> {
              const stmt = db.prepare(sql);
              const row = stmt.get(...params);
              return (row as T) || null;
            },
            async all<T = Record<string, unknown>>(): Promise<{ results: T[] }> {
              const stmt = db.prepare(sql);
              const results = stmt.all(...params) as T[];
              return { results };
            },
            async run(): Promise<{ success: boolean }> {
              const stmt = db.prepare(sql);
              stmt.run(...params);
              return { success: true };
            },
          };
        },
        async first<T = Record<string, unknown>>(): Promise<T | null> {
          const stmt = db.prepare(sql);
          const row = stmt.get();
          return (row as T) || null;
        },
        async all<T = Record<string, unknown>>(): Promise<{ results: T[] }> {
          const stmt = db.prepare(sql);
          const results = stmt.all() as T[];
          return { results };
        },
        async run(): Promise<{ success: boolean }> {
          const stmt = db.prepare(sql);
          stmt.run();
          return { success: true };
        },
      };
    },
  };
}

export async function runGtuIngestionCLI() {
  console.log('================================================================');
  console.log('🚀 PHASE 1C: GTU PYQ DISCOVERY & SAMPLE INGESTION RUNNER');
  console.log('================================================================\n');

  const mockDb = createMockD1Database();
  const env = { DB: mockDb as any };

  // Run pipeline on sample of 5 official GTU papers (Mathematics-1, Maths-2, BEE, PPS, English)
  const report = await runGtuSampleIngestionPipeline(
    env,
    ['3110014', '3110015', '3110005', '3110003', '3110002'],
    ['W2024'] // Controlled sample scan of Winter 2024 session
  );

  // Check database staging queue count
  const queueCountRow = await env.DB.prepare(
    `SELECT COUNT(*) AS total FROM question_ingestion_queue`
  ).first<{ total: number }>();

  console.log('----------------------------------------------------------------');
  console.log('📊 INGESTION PIPELINE EXECUTION SUMMARY');
  console.log('----------------------------------------------------------------');
  console.log(`• Sample Papers Discovered:       ${report.papersDiscoveredCount}`);
  console.log(`• Papers Successfully Fetched:    ${report.papersFetchedCount}`);
  console.log(`• Papers Failed:                  ${report.papersFailedCount}`);
  console.log(`• PDFs Parsed:                    ${report.pdfsParsedCount}`);
  console.log(`• Total Questions Extracted:      ${report.totalQuestionsExtracted}`);
  console.log(`• MCQs Detected:                  ${report.mcqsDetectedCount}`);
  console.log(`• MSQs Detected:                  ${report.msqsDetectedCount}`);
  console.log(`• NATs Detected:                  ${report.natsDetectedCount}`);
  console.log(`• Needs Review (Uncertain):       ${report.uncertainClassificationsCount}`);
  console.log(`• Duplicate Candidates Flagged:   ${report.duplicateCandidatesCount}`);
  console.log(`• Items Enqueued in Staging:      ${queueCountRow?.total || 0}`);
  console.log('----------------------------------------------------------------\n');

  console.log('================================================================');
  console.log('🔍 10 REPRESENTATIVE EXTRACTED QUESTION SAMPLES');
  console.log('================================================================\n');

  report.sampleQuestions.slice(0, 10).forEach((q, idx) => {
    console.log(`[SAMPLE ${idx + 1}] Paper: ${q.paperId} | Q.${q.questionNo}(${q.subQuestionNo}) | Page: ${q.originalPage}`);
    console.log(`  • Subject: ${q.subjectName} (${q.subjectCode})`);
    console.log(`  • Detected Type: ${q.detectedType || 'NEEDS_REVIEW'} (Confidence: ${(q.confidenceScore * 100).toFixed(0)}%)`);
    console.log(`  • Classification Reason: ${q.classificationReason}`);
    console.log(`  • Extracted Text Snippet: "${q.cleanedText.slice(0, 140)}..."`);
    if (q.options && q.options.length > 0) {
      console.log(`  • Options (${q.options.length}): ${q.options.map(o => `${o.id}: ${o.text.slice(0, 30)}`).join(' | ')}`);
    }
    console.log(`  • Duplicate Candidate: ${q.isDuplicateCandidate ? 'YES ⚠️' : 'NO ✅'}`);
    console.log('----------------------------------------------------------------');
  });

  return report;
}

runGtuIngestionCLI().catch(err => {
  console.error('Fatal GTU Ingestion error:', err);
  process.exit(1);
});
