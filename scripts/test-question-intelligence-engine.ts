// ============================================================
// QUESTION INTELLIGENCE ENGINE - PHASE 1B AUDIT & TEST SUITE
// Tests MCQ, MSQ, NAT creation, validation rules, provenance checks,
// 1-to-many branch mappings, duplicate detection, verification,
// pagination, and ingestion queue lifecycle against an in-memory SQLite D1 environment.
// ============================================================

import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import {
  createQuestion,
  getQuestionById,
  listQuestions,
  verifyQuestion,
  rejectQuestion,
  flagQuestion,
  mapQuestionToBranches,
  getQuestionBranches,
  enqueueQuestion,
  getQueuedQuestions,
  approveQueuedQuestion,
  rejectQueuedQuestion,
  detectDuplicateQuestion,
  validateMasterQuestionPayload,
  validateMcqPayload,
  validateMsqPayload,
  validateNatPayload,
  validateProvenance,
  normalizeQuestionText,
  getMcqPracticeQuestions,
  getRandomMcqPracticeSession,
  evaluateStudentMcqAnswer,
  toggleMcqBookmark,
  getStudentMcqBookmarks,
  getStudentMcqProgressSummary,
} from '../functions/lib/questionIntelligence';
import { PHASE_1_BRANCHES } from '../functions/lib/branchNormalization';

