/**
 * ShikshaSahayak 2.0 Beta — Phase 7B: GTU Question Extraction & Parser Hardening Verification Suite
 * 
 * Verifies:
 * 1. Q.1(a)(i) parsing
 * 2. Q.1(a)(ii) parsing
 * 3. Q.1(a) + Q.1(b) separation
 * 4. OR question handling
 * 5. Whitespace variations
 * 6. Descriptive question preservation
 * 7. Legitimate MCQ preservation
 * 8. Placeholder Option Choice A-D detection
 * 9. Placeholder MCQ verification protection
 * 10. Provenance invariant enforcement
 * 11. Source and page metadata preservation
 * 12. Regression of existing GTU extraction behavior
 */

import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import {
  segmentGtuQuestionsFromPages,
  classifyQuestionType,
  GtuPaperMetadata,
} from '../functions/lib/questionIntelligence/gtuIngestion/gtuExtractorService';
import {
  validateMasterQuestionPayload,
  validateMcqPayload,
  containsPlaceholderOptions,
  validateProvenance,
} from '../functions/lib/questionIntelligence/validationService';
import {
  validateMcqTechnicalQuality,
} from '../functions/lib/questionIntelligence/transformationEngine/technicalValidatorService';
import {
  createQuestion,
} from '../functions/lib/questionIntelligence/questionService';
import {
  approveAndPublishQuestion,
  executeBulkOperation,
} from '../functions/lib/questionIntelligence/adminQuestionBankService';

// ============================================================
// IN-MEMORY D1 DATABASE FIXTURE FOR VERIFICATION
// ============================================================
function createTestD1Database() {
  const db = new DatabaseSync(':memory:');
  const root = process.cwd();

  let schemaSql = fs.readFileSync(path.join(root, 'schema.sql'), 'utf8');
  schemaSql = schemaSql.replace(/Code INT,/g, '');

  db.exec(schemaSql);
  return {
    prepare(sql: string) {
      const executor = (params: any[]) => ({
        async first<T = Record<string, unknown>>(): Promise<T | null> {
          const stmt = db.prepare(sql);
          const row = stmt.get(...params);
          return (row as T) || null;
        },
        async all<T = Record<string, unknown>>(): Promise<{ results: T[] }> {
          const stmt = db.prepare(sql);
          const rows = stmt.all(...params);
          return { results: (rows as T[]) || [] };
        },
        async run(): Promise<{ success: boolean; meta?: any }> {
          const stmt = db.prepare(sql);
          const info = stmt.run(...params);
          return { success: true, meta: info };
        }
      });

      return {
        ...executor([]),
        bind(...params: any[]) {
          return executor(params);
        }
      };
    }
  };
}

interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function record(name: string, category: string, passed: boolean, details: string) {
  results.push({ name, category, passed, details });
  const badge = passed ? '\x1b[32m[PASS]\x1b[0m' : '\x1b[31m[FAIL]\x1b[0m';
  console.log(`${badge} [${category}] ${name}`);
  console.log(`       Details: ${details}`);
}

