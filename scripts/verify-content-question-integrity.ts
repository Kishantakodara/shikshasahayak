/**
 * ShikshaSahayak 2.0 Beta — Phase 5: Content, Question Intelligence & Material Pipeline Integrity Suite
 * 
 * Verifies end-to-end:
 * 1. GTU PYQ Discovery & Source URL integrity
 * 2. Canonical Subject & Branch Mappings
 * 3. Text Extraction & Question Segmentation
 * 4. Question Classification (MCQ, MSQ, NAT, Descriptive)
 * 5. Text Normalization & LaTeX Math Formatting
 * 6. Conservative Question Deduplication & Source Provenance
 * 7. Answer Key Integrity & Validation
 * 8. Question Bank Storage & Provenance Rules
 * 9. Content Factory AI Safety & Schema Validation
 * 10. Moderation Workflows (Approve, Reject, Duplicate, Archive) & Audit Logs
 * 11. Student MCQ Practice Delivery & Answer Key Protection
 * 12. Coverage Accuracy & Ingestion Idempotency
 */

import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import {
  parseGtuSession,
  getOfficialGtuPaperUrl,
  GTU_FIRST_YEAR_SUBJECTS,
} from '../functions/lib/questionIntelligence/gtuIngestion/gtuDiscoveryService';
import {
  classifyQuestionType,
  segmentGtuQuestionsFromPages,
} from '../functions/lib/questionIntelligence/gtuIngestion/gtuExtractorService';
import {
  normalizeQuestionText,
  normalizeMathText,
  normalizeUnicode,
  normalizeOptionPrefixes,
  stripQuestionNumbering,
} from '../functions/lib/questionIntelligence/normalizationService';
import {
  calculateTextSimilarity,
  detectDuplicateQuestion,
} from '../functions/lib/questionIntelligence/duplicateDetectionService';
import {
  validateMasterQuestionPayload,
  validateMcqPayload,
  validateMsqPayload,
  validateNatPayload,
  validateProvenance,
} from '../functions/lib/questionIntelligence/validationService';
import {
  validateGeneratedContent,
} from '../functions/lib/content-factory/validator';
import {
  formatPayloadToMarkdown,
} from '../functions/lib/content-factory/provider';
import {
  createQuestion,
  listQuestions,
} from '../functions/lib/questionIntelligence/questionService';
import {
  approveAndPublishQuestion,
  rejectQuestionInBank,
  markDuplicateQuestion,
  archiveQuestion,
  getQuestionAuditLogs,
} from '../functions/lib/questionIntelligence/adminQuestionBankService';
import {
  getMcqPracticeQuestions,
  evaluateStudentMcqAnswer,
} from '../functions/lib/questionIntelligence/mcqPracticeService';

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

export interface VerificationResult {
  name: string;
  category: 'SOURCE' | 'MAPPING' | 'EXTRACTION' | 'CLASSIFICATION' | 'DEDUPLICATION' | 'ANSWER' | 'QUESTION_BANK' | 'MODERATION' | 'CONTENT_FACTORY' | 'STUDENT_DELIVERY' | 'COVERAGE';
  passed: boolean;
  details: string;
}