// ------------------------------------------------------------
// IN-MEMORY D1 STUB ADAPTER USING NODE:SQLITE
// ------------------------------------------------------------
function createMockD1Database() {
  const db = new DatabaseSync(':memory:');

  const root = process.cwd();
  let schemaSql = fs.readFileSync(path.join(root, 'schema.sql'), 'utf8');
  // Strip duplicate case-insensitive 'Code INT,' column definition from schema.sql for node:sqlite compatibility
  schemaSql = schemaSql.replace(/Code INT,/g, '');

  db.exec(schemaSql);
  return {
    prepare(sql: string) {
      return {
        bind(...params: any[]) {
          return {
            async first<T = Record<string, unknown>>(): Promise<T | null> {
              try {
                const stmt = db.prepare(sql);
                const row = stmt.get(...params);
                return (row as T) || null;
              } catch (err) {
                console.error('SQLite First Error:', err, sql, params);
                throw err;
              }
            },
            async all<T = Record<string, unknown>>(): Promise<{ results: T[] }> {
              try {
                const stmt = db.prepare(sql);
                const results = stmt.all(...params) as T[];
                return { results };
              } catch (err) {
                console.error('SQLite All Error:', err, sql, params);
                throw err;
              }
            },
            async run(): Promise<{ success: boolean }> {
              try {
                const stmt = db.prepare(sql);
                stmt.run(...params);
                return { success: true };
              } catch (err) {
                console.error('SQLite Run Error:', err, sql, params);
                throw err;
              }
            },
          };
        },
        async first<T = Record<string, unknown>>(): Promise<T | null> {
          try {
            const stmt = db.prepare(sql);
            const row = stmt.get();
            return (row as T) || null;
          } catch (err) {
            console.error('SQLite First Error:', err, sql);
            throw err;
          }
        },
        async all<T = Record<string, unknown>>(): Promise<{ results: T[] }> {
          try {
            const stmt = db.prepare(sql);
            const results = stmt.all() as T[];
            return { results };
          } catch (err) {
            console.error('SQLite All Error:', err, sql);
            throw err;
          }
        },
        async run(): Promise<{ success: boolean }> {
          try {
            const stmt = db.prepare(sql);
            stmt.run();
            return { success: true };
          } catch (err) {
            console.error('SQLite Run Error:', err, sql);
            throw err;
          }
        },
      };
    },
  };
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('🧪 RUNNING QUESTION INTELLIGENCE ENGINE (PHASE 1B) TEST SUITE');
  console.log('================================================================\n');

  const mockDb = createMockD1Database();
  const env = { DB: mockDb as any };

  let passedTests = 0;
  let totalTests = 15;

  // ------------------------------------------------------------
  // TEST A: MCQ Creation
  // ------------------------------------------------------------
  console.log('➡️ Test A: MCQ Creation');
  try {
    const mcq = await createQuestion(
      env,
      {
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
        questionText: 'Q.1(a) Evaluate the limit lim(x->0) (sin x / x).',
        mcqData: {
          options: [
            { id: 'A', text: '0' },
            { id: 'B', text: '1', isCorrect: true },
            { id: 'C', text: 'Infinity' },
            { id: 'D', text: 'Undefined' },
          ],
          correctAnswer: 'B',
        },
        explanation: 'Standard limit theorem: lim(x->0) sin(x)/x = 1.',
        marks: 1.0,
        difficulty: 'easy',
      },
      ['branch_07']
    );

    if (mcq && mcq.id && mcq.questionType === 'MCQ' && mcq.mcqData?.correctAnswer === 'B') {
      console.log(`  ✓ PASSED: Created MCQ question ID: ${mcq.id}`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: MCQ creation returned invalid structure', mcq);
    }
  } catch (err) {
    console.error('  ❌ FAILED: MCQ creation threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST B: MSQ Creation
  // ------------------------------------------------------------
  console.log('\n➡️ Test B: MSQ Creation (Multiple Select Question)');
  try {
    const msq = await createQuestion(
      env,
      {
        sourceType: 'GATE',
        isOriginalPyq: true,
        isAiGenerated: false,
        examName: 'GATE',
        examYear: 2024,
        examSession: 'FEBRUARY',
        subjectCode: 'CS2024',
        subjectName: 'Linear Algebra',
        semester: 1,
        questionType: 'MSQ',
        questionText: 'Which of the following matrices are symmetric?',
        msqData: {
          options: [
            { id: 'A', text: 'Identity Matrix I', isCorrect: true },
            { id: 'B', text: 'Diagonal Matrix with real elements', isCorrect: true },
            { id: 'C', text: 'Skew-symmetric Matrix with non-zero elements' },
            { id: 'D', text: 'Upper Triangular Non-Diagonal Matrix' },
          ],
          correctAnswers: ['A', 'B'],
        },
        marks: 2.0,
        difficulty: 'medium',
      },
      ['branch_31']
    );

    if (msq && msq.id && msq.questionType === 'MSQ' && msq.msqData?.correctAnswers.length === 2) {
      console.log(`  ✓ PASSED: Created MSQ question ID: ${msq.id}`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: MSQ creation returned invalid structure', msq);
    }
  } catch (err) {
    console.error('  ❌ FAILED: MSQ creation threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST C: NAT Creation
  // ------------------------------------------------------------
  console.log('\n➡️ Test C: NAT Creation (Numerical Answer Type)');
  try {
    const nat = await createQuestion(
      env,
      {
        sourceType: 'GTU',
        isOriginalPyq: true,
        isAiGenerated: false,
        examName: 'GTU',
        examYear: 2023,
        examSession: 'SUMMER',
        subjectCode: '3110005',
        subjectName: 'Basic Electrical Engineering',
        semester: 1,
        questionType: 'NAT',
        questionText: 'Calculate the equivalent resistance between terminals A and B for three 30-ohm resistors connected in parallel.',
        natData: {
          exactValue: 10,
          acceptableRange: { min: 9.9, max: 10.1, tolerance: 0.1 },
          unit: 'ohms',
        },
        marks: 2.0,
        difficulty: 'easy',
      },
      ['branch_09']
    );

    if (nat && nat.id && nat.questionType === 'NAT' && nat.natData?.acceptableRange.min === 9.9) {
      console.log(`  ✓ PASSED: Created NAT question ID: ${nat.id}`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: NAT creation returned invalid structure', nat);
    }
  } catch (err) {
    console.error('  ❌ FAILED: NAT creation threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST D: Invalid MCQ Rejection
  // ------------------------------------------------------------
  console.log('\n➡️ Test D: Invalid MCQ Rejection');
  try {
    const invMcq = validateMcqPayload([{ id: 'A', text: 'Option A' }], 'B');
    if (!invMcq.isValid && invMcq.errors.length >= 1) {
      console.log(`  ✓ PASSED: Correctly rejected invalid MCQ (Errors: ${invMcq.errors.join('; ')})`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Invalid MCQ passed validation when it should fail');
    }
  } catch (err) {
    console.error('  ❌ FAILED: Invalid MCQ check threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST E: Invalid MSQ Rejection
  // ------------------------------------------------------------
  console.log('\n➡️ Test E: Invalid MSQ Rejection');
  try {
    const invMsq = validateMsqPayload([{ id: 'A', text: 'Opt A' }, { id: 'B', text: 'Opt B' }], ['Z']);
    if (!invMsq.isValid && invMsq.errors.some(e => e.includes('does not match any valid option'))) {
      console.log(`  ✓ PASSED: Correctly rejected invalid MSQ (Error: ${invMsq.errors[0]})`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Invalid MSQ passed validation when it should fail');
    }
  } catch (err) {
    console.error('  ❌ FAILED: Invalid MSQ check threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST F: Invalid NAT Rejection
  // ------------------------------------------------------------
  console.log('\n➡️ Test F: Invalid NAT Rejection');
  try {
    const invNat = validateNatPayload('', { min: 20, max: 10 }); // min > max
    if (!invNat.isValid && invNat.errors.some(e => e.includes('cannot be greater than max'))) {
      console.log(`  ✓ PASSED: Correctly rejected invalid NAT range (Error: ${invNat.errors[0]})`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Invalid NAT passed validation when it should fail');
    }
  } catch (err) {
    console.error('  ❌ FAILED: Invalid NAT check threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST G: Original PYQ Provenance Validation
  // ------------------------------------------------------------
  console.log('\n➡️ Test G: Original PYQ Provenance Validation');
  try {
    const missingYear = validateProvenance({
      isOriginalPyq: true,
      isAiGenerated: false,
      sourceType: 'GTU',
      examName: 'GTU',
      // missing examYear
    });
    if (!missingYear.isValid && missingYear.errors.some(e => e.includes('requires a valid exam_year'))) {
      console.log(`  ✓ PASSED: Correctly validated Original PYQ provenance requirements`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Missing examYear passed provenance validation');
    }
  } catch (err) {
    console.error('  ❌ FAILED: Original PYQ provenance check threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST H: AI Practice Provenance Validation (Conflict Protection)
  // ------------------------------------------------------------
  console.log('\n➡️ Test H: AI Practice Provenance Validation');
  try {
    const conflict = validateProvenance({
      isOriginalPyq: true,
      isAiGenerated: true, // Conflict!
      sourceType: 'AI_PRACTICE',
      examName: 'GTU',
      examYear: 2024,
    });
    if (!conflict.isValid && conflict.errors.some(e => e.includes('CANNOT be marked as both'))) {
      console.log(`  ✓ PASSED: Prevented AI practice question from being marked as Original PYQ`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Conflict between AI practice and Original PYQ was not caught');
    }
  } catch (err) {
    console.error('  ❌ FAILED: AI practice provenance check threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST I: 1 Question -> Multiple Branch Mappings (13 Branches)
  // ------------------------------------------------------------
  console.log('\n➡️ Test I: One Question -> Multiple Branches (13 FYC Streams)');
  try {
    const fycQuestion = await createQuestion(
      env,
      {
        sourceType: 'GTU',
        isOriginalPyq: true,
        isAiGenerated: false,
        examName: 'GTU',
        examYear: 2024,
        examSession: 'SUMMER',
        subjectCode: '3110014',
        subjectName: 'Mathematics - 1',
        semester: 1,
        questionType: 'NAT',
        questionText: 'Evaluate the rank of the 3x3 identity matrix I3.',
        natData: { exactValue: 3, acceptableRange: { min: 3, max: 3 } },
        marks: 1.0,
      }
    );

    // Map to all 13 Phase-1 branch IDs
    const phase1Ids = PHASE_1_BRANCHES.map(b => b.id);
    const mapRes = await mapQuestionToBranches(env, fycQuestion.id, phase1Ids);
    const fetchedBranches = await getQuestionBranches(env, fycQuestion.id);

    if (mapRes.mappedCount === 13 && fetchedBranches.length === 13) {
      console.log(`  ✓ PASSED: Successfully mapped 1 single question ID (${fycQuestion.id}) to ALL 13 Phase-1 engineering branches!`);
      passedTests++;
    } else {
      console.error(`  ❌ FAILED: Multi-branch mapping failed. Expected 13 branches, got ${fetchedBranches.length}`);
    }
  } catch (err) {
    console.error('  ❌ FAILED: Multi-branch mapping threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST J: Duplicate Detection Utility
  // ------------------------------------------------------------
  console.log('\n➡️ Test J: Conservative Duplicate Detection');
  try {
    const dbRows = [
      {
        id: 'q_existing_101',
        question_text: 'Evaluate the double integral over the triangular region bounded by x=0, y=0, and x+y=1.',
        subject_name: 'Mathematics - 1',
        subject_code: '3110014',
        question_type: 'NAT',
        exam_year: 2023,
        exam_name: 'GTU',
      },
    ];

    const dupCheck = detectDuplicateQuestion(dbRows, {
      questionText: 'Q.2(a) Evaluate double integral over triangular region bounded by x = 0, y = 0, and x + y = 1.',
      subjectCode: '3110014',
      questionType: 'NAT',
    });

    if (dupCheck.isDuplicate && dupCheck.confidence >= 0.88 && dupCheck.matchedQuestionId === 'q_existing_101') {
      console.log(`  ✓ PASSED: Duplicate detected with high confidence (${dupCheck.confidence * 100}%) -> Matched ${dupCheck.matchedQuestionId}`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Duplicate detection failed to match near-duplicate text', dupCheck);
    }
  } catch (err) {
    console.error('  ❌ FAILED: Duplicate detection check threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST K: Verification Workflow (Verify, Reject, Flag)
  // ------------------------------------------------------------
  console.log('\n➡️ Test K: Verification Workflow');
  try {
    const qForVerif = await createQuestion(env, {
      sourceType: 'TEACHER',
      isOriginalPyq: false,
      isAiGenerated: false,
      examName: 'PRACTICE',
      subjectName: 'Physics',
      semester: 1,
      questionType: 'MCQ',
      questionText: 'What is the speed of light in a vacuum?',
      mcqData: {
        options: [
          { id: 'A', text: '3 x 10^8 m/s', isCorrect: true },
          { id: 'B', text: '3 x 10^6 m/s' },
        ],
        correctAnswer: 'A',
      },
    });

    await verifyQuestion(env, qForVerif.id, 'admin_system');
    const verifiedQ = await getQuestionById(env, qForVerif.id);

    if (verifiedQ?.verificationStatus === 'verified' && verifiedQ.verifiedBy === 'admin_system') {
      console.log(`  ✓ PASSED: Verified question status updated to 'verified'`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Verification status update failed', verifiedQ);
    }
  } catch (err) {
    console.error('  ❌ FAILED: Verification workflow check threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST L: Pagination & Multi-Parameter Filtering
  // ------------------------------------------------------------
  console.log('\n➡️ Test L: Pagination & Multi-Parameter Filtering');
  try {
    const filterRes = await listQuestions(
      env,
      {
        semester: 1,
        questionType: 'NAT',
      },
      { page: 1, limit: 10 }
    );

    if (filterRes && filterRes.questions.length >= 1 && filterRes.total >= 1) {
      console.log(`  ✓ PASSED: Filtered & paginated query returned ${filterRes.questions.length} / ${filterRes.total} matching questions`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Filtered query returned no results', filterRes);
    }
  } catch (err) {
    console.error('  ❌ FAILED: Pagination & filtering check threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST M: Ingestion Queue Staging & Approval Lifecycle
  // ------------------------------------------------------------
  console.log('\n➡️ Test M: Ingestion Queue Staging & Approval Lifecycle');
  try {
    const candidatePayload: Partial<MasterQuestion> = {
      sourceType: 'GTU',
      isOriginalPyq: true,
      isAiGenerated: false,
      examName: 'GTU',
      examYear: 2024,
      examSession: 'SUMMER',
      subjectCode: '3110015',
      subjectName: 'Mathematics - 2',
      semester: 2,
      questionType: 'MCQ',
      questionText: 'Find the general solution of dy/dx + y = 0.',
      mcqData: {
        options: [
          { id: 'A', text: 'y = C e^(-x)', isCorrect: true },
          { id: 'B', text: 'y = C e^(x)' },
        ],
        correctAnswer: 'A',
      },
    };

    const queueItem = await enqueueQuestion(env, {
      source: 'GTU_PDF',
      rawPayloadJson: JSON.stringify(candidatePayload),
      extractedQuestionText: candidatePayload.questionText,
      detectedType: 'MCQ',
      confidenceScore: 0.95,
    });

    const queuedList = await getQueuedQuestions(env, { status: 'staged' });
    const approveRes = await approveQueuedQuestion(env, queueItem.id, 'admin_verifier_1', ['branch_07', 'branch_16']);

    if (queuedList.total >= 1 && approveRes.success && approveRes.questionId) {
      console.log(`  ✓ PASSED: Staged payload approved into Master Question Bank (ID: ${approveRes.questionId})`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Ingestion queue lifecycle test failed', approveRes);
    }
  } catch (err) {
    console.error('  ❌ FAILED: Ingestion queue lifecycle test threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST N: Dedicated Student MCQ Practice Queries & Filtering
  // ------------------------------------------------------------
  console.log('\n➡️ Test N: Dedicated Student MCQ Practice Queries & Filtering');
  try {
    // Create verified GTU PYQ MCQ question
    const mcq1 = await createQuestion(
      env,
      {
        sourceType: 'GTU',
        isOriginalPyq: true,
        isAiGenerated: false,
        examName: 'GTU',
        examYear: 2024,
        subjectCode: '3110014',
        subjectName: 'Mathematics - 1',
        semester: 1,
        topicName: 'Limits & Continuity',
        questionType: 'MCQ',
        questionText: 'What is the limit of (1 + 1/n)^n as n approaches infinity?',
        mcqData: {
          options: [
            { id: 'A', text: 'e', isCorrect: true },
            { id: 'B', text: '1' },
            { id: 'C', text: '0' },
            { id: 'D', text: 'Infinity' },
          ],
          correctAnswer: 'A',
        },
        verificationStatus: 'verified',
      },
      ['branch_07']
    );

    // Query GTU PYQ MCQs for Branch 07
    const studentQueryRes = await getMcqPracticeQuestions(env, {
      sourceMode: 'GTU_PYQ',
      branchId: 'branch_07',
      semester: 1,
      subjectCode: '3110014',
      topicName: 'Limits',
      examYear: 2024,
    });

    const randomSession = await getRandomMcqPracticeSession(env, {
      branchId: 'branch_07',
      limit: 5,
    });

    if (studentQueryRes.total >= 1 && studentQueryRes.questions[0].id === mcq1.id && randomSession.length >= 1) {
      console.log(`  ✓ PASSED: Dedicated Student MCQ Practice API returned ${studentQueryRes.total} matching questions and ${randomSession.length} random session items`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Student MCQ Practice query returned invalid results', studentQueryRes);
    }
  } catch (err) {
    console.error('  ❌ FAILED: Student MCQ Practice query test threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST O: Student MCQ Answer Evaluation, Bookmarks, and Progress
  // ------------------------------------------------------------
  console.log('\n➡️ Test O: Student MCQ Answer Evaluation, Bookmarks, and Progress');
  try {
    const studentId = 'student_123';

    // 1. Create a verified question
    const practiceMcq = await createQuestion(
      env,
      {
        sourceType: 'AI_PRACTICE',
        isOriginalPyq: false,
        isAiGenerated: true,
        subjectCode: '3110014',
        subjectName: 'Mathematics - 1',
        semester: 1,
        topicName: 'Integration',
        questionType: 'MCQ',
        questionText: 'Evaluate the integral of x dx from 0 to 1.',
        mcqData: {
          options: [
            { id: 'A', text: '0.5', isCorrect: true },
            { id: 'B', text: '1.0' },
          ],
          correctAnswer: 'A',
        },
        verificationStatus: 'verified',
      },
      ['branch_07']
    );

    // 2. Evaluate Answer
    const evalResult = await evaluateStudentMcqAnswer(
      env,
      practiceMcq.id,
      'A',
      studentId,
      15,
      'TOPIC_WISE'
    );

    // 3. Bookmark Question
    const bookmarkRes = await toggleMcqBookmark(env, studentId, practiceMcq.id, 'Important formula');
    const bookmarks = await getStudentMcqBookmarks(env, studentId);

    // 4. Check Progress Summary
    const progress = await getStudentMcqProgressSummary(env, studentId, 'branch_07', '3110014');

    if (
      evalResult.isCorrect === true &&
      bookmarkRes.isBookmarked === true &&
      bookmarks.length === 1 &&
      progress.totalAttempted === 1 &&
      progress.totalCorrect === 1 &&
      progress.accuracyPercentage === 100
    ) {
      console.log(`  ✓ PASSED: Answer evaluation, bookmarking, and accuracy progress summary (100%) verified cleanly`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Student MCQ Answer evaluation/bookmark/progress check failed', { evalResult, bookmarkRes, bookmarks, progress });
    }
  } catch (err) {
    console.error('  ❌ FAILED: Student MCQ Answer evaluation test threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST SUMMARY
  // ------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`🎉 TEST SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED CLEANLY`);
  console.log('================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