export async function runPhase7BVerification() {
  console.log('\n==================================================');
  console.log('   SHIKSHA SAHAYAK 2.0: PHASE 7B VERIFICATION SUITE');
  console.log('   GTU Extraction, Segmentation & Question Intelligence');
  console.log('==================================================\n');

  const env = { DB: createTestD1Database() } as any;

  const samplePaperMeta: GtuPaperMetadata = {
    paperId: 'GTU_BE_3110014_W2024',
    downloadUrl: 'https://www.gtu.ac.in/api/v1/question-papers/archive/file/W2024/BE/3110014.pdf',
    examName: 'GTU',
    examYear: 2024,
    examSession: 'WINTER',
    subjectCode: '3110014',
    subjectName: 'Mathematics - 1',
    semester: 1,
    branchName: 'Computer Engineering',
  };

  // --- 1. Q.1(a)(i) parsing ---
  const nestedSample1 = `
    Q.1(a)(i) Define Rank of a Matrix. [03]
    Q.1(a)(ii) State Cayley-Hamilton Theorem. [04]
    Q.1(b) Find the inverse of matrix A = [[1, 2], [3, 4]]. [07]
  `;
  const parsedBlocks1 = segmentGtuQuestionsFromPages(samplePaperMeta, [{ pageNum: 1, text: nestedSample1 }]);
  const pass1 = parsedBlocks1.length === 3 &&
                parsedBlocks1[0].questionNo === '1' &&
                parsedBlocks1[0].subQuestionNo === 'a(i)' &&
                parsedBlocks1[0].cleanedText.includes('Define Rank of a Matrix');
  record(
    'Q.1(a)(i) Nested Sub-Question Parsing',
    'SEGMENTATION',
    pass1,
    `Parsed block 0: Q.${parsedBlocks1[0]?.questionNo}(${parsedBlocks1[0]?.subQuestionNo}) -> ${parsedBlocks1[0]?.cleanedText.slice(0, 30)}...`
  );

  // --- 2. Q.1(a)(ii) parsing ---
  const pass2 = parsedBlocks1[1]?.questionNo === '1' &&
                parsedBlocks1[1]?.subQuestionNo === 'a(ii)' &&
                parsedBlocks1[1]?.cleanedText.includes('State Cayley-Hamilton Theorem');
  record(
    'Q.1(a)(ii) Nested Sub-Question Parsing',
    'SEGMENTATION',
    pass2,
    `Parsed block 1: Q.${parsedBlocks1[1]?.questionNo}(${parsedBlocks1[1]?.subQuestionNo}) -> ${parsedBlocks1[1]?.cleanedText.slice(0, 35)}...`
  );

  // --- 3. Q.1(a) + Q.1(b) separation ---
  const pass3 = parsedBlocks1[2]?.questionNo === '1' &&
                parsedBlocks1[2]?.subQuestionNo === 'b' &&
                !parsedBlocks1[2]?.cleanedText.includes('Cayley-Hamilton') &&
                parsedBlocks1[2]?.cleanedText.includes('Find the inverse of matrix');
  record(
    'Q.1(a) + Q.1(b) Distinct Block Separation',
    'SEGMENTATION',
    pass3,
    `Parsed block 2: Q.${parsedBlocks1[2]?.questionNo}(${parsedBlocks1[2]?.subQuestionNo}) cleanly isolated without text bleeding`
  );

  // --- 4. OR question handling ---
  const orSample = `
    Q.2(a) Explain Newton-Raphson method for finding roots. [07]
    OR Q.2(a) Explain Gauss-Elimination method for linear equations. [07]
    OR Q.2(b) Solve the system of linear equations using Gauss-Jordan. [07]
  `;
  const parsedOrBlocks = segmentGtuQuestionsFromPages(samplePaperMeta, [{ pageNum: 1, text: orSample }]);
  const pass4 = parsedOrBlocks.length === 3 &&
                parsedOrBlocks[0].questionNo === '2' && parsedOrBlocks[0].subQuestionNo === 'a' &&
                parsedOrBlocks[1].questionNo === '2' && parsedOrBlocks[1].subQuestionNo === 'a' &&
                parsedOrBlocks[2].questionNo === '2' && parsedOrBlocks[2].subQuestionNo === 'b';
  record(
    'OR Question Header & Sequence Handling',
    'SEGMENTATION',
    pass4,
    `Recognized all 3 questions under standard and alternative 'OR' headings: Q.2(a), OR Q.2(a), OR Q.2(b)`
  );

  // --- 5. Whitespace variations ---
  const whitespaceSample = `
    Q. 1 (a) (i) Explain linear independence of vectors. [03]
    (ii) Check if vectors (1,0,1) and (0,1,1) are orthogonal. [04]
    Q. 1 (b) Determine the eigenvalues of matrix M. [07]
  `;
  const parsedWsBlocks = segmentGtuQuestionsFromPages(samplePaperMeta, [{ pageNum: 1, text: whitespaceSample }]);
  const pass5 = parsedWsBlocks.length === 3 &&
                parsedWsBlocks[0].subQuestionNo === 'a(i)' &&
                parsedWsBlocks[1].subQuestionNo === 'a(ii)' &&
                parsedWsBlocks[2].subQuestionNo === 'b';
  record(
    'Whitespace Variation Tolerance (Q. 1 (a) (i) vs Q.1(a)(i))',
    'SEGMENTATION',
    pass5,
    `Normalized spaces between question numbers, parentheses, and sub-parts seamlessly`
  );

  // --- 6. Descriptive question preservation ---
  const descText = 'Explain the seven layers of OSI reference model with a neat architecture diagram and state the primary role of each layer.';
  const descCls = classifyQuestionType(descText, descText);
  const pass6 = descCls.detectedType === null &&
                descCls.confidenceScore === 0.60 &&
                descCls.reason.includes('descriptive') &&
                descCls.options === undefined;
  record(
    'Descriptive Question Preservation (No Fake MCQ Conversion)',
    'CLASSIFICATION',
    pass6,
    `Descriptive question preserved as open-ended with detectedType: null and requires admin review`
  );

  // --- 7. Legitimate MCQ remains MCQ ---
  const mcqRaw = 'Which layer in the OSI model is responsible for end-to-end reliability? (A) Physical (B) Data Link (C) Transport (D) Application';
  const mcqCls = classifyQuestionType(mcqRaw, mcqRaw);
  const pass7 = mcqCls.detectedType === 'MCQ' &&
                mcqCls.options?.length === 4 &&
                mcqCls.options[2].text.toLowerCase() === 'transport' &&
                mcqCls.confidenceScore >= 0.90;
  record(
    'Legitimate MCQ Classification & Extraction',
    'CLASSIFICATION',
    pass7,
    `Legitimate MCQ identified with 4 distinct choices [Physical, Data Link, Transport, Application]`
  );

  // --- 8. Placeholder Option Choice A-D detection ---
  const dummyOpts = [
    { id: 'A', text: 'Option Choice A' },
    { id: 'B', text: 'Option Choice B' },
    { id: 'C', text: 'Option Choice C' },
    { id: 'D', text: 'Option Choice D' },
  ];
  const realOpts = [
    { id: 'A', text: 'Linear Time Complexity' },
    { id: 'B', text: 'Logarithmic Complexity' },
    { id: 'C', text: 'Quadratic Complexity' },
    { id: 'D', text: 'Exponential Complexity' },
  ];
  const isDummyDetected = containsPlaceholderOptions(dummyOpts);
  const isRealClean = !containsPlaceholderOptions(realOpts);
  const pass8 = isDummyDetected === true && isRealClean === true;
  record(
    'Placeholder Option Pattern Detection (Option Choice A-D)',
    'VALIDATION',
    pass8,
    `containsPlaceholderOptions accurately flagged dummy options and passed legitimate technical options`
  );

  // --- 9. Placeholder MCQ cannot become verified ---
  const dummyMcqVal = validateMcqPayload(dummyOpts, 'A');
  const dummyTechVal = validateMcqTechnicalQuality({
    mcqData: { options: dummyOpts, correctAnswer: 'A' },
  });

  // Attempt to insert dummy question in DB and approve it
  await env.DB.prepare(
    `INSERT INTO master_question_bank (
      id, source_type, question_text, question_type, subject_code, subject_name, semester,
      options_json, correct_answer_json, verification_status, is_original_pyq, is_ai_generated
    ) VALUES ('Q_DUMMY_001', 'GTU', 'What is recursion?', 'MCQ', '3110014', 'Maths', 1, ?, 'A', 'unverified', 1, 0)`
  )
    .bind(JSON.stringify(dummyOpts))
    .run();

  let singleApproveBlocked = false;
  try {
    await approveAndPublishQuestion(env, 'admin_test_uid', 'Q_DUMMY_001');
  } catch (err: any) {
    if (err.message.includes('placeholder')) singleApproveBlocked = true;
  }

  // Bulk approve test
  const bulkRes = await executeBulkOperation(env, 'admin_test_uid', 'BULK_APPROVE', ['Q_DUMMY_001']);
  const rowAfterBulk = await env.DB.prepare(`SELECT verification_status FROM master_question_bank WHERE id = 'Q_DUMMY_001'`).first<{ verification_status: string }>();

  const pass9 = dummyMcqVal.isValid === false &&
                dummyTechVal.status !== 'VERIFIED' &&
                singleApproveBlocked === true &&
                bulkRes.processedCount === 0 &&
                rowAfterBulk?.verification_status === 'unverified';
  record(
    'Placeholder MCQ Verification Protection (Single & Bulk Approval Block)',
    'QUALITY_CONTROL',
    pass9,
    `Blocked single and bulk approval of placeholder MCQ; question remains safely unverified`
  );

  // --- 10. Provenance invariant ---
  const invalidProv = validateProvenance({
    isOriginalPyq: true,
    isAiGenerated: true,
    sourceType: 'GTU',
  });
  const validProv = validateProvenance({
    isOriginalPyq: true,
    isAiGenerated: false,
    sourceType: 'GTU',
    examName: 'GTU',
    examYear: 2024,
  });
  const pass10 = invalidProv.isValid === false && validProv.isValid === true;
  record(
    'Provenance Invariant Enforcement (Mutual Exclusivity)',
    'PROVENANCE',
    pass10,
    `Enforced invariant: is_original_pyq=1 and is_ai_generated=1 mutually exclusive`
  );

  // --- 11. Source and page metadata preservation ---
  const block0 = parsedBlocks1[0];
  const pass11 = block0.paperId === samplePaperMeta.paperId &&
                 block0.sourceUrl === samplePaperMeta.downloadUrl &&
                 block0.examYear === samplePaperMeta.examYear &&
                 block0.examSession === samplePaperMeta.examSession &&
                 block0.subjectCode === samplePaperMeta.subjectCode &&
                 block0.subjectName === samplePaperMeta.subjectName &&
                 block0.semester === samplePaperMeta.semester &&
                 block0.originalPage === 1;
  record(
    'Source, Paper & Page Metadata Invariant Preservation',
    'PROVENANCE',
    pass11,
    `Retained exact paper ID (${block0.paperId}), URL, page (${block0.originalPage}), and academic semester mapping`
  );

  // --- 12. Regression of existing GTU extraction behavior ---
  const fullPageSample = `
    GUJARAT TECHNOLOGICAL UNIVERSITY
    B.E. Sem - 1 Examination Winter - 2024
    Subject Code: 3110014
    Total Marks: 70
    Instructions: 1. Attempt all questions. 2. Make suitable assumptions.

    Q.1 (a) Evaluate the integral: int x * e^x dx [03]
    Q.1 (b) Test the convergence of the series sum(1/n^2) [04]
    Q.1 (c) Which of the following matrices is orthogonal? (A) [[1,0],[0,1]] (B) [[1,1],[0,1]] (C) [[0,2],[1,0]] (D) [[2,0],[0,2]] [07]
    Q.2 (a) State and prove Rolle's Theorem. [07]
    OR Q.2 (a) State and prove Cauchy Mean Value Theorem. [07]
  `;
  const fullBlocks = segmentGtuQuestionsFromPages(samplePaperMeta, [{ pageNum: 1, text: fullPageSample }]);
  const pass12 = fullBlocks.length === 5 &&
                 fullBlocks[0].questionNo === '1' && fullBlocks[0].subQuestionNo === 'a' && fullBlocks[0].detectedType === 'NAT' &&
                 fullBlocks[1].questionNo === '1' && fullBlocks[1].subQuestionNo === 'b' && fullBlocks[1].detectedType === null &&
                 fullBlocks[2].questionNo === '1' && fullBlocks[2].subQuestionNo === 'c' && fullBlocks[2].detectedType === 'MCQ' &&
                 fullBlocks[3].questionNo === '2' && fullBlocks[3].subQuestionNo === 'a' && fullBlocks[3].detectedType === null &&
                 fullBlocks[4].questionNo === '2' && fullBlocks[4].subQuestionNo === 'a' && fullBlocks[4].detectedType === null;
  record(
    'GTU Exam Paper Full Lifecycle Segmentation Regression',
    'REGRESSION',
    pass12,
    `Successfully segmented full 5-question exam page (1 NAT, 3 descriptive, 1 MCQ) with zero corruption`
  );

  // --- SUMMARY ---
  console.log('\n==================================================');
  console.log('   PHASE 7B QUESTION INTELLIGENCE SUMMARY');
  console.log('==================================================');
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.length - passedCount;
  console.log(`Total Scenarios: ${results.length} | Passed: ${passedCount} | Failed: ${failedCount}`);
  console.log('==================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

// Direct execution
runPhase7BVerification().catch(err => {
  console.error('Phase 7B verification failed with error:', err);
  process.exit(1);
});