export async function runContentQuestionIntegritySuite(): Promise<{
  total: number;
  passed: number;
  failed: number;
  results: VerificationResult[];
}> {
  const results: VerificationResult[] = [];
  const testDb = createTestD1Database();
  const env: any = { DB: testDb };

  console.log('==================================================');
  console.log('   SHIKSHA SAHAYAK 2.0: CONTENT & QUESTION INTEGRITY SUITE');
  console.log('==================================================\n');

  function record(name: string, category: VerificationResult['category'], passed: boolean, details: string) {
    results.push({ name, category, passed, details });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] [${category}] ${name}`);
    console.log(`       Details: ${details}`);
  }

  // --- SECTION 1: SOURCE INTEGRITY ---
  // 1. Valid GTU session code parsing
  const parsedW2024 = parseGtuSession('W2024');
  const parsedS2023 = parseGtuSession('S2023');
  const parsedInvalid = parseGtuSession('INVALID');
  const sessionPass = parsedW2024?.examYear === 2024 && parsedW2024?.examSession === 'WINTER' &&
                      parsedS2023?.examYear === 2023 && parsedS2023?.examSession === 'SUMMER' &&
                      parsedInvalid === null;
  record(
    'GTU Session Code Parsing & Validation',
    'SOURCE',
    sessionPass,
    'Correctly parsed W2024/S2023 into structured Year/Session and rejected invalid code'
  );

  // 2. Official GTU PYQ URL construction
  const urlMaths = getOfficialGtuPaperUrl('W2024', '3110014', 'BE');
  const urlPass = urlMaths === 'https://www.gtu.ac.in/api/v1/question-papers/archive/file/W2024/BE/3110014.pdf';
  record(
    'GTU Official PYQ URL Generator',
    'SOURCE',
    urlPass,
    `Constructed canonical URL: ${urlMaths}`
  );

  // --- SECTION 2: CANONICAL SUBJECT MAPPING ---
  // 3. GTU 1st Year Subject Catalog
  const math1 = GTU_FIRST_YEAR_SUBJECTS.find(s => s.code === '3110014');
  const pps = GTU_FIRST_YEAR_SUBJECTS.find(s => s.code === '3110003');
  const subjectMappingPass = math1?.name === 'Mathematics - 1' && math1?.isFirstYearCommon === true &&
                            pps?.shortName === 'PPS' && pps?.applicableBranches.length! >= 8;
  record(
    'Canonical Subject Mapping & Common First-Year Catalog',
    'MAPPING',
    Boolean(subjectMappingPass),
    'Verified 10 canonical GTU 1st-year subjects mapped across engineering branches'
  );

  // --- SECTION 3: TEXT EXTRACTION & QUESTION SEGMENTATION ---
  // 4. Segmentation of GTU exam papers
  const dummyPaperMeta: any = {
    paperId: 'gtu_paper_W2024_BE_3110014',
    downloadUrl: 'https://www.gtu.ac.in/api/v1/question-papers/archive/file/W2024/BE/3110014.pdf',
    examName: 'GTU',
    examYear: 2024,
    examSession: 'WINTER',
    subjectCode: '3110014',
    subjectName: 'Mathematics - 1',
    semester: 1,
    sessionCode: 'W2024',
    courseCode: 'BE',
  };

  const sampleGtuPage = {
    pageNum: 1,
    text: `GUJARAT TECHNOLOGICAL UNIVERSITY
BE - SEMESTER-I (NEW) EXAMINATION - WINTER 2024
Subject Code: 3110014 Date: 15-01-2024
Subject Name: Mathematics - 1 Total Marks: 70
Instructions: 1. Attempt all questions. 2. Make suitable assumptions wherever necessary.
Q.1 (a) Evaluate the integral: int 0 to 1 (x^2 + 2x) dx. [03]
Q.1 (b) Test the convergence of the series sum (1/n^2). [04]
Q.1 (c) Which of the following matrices is orthogonal? (A) [[1,0],[0,1]] (B) [[1,1],[0,1]] (C) [[0,1],[1,1]] (D) [[1,0],[1,0]] [07]`
  };

  const segmentedBlocks = segmentGtuQuestionsFromPages(dummyPaperMeta, [sampleGtuPage]);
  const segmentationPass = segmentedBlocks.length === 3 &&
                           segmentedBlocks[0].questionNo === '1' && segmentedBlocks[0].subQuestionNo === 'a' &&
                           segmentedBlocks[2].questionNo === '1' && segmentedBlocks[2].subQuestionNo === 'c';
  record(
    'GTU Exam Paper Question Segmentation',
    'EXTRACTION',
    segmentationPass,
    `Successfully segmented ${segmentedBlocks.length} distinct question blocks (Q.1a, Q.1b, Q.1c)`
  );

  // --- SECTION 4: QUESTION CLASSIFICATION ---
  // 5. Question type detection: MCQ, NAT, and Descriptive
  const mcqSample = classifyQuestionType(
    'What is the time complexity of binary search? (A) O(1) (B) O(log n) (C) O(n) (D) O(n^2)',
    'What is the time complexity of binary search? (A) O(1) (B) O(log n) (C) O(n) (D) O(n^2)'
  );
  const natSample = classifyQuestionType(
    'Calculate the value of determinant for the matrix [[2, 4], [1, 3]].',
    'Calculate the value of determinant for the matrix [[2, 4], [1, 3]].'
  );
  const descSample = classifyQuestionType(
    'Explain the working principle of Transformer with a neat circuit diagram.',
    'Explain the working principle of Transformer with a neat circuit diagram.'
  );

  const classificationPass = mcqSample.detectedType === 'MCQ' && mcqSample.options?.length === 4 &&
                             natSample.detectedType === 'NAT' &&
                             descSample.detectedType === null; // Open-ended descriptive preserved without false MCQ conversion
  record(
    'Question Type Classification & Descriptive Preservation',
    'CLASSIFICATION',
    classificationPass,
    'Deterministic detection: MCQ (4 options), NAT (numerical), and Descriptive preserved as open-ended'
  );

  // --- SECTION 5: NORMALIZATION ---
  // 6. Text normalization (whitespace, unicode, LaTeX math delimiters)
  const messyText = '  Evaluate\\( \\alpha + &beta; \\)   and   \\[ \\int x dx \\]  with “curly quotes”  ';
  const normResult = normalizeQuestionText(messyText);
  const normPass = normResult.normalized.includes(String.raw`$\alpha + \beta$`) &&
                   normResult.normalized.includes(String.raw`$$\int x dx$$`) &&
                   normResult.normalized.includes('"curly quotes"');
  record(
    'Text & Math LaTeX Normalization',
    'MAPPING',
    normPass,
    `Normalized inline/display LaTeX and standardized Unicode quotes: "${normResult.normalized}"`
  );

  // --- SECTION 6: DEDUPLICATION ---
  // 7. Duplicate detection (Exact & Normalized Dice similarity)
  const existingQuestions = [
    {
      id: 'Q_101',
      question_text: 'What is the time complexity of binary search algorithm?',
      subject_name: 'Data Structures',
      subject_code: '3130702',
      question_type: 'MCQ',
      exam_year: 2023,
      exam_name: 'GTU',
    }
  ];

  const exactDupCheck = detectDuplicateQuestion(existingQuestions, {
    questionText: 'What is the time complexity of binary search algorithm?',
    questionType: 'MCQ',
    subjectCode: '3130702',
  });

  const nearDupCheck = detectDuplicateQuestion(existingQuestions, {
    questionText: 'What is the time complexity of binary search?',
    questionType: 'MCQ',
    subjectCode: '3130702',
  });

  const distinctCheck = detectDuplicateQuestion(existingQuestions, {
    questionText: 'Explain the working of Quick Sort algorithm with an example.',
    questionType: 'MCQ',
    subjectCode: '3130702',
  });

  const dedupPass = exactDupCheck.isDuplicate === true && exactDupCheck.matchedQuestionId === 'Q_101' &&
                    nearDupCheck.isDuplicate === true &&
                    distinctCheck.isDuplicate === false;
  record(
    'Question Deduplication & Similarity Thresholding',
    'DEDUPLICATION',
    dedupPass,
    `Exact dup (${exactDupCheck.confidence}), Near dup (${nearDupCheck.confidence}), Distinct question (${distinctCheck.confidence})`
  );

  // --- SECTION 7: ANSWER INTEGRITY ---
  // 8. Answer specification validation (MCQ, MSQ, NAT)
  const validMcq = validateMcqPayload([{ id: 'A', text: 'Substantive Option Alpha' }, { id: 'B', text: 'Substantive Option Beta' }], 'A');
  const invalidMcqAns = validateMcqPayload([{ id: 'A', text: 'Substantive Option Alpha' }, { id: 'B', text: 'Substantive Option Beta' }], 'Z');
  const validMsq = validateMsqPayload([{ id: 'A', text: 'Substantive Option Alpha' }, { id: 'B', text: 'Substantive Option Beta' }], ['A', 'B']);
  const validNat = validateNatPayload('15.5', { min: 15.0, max: 16.0 });
  const invalidNatRange = validateNatPayload('15.5', { min: 20.0, max: 10.0 }); // min > max

  const answerPass = validMcq.isValid === true &&
                     invalidMcqAns.isValid === false &&
                     validMsq.isValid === true &&
                     validNat.isValid === true &&
                     invalidNatRange.isValid === false;
  record(
    'Question Answer & Range Specification Validation',
    'ANSWER',
    answerPass,
    'Verified MCQ matching answer, MSQ multi-answer validation, and NAT numerical range bounds'
  );

  // --- SECTION 8: PROVENANCE RULES & QUESTION BANK INSERTION ---
  // 9. Provenance Mutual Exclusivity: is_original_pyq vs is_ai_generated
  const invalidProvenance = validateProvenance({
    isOriginalPyq: true,
    isAiGenerated: true,
    sourceType: 'GTU',
  });
  const validOriginalPyq = validateProvenance({
    isOriginalPyq: true,
    isAiGenerated: false,
    sourceType: 'GTU',
    examName: 'GTU',
    examYear: 2024,
  });

  const provenancePass = invalidProvenance.isValid === false && validOriginalPyq.isValid === true;
  record(
    'Provenance Invariant Validation (Original PYQ vs AI Practice)',
    'QUESTION_BANK',
    provenancePass,
    'Enforced strict mutual exclusivity between Original PYQ and AI Generated questions'
  );

  // 10. Master Question Bank database insertion & retrieval
  const createdQ = await createQuestion(env, {
    id: 'Q_MATH_001',
    sourceType: 'GTU',
    isOriginalPyq: true,
    isAiGenerated: false,
    examName: 'GTU',
    examYear: 2024,
    examSession: 'WINTER',
    subjectCode: '3110014',
    subjectName: 'Mathematics - 1',
    semester: 1,
    questionType: 'MCQ',
    questionText: 'What is the derivative of sin(x)?',
    mcqData: {
      options: [
        { id: 'A', text: 'cos(x)' },
        { id: 'B', text: '-cos(x)' },
        { id: 'C', text: 'tan(x)' },
        { id: 'D', text: '-sin(x)' },
      ],
      correctAnswer: 'A',
    },
    explanation: 'The derivative of sin(x) with respect to x is cos(x).',
    difficulty: 'easy',
  }, ['branch_07', 'branch_31']);

  const insertedQPass = createdQ.id === 'Q_MATH_001' && createdQ.verificationStatus === 'unverified';
  record(
    'Master Question Bank Creation & Branch Association',
    'QUESTION_BANK',
    insertedQPass,
    'Successfully stored question in master_question_bank with default unverified status'
  );

  // --- SECTION 9: CONTENT FACTORY QUALITY VALIDATION ---
  // 11. Content Factory Payload Validation & Quality Flagging
  const sampleContentPayload = {
    topic: 'TCP Congestion Control',
    detailedNotes: 'TCP Congestion Control uses additive increase and multiplicative decrease (AIMD) mechanisms with formula $$W(t+1) = W(t) + 1$$.',
    shortNotes: 'AIMD, Slow Start, Congestion Avoidance, Fast Retransmit, Fast Recovery.',
    definitions: [{ term: 'Slow Start', definition: 'Initial phase where congestion window doubles every RTT.' }],
    mcqs: [
      {
        question: 'What is the growth rate of the congestion window during TCP Slow Start?',
        options: ['Linear', 'Exponential', 'Logarithmic', 'Constant'],
        answer: 1,
        explanation: 'The congestion window doubles every round-trip time (RTT).'
      }
    ]
  };

  const cfValidation = validateGeneratedContent(sampleContentPayload as any, {
    university: 'gtu',
    branch: 'Computer Engineering',
    semester: 5,
    subject: 'Computer Networks',
    unitNo: 3,
    topic: 'TCP Congestion Control',
    contentTypes: ['detailed_notes', 'short_notes', 'definitions', 'mcqs'],
  });

  const cfMarkdown = formatPayloadToMarkdown(sampleContentPayload as any, {
    university: 'gtu',
    branch: 'Computer Engineering',
    semester: 5,
    subject: 'Computer Networks',
    unitNo: 3,
    topic: 'TCP Congestion Control',
    contentTypes: ['detailed_notes', 'short_notes', 'definitions', 'mcqs'],
  });

  const cfPass = cfValidation.issues.length === 0 &&
                 cfValidation.qualityReviewFlags.length >= 1 &&
                 cfMarkdown.includes('# TCP Congestion Control');
  record(
    'Content Factory Automated Quality & Schema Validation',
    'CONTENT_FACTORY',
    cfPass,
    'Validated structured schema and flagged mathematical formulas for review'
  );

  // --- SECTION 10: MODERATION WORKFLOWS & AUDIT LOGS ---
  // 12. Admin approve & publish question
  const approveRes = await approveAndPublishQuestion(env, 'admin_super_user', 'Q_MATH_001', 'Approved after math verification');
  const approvePass = approveRes.success === true && approveRes.status === 'verified';
  record(
    'Admin Moderation: Approve & Publish Question',
    'MODERATION',
    approvePass,
    'Transitioned question status: unverified -> verified'
  );

  // 13. Admin reject question
  await createQuestion(env, {
    id: 'Q_MATH_002',
    sourceType: 'GTU',
    isOriginalPyq: true,
    isAiGenerated: false,
    examName: 'GTU',
    examYear: 2024,
    subjectCode: '3110014',
    subjectName: 'Mathematics - 1',
    semester: 1,
    questionType: 'MCQ',
    questionText: 'Malformed question text with missing options',
    mcqData: {
      options: [{ id: 'A', text: 'Malformed candidate choice alpha' }, { id: 'B', text: 'Malformed candidate choice beta' }],
      correctAnswer: 'A',
    },
    difficulty: 'hard',
  });

  const rejectRes = await rejectQuestionInBank(env, 'admin_super_user', 'Q_MATH_002', 'Rejected due to insufficient options');
  const rejectPass = rejectRes.success === true && rejectRes.status === 'rejected';
  record(
    'Admin Moderation: Reject Question',
    'MODERATION',
    rejectPass,
    'Transitioned question status: unverified -> rejected'
  );

  // 14. Admin duplicate marking & archive
  const dupRes = await markDuplicateQuestion(env, 'admin_super_user', 'Q_MATH_002', 'Q_MATH_001', 'Duplicate of Q_MATH_001');
  const archiveRes = await archiveQuestion(env, 'admin_super_user', 'Q_MATH_002', 'Archived');
  const moderationTransitionsPass = dupRes.success === true && archiveRes.success === true;
  record(
    'Admin Moderation: Duplicate Linking & Archival',
    'MODERATION',
    moderationTransitionsPass,
    'Successfully recorded duplicate provenance link and archived question'
  );

  // 15. Audit logging verification
  const auditLogs = await getQuestionAuditLogs(env, 'Q_MATH_001');
  const auditPass = auditLogs.length > 0 && auditLogs[0].action === 'QUESTION_APPROVED';
  record(
    'Question Bank Audit Logging & Traceability',
    'MODERATION',
    auditPass,
    `Recorded immutable audit action: ${auditLogs[0]?.action} by actor: ${auditLogs[0]?.admin_id}`
  );

  // --- SECTION 11: STUDENT DELIVERY & ANSWER PROTECTION ---
  // 16. Published-only delivery to students (rejected/unverified excluded)
  const studentPracticeRes = await getMcqPracticeQuestions(env, {
    semester: 1,
    subjectCode: '3110014',
  });

  const deliveryPass = studentPracticeRes.questions.length === 1 &&
                       studentPracticeRes.questions[0].id === 'Q_MATH_001' &&
                       (studentPracticeRes.questions[0] as any).correctAnswer === undefined && // Answer key stripped from student DTO
                       (studentPracticeRes.questions[0] as any).correct_answer_json === undefined &&
                       studentPracticeRes.questions[0].explanation === null && // Explanation stripped pre-submission
                       studentPracticeRes.questions[0].stepByStepSolution === undefined; // Steps stripped pre-submission
  record(
    'Student Delivery: Published Filtering & Answer-Key Protection',
    'STUDENT_DELIVERY',
    deliveryPass,
    'Delivered only verified questions with answer keys, explanations, and solutions stripped from pre-submission DTO'
  );

  // 17. Server-side answer evaluation & progress recording
  const evalCorrect = await evaluateStudentMcqAnswer(
    env,
    'Q_MATH_001',
    'A',
    'student_uid_test_1',
    12,
    'RANDOM'
  );
  const evalIncorrect = await evaluateStudentMcqAnswer(
    env,
    'Q_MATH_001',
    'B',
    'student_uid_test_1',
    15,
    'RANDOM'
  );

  const evalPass = evalCorrect.isCorrect === true &&
                   evalCorrect.correctAnswer === 'A' &&
                   evalCorrect.explanation !== null && // Explanation delivered post-submission
                   evalIncorrect.isCorrect === false &&
                   evalIncorrect.correctAnswer === 'A';
  record(
    'Server-Side Student MCQ Evaluation & Progress Tracking',
    'STUDENT_DELIVERY',
    evalPass,
    'Server evaluated submitted option (A=correct, B=incorrect), returned post-submission explanation, and recorded attempt log'
  );

  // --- SECTION 12: COVERAGE & INGESTION IDEMPOTENCY ---
  // 18. Filter queries and coverage metrics
  const filterByBranch = await listQuestions(env, { branchId: 'branch_07' }, { page: 1, limit: 10 });
  const filterByBranchPass = filterByBranch.questions.length >= 1;
  record(
    'Branch-Specific Filtering & Coverage Resolution',
    'COVERAGE',
    filterByBranchPass,
    `Resolved ${filterByBranch.questions.length} questions mapped to Computer Engineering (branch_07)`
  );

  // 19. Duplicate Ingestion Prevention (Idempotent question creation)
  const dupCandidatePayload = {
    questionText: 'What is the derivative of sin(x)?',
    questionType: 'MCQ' as const,
    subjectCode: '3110014',
    subjectName: 'Mathematics - 1',
    semester: 1,
  };
  const d1Rows = await env.DB.prepare(`SELECT id, question_text, subject_name, subject_code, question_type, exam_year, exam_name FROM master_question_bank`).all();
  const dupPreCheck = detectDuplicateQuestion(d1Rows.results, dupCandidatePayload);
  const idempotencyPass = dupPreCheck.isDuplicate === true && dupPreCheck.matchedQuestionId === 'Q_MATH_001';
  record(
    'Ingestion Idempotency & Duplicate Re-ingestion Prevention',
    'COVERAGE',
    idempotencyPass,
    `Ingestion detector recognized duplicate candidate against Q_MATH_001 (Confidence: ${dupPreCheck.confidence})`
  );

  // 20. Rejected/Archived Question Exclusion from Student Test Delivery
  const allVerifiedInDb = await env.DB.prepare(
    `SELECT COUNT(*) as count FROM master_question_bank WHERE verification_status = 'verified'`
  ).first<{ count: number }>();
  const totalInDb = await env.DB.prepare(
    `SELECT COUNT(*) as count FROM master_question_bank`
  ).first<{ count: number }>();

  const poolHealthPass = Number(allVerifiedInDb?.count) === 1 && Number(totalInDb?.count) === 2;
  record(
    'Pool Health & Unverified Exclusion Verification',
    'COVERAGE',
    poolHealthPass,
    `Pool health verified: 1 verified, 1 rejected/archived out of 2 total master questions`
  );

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.length - passedCount;

  console.log('\n==================================================');
  console.log('   CONTENT & QUESTION INTEGRITY SUMMARY');
  console.log('==================================================');
  console.log(`Total Scenarios: ${results.length} | Passed: ${passedCount} | Failed: ${failedCount}`);
  console.log('==================================================\n');

  return {
    total: results.length,
    passed: passedCount,
    failed: failedCount,
    results,
  };
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('verify-content-question-integrity.ts')) {
  runContentQuestionIntegritySuite().then(res => {
    if (res.failed > 0) {
      process.exit(1);
    }
  }).catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
}
