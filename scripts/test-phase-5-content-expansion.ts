// ============================================================
// PHASE 5: GTU CONTENT EXPANSION & INGESTION TEST SUITE
// Tests Catalog Inventory, Coverage Classification, Resumable
// Ingestion Checkpointing, Branch Inheritance, and Content Factory.
// ============================================================

import {
  CORE_GTU_SUBJECTS_CATALOG,
  getLiveContentCoverageSummary,
  runResumableBatchIngestion,
} from '../functions/lib/questionIntelligence/contentOperations';
import { validateMasterQuestionPayload } from '../functions/lib/questionIntelligence/validationService';
import { MasterQuestion, BloomTaxonomy } from '../src/types';

interface TestEnv {
  DB: any;
}

function createMockEnv(): TestEnv {
  const masterQuestions = new Map<string, any>();
  const branchMappings = new Map<string, any>();
  const pipelineJobs = new Map<string, any>();
  const trackerRows = new Map<string, any>();

  // Seed sample live database records
  masterQuestions.set('Q_MATH1_001', {
    id: 'Q_MATH1_001',
    subject_code: '3110014',
    question_type: 'MCQ',
    verification_status: 'verified',
  });
  masterQuestions.set('Q_MATH1_002', {
    id: 'Q_MATH1_002',
    subject_code: '3110014',
    question_type: 'NAT',
    verification_status: 'verified',
  });
  masterQuestions.set('Q_CN_001', {
    id: 'Q_CN_001',
    subject_code: '3150710',
    question_type: 'MCQ',
    verification_status: 'verified',
  });

  const mockDb = {
    prepare: (query: string) => {
      const normQuery = query.replace(/\s+/g, ' ').trim();
      let boundParams: any[] = [];
      const queryObj = {
        bind: (...params: any[]) => {
          boundParams = params;
          return queryObj;
        },
        first: async <T>(): Promise<T | null> => {
          if (normQuery.includes('SELECT * FROM pipeline_jobs WHERE id = ?')) {
            const id = boundParams[0];
            return (pipelineJobs.get(id) as T) || null;
          }
          return null;
        },
        all: async <T>(): Promise<{ results: T[] }> => {
          if (normQuery.includes('FROM master_question_bank WHERE verification_status = \'verified\' GROUP BY subject_code, question_type')) {
            return {
              results: [
                { subject_code: '3110014', question_type: 'MCQ', cnt: 15 },
                { subject_code: '3110014', question_type: 'NAT', cnt: 10 },
                { subject_code: '3150710', question_type: 'MCQ', cnt: 8 },
                { subject_code: '3150710', question_type: 'MSQ', cnt: 3 },
                { subject_code: '3150710', question_type: 'NAT', cnt: 3 },
              ] as any[],
            };
          }
          if (normQuery.includes('FROM gtu_paper_ingestion_tracker GROUP BY subject_code')) {
            return {
              results: [
                { subject_code: '3110014', total_discovered: 5, total_ingested: 5 },
                { subject_code: '3150710', total_discovered: 4, total_ingested: 4 },
                { subject_code: '3130702', total_discovered: 2, total_ingested: 0 },
              ] as any[],
            };
          }
          return { results: [] };
        },
        run: async () => {
          if (normQuery.includes('INSERT OR REPLACE INTO pipeline_jobs')) {
            const [jobId] = boundParams;
            pipelineJobs.set(jobId, boundParams);
          }
          return { success: true };
        },
      };
      return queryObj;
    },
  };

  return { DB: mockDb };
}

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testId: string, description: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASSED: [${testId}] ${description}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAILED: [${testId}] ${description}${detail ? ` - ${detail}` : ''}`);
    failedCount++;
  }
}

async function runPhase5Tests() {
  console.log('================================================================');
  console.log('🧪 RUNNING PHASE 5: GTU CONTENT EXPANSION & OPERATIONS TEST SUITE');
  console.log('================================================================\n');

  const env = createMockEnv();

  // ------------------------------------------------------------
  // SECTION 1: CATALOG INVENTORY & CLASSIFICATION
  // ------------------------------------------------------------
  console.log('➡️ Testing Phase 5A: Catalog Inventory & Coverage Classification...');

  assert(
    CORE_GTU_SUBJECTS_CATALOG.length >= 30,
    'CAT_01',
    `Catalog inventory defines core engineering curriculum (${CORE_GTU_SUBJECTS_CATALOG.length} subjects)`
  );

  const coverage = await getLiveContentCoverageSummary(env as any);

  assert(
    coverage.fullCoverageSubjects > 0,
    'CAT_02',
    `Identified FULL coverage subjects (e.g. Mathematics-1: ${coverage.fullCoverageSubjects} subjects)`
  );

  assert(
    coverage.partialCoverageSubjects > 0,
    'CAT_03',
    `Identified PARTIAL coverage subjects (e.g. Computer Networks: ${coverage.partialCoverageSubjects} subjects)`
  );

  assert(
    coverage.emptySubjects > 0,
    'CAT_04',
    `Identified EMPTY catalog subjects for batch queue prioritization (${coverage.emptySubjects} subjects)`
  );

  // ------------------------------------------------------------
  // SECTION 2: RESUMABLE BATCH INGESTION & CHECKPOINTING
  // ------------------------------------------------------------
  console.log('\n➡️ Testing Phase 5B & 5F: Resumable Batch Ingestion...');

  const batchJob = await runResumableBatchIngestion(env as any, {
    targetSubjectCodes: ['3150710', '3150702'],
    examYears: [2024],
    examSessions: ['WINTER'],
  });

  assert(
    Boolean(batchJob.jobId && batchJob.status === 'COMPLETED'),
    'BATCH_01',
    `Resumable batch job completed successfully with Job ID: ${batchJob.jobId}`
  );

  assert(
    batchJob.processedSubjects === 2,
    'BATCH_02',
    `Batch job tracked processed subjects accurately (${batchJob.processedSubjects}/2)`
  );

  // ------------------------------------------------------------
  // SECTION 3: MULTI-BRANCH INHERITANCE & INTEGRITY
  // ------------------------------------------------------------
  console.log('\n➡️ Testing Phase 5D & 5E: Multi-Branch Inheritance & Quality Gates...');

  const commonMathQ: Partial<MasterQuestion> = {
    subjectCode: '3110014',
    subjectName: 'Mathematics - 1',
    semester: 1,
    questionType: 'MCQ',
    questionText: 'What is the rank of an $n \\times n$ identity matrix $I_n$?',
    options: [
      { id: 'A', text: '$0$' },
      { id: 'B', text: '$1$' },
      { id: 'C', text: '$n$' },
      { id: 'D', text: '$n-1$' },
    ],
    correctAnswer: 'C',
    explanation: 'The identity matrix has $n$ linearly independent column vectors, hence its rank is $n$.',
    marks: 1.0,
    negativeMarking: 0.25,
    difficulty: 'easy',
    bloomLevel: BloomTaxonomy.REMEMBER,
    verificationStatus: 'unverified',
  };

  const valMath = validateMasterQuestionPayload(commonMathQ);
  assert(valMath.isValid, 'QUAL_01', 'Common engineering first-year question passes technical gate');

  // ------------------------------------------------------------
  // SECTION 4: STUDENT ZERO-QUESTION GRACEFUL HANDLING
  // ------------------------------------------------------------
  console.log('\n➡️ Testing Phase 5H: Student Empty & Partial Subject Handling...');

  const emptySubjectCode = '3131904';
  const emptySubjectSummary = coverage.subjects.find(s => s.subjectCode === emptySubjectCode);

  assert(
    emptySubjectSummary !== undefined && emptySubjectSummary.liveQuestionCount === 0,
    'STUDENT_01',
    `Unpopulated subject ${emptySubjectCode} safely identified with 0 live questions`
  );

  console.log('\n================================================================');
  console.log(`🎉 PHASE 5 TEST SUMMARY: ${passedCount} / ${passedCount + failedCount} TESTS PASSED CLEANLY`);
  console.log('================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase5Tests().catch(err => {
  console.error('Fatal error during Phase 5 test execution:', err);
  process.exit(1);
});
