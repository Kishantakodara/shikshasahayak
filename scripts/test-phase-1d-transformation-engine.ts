// ============================================================
// PHASE 1D: QUESTION TRANSFORMATION & VALIDATION ENGINE TEST SUITE
// Command: npx tsx scripts/test-phase-1d-transformation-engine.ts
// ============================================================

import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import {
  transformGtuPyqToObjective,
  evaluateQuestionSuitability,
  ingestGateQuestionPayload,
  ingestGateBatchPayload,
  validateTechnicalQuestion,
  validateMcqTechnicalQuality,
  validateMsqTechnicalQuality,
  validateNatTechnicalQuality,
  getQueuedQuestions,
  approveQueuedQuestion,
  getQuestionById,
  detectDuplicateQuestionAsync,
} from '../functions/lib/questionIntelligence';

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

async function runPhase1dTestSuite() {
  console.log('================================================================');
  console.log('🧪 RUNNING PHASE 1D: QUESTION TRANSFORMATION & VALIDATION TEST SUITE');
  console.log('================================================================\n');

  const mockDb = createMockD1Database();
  const env = { DB: mockDb as any };

  let passedTests = 0;
  const totalTests = 13;

  // ------------------------------------------------------------
  // TEST 1: GTU PYQ -> MCQ Transformation
  // ------------------------------------------------------------
  console.log('➡️ Test 1: GTU PYQ -> MCQ Transformation');
  try {
    const res = await transformGtuPyqToObjective(env, {
      originalQuestionId: 'gtu_q101',
      sourcePaperId: 'gtu_paper_W2024_BE_3110014',
      sourceUrl: 'https://www.gtu.ac.in/api/v1/question-papers/archive/file/W2024/BE/3110014.pdf',
      examYear: 2024,
      examSession: 'WINTER',
      sourceQuestionNo: 'Q.1(a)',
      subjectCode: '3110014',
      subjectName: 'Mathematics - 1',
      semester: 1,
      topicName: 'Calculus',
      rawQuestionText: 'What is the limit of (1 + 1/n)^n as n approaches infinity?',
      applicableBranchIds: ['branch_07', 'branch_16'],
    });

    if (res.success && res.transformedPayload?.questionType === 'MCQ' && res.queueItemId) {
      console.log(`  ✓ PASSED: GTU PYQ transformed into MCQ (Queue ID: ${res.queueItemId})`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: GTU PYQ -> MCQ transformation failed', res);
    }
  } catch (err) {
    console.error('  ❌ FAILED: GTU -> MCQ transformation threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 2: GTU PYQ -> NAT Transformation
  // ------------------------------------------------------------
  console.log('\n➡️ Test 2: GTU PYQ -> NAT Transformation');
  try {
    const res = await transformGtuPyqToObjective(env, {
      originalQuestionId: 'gtu_q102',
      sourcePaperId: 'gtu_paper_W2024_BE_3110014',
      sourceUrl: 'https://www.gtu.ac.in/api/v1/question-papers/archive/file/W2024/BE/3110014.pdf',
      examYear: 2024,
      examSession: 'WINTER',
      sourceQuestionNo: 'Q.2(a)',
      subjectCode: '3110014',
      subjectName: 'Mathematics - 1',
      semester: 1,
      topicName: 'Integration',
      rawQuestionText: 'Evaluate the definite integral of x dx from 0 to 2.',
      applicableBranchIds: ['branch_07'],
    });

    if (res.success && res.transformedPayload?.questionType === 'NAT' && res.transformedPayload.natData?.exactValue === 1.0) {
      console.log(`  ✓ PASSED: GTU PYQ transformed into NAT (Queue ID: ${res.queueItemId})`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: GTU PYQ -> NAT transformation failed', res);
    }
  } catch (err) {
    console.error('  ❌ FAILED: GTU -> NAT transformation threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 3: Unsuitable Descriptive GTU Question -> NEEDS_REVIEW
  // ------------------------------------------------------------
  console.log('\n➡️ Test 3: Unsuitable Descriptive Question -> NEEDS_REVIEW');
  try {
    const res = await transformGtuPyqToObjective(env, {
      originalQuestionId: 'gtu_q103',
      sourcePaperId: 'gtu_paper_W2024_BE_3110005',
      sourceUrl: 'https://www.gtu.ac.in/api/v1/question-papers/archive/file/W2024/BE/3110005.pdf',
      examYear: 2024,
      examSession: 'WINTER',
      sourceQuestionNo: 'Q.4(c)',
      subjectCode: '3110005',
      subjectName: 'Basic Electrical Engineering',
      semester: 1,
      topicName: 'Transformers',
      rawQuestionText: 'Draw neatly labeled diagram and explain in detail working principle of 3-phase transformer.',
      applicableBranchIds: ['branch_09'],
    });

    if (res.status === 'NEEDS_REVIEW' && !res.success && res.queueItemId) {
      console.log(`  ✓ PASSED: Correctly marked descriptive prompt as NEEDS_REVIEW (Reason: ${res.rejectionReason})`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Descriptive prompt was not marked NEEDS_REVIEW', res);
    }
  } catch (err) {
    console.error('  ❌ FAILED: Unsuitable question check threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 4: GATE Original MCQ Ingestion
  // ------------------------------------------------------------
  console.log('\n➡️ Test 4: GATE Original MCQ Ingestion');
  try {
    const res = await ingestGateQuestionPayload(env, {
      gateYear: 2024,
      gatePaper: 'CSE',
      questionNo: 'Q.14',
      questionType: 'MCQ',
      questionText: 'Which of the following data structures has O(1) worst-case time complexity for search?',
      options: [
        { id: 'A', text: 'Direct Address Table' },
        { id: 'B', text: 'Binary Search Tree' },
        { id: 'C', text: 'Splay Tree' },
        { id: 'D', text: 'Skip List' },
      ],
      correctAnswer: 'A',
      explanation: 'Direct address table achieves O(1) lookup when keys are bounded.',
      marks: 1,
    });

    if (res.success && res.status === 'VERIFIED' && res.questionPayload?.isOriginalPyq === true && res.questionPayload?.isAiGenerated === false) {
      console.log(`  ✓ PASSED: Original GATE MCQ ingested into staging queue with ORIGINAL provenance`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: GATE MCQ ingestion failed', res);
    }
  } catch (err) {
    console.error('  ❌ FAILED: GATE MCQ ingestion threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 5: GATE Original MSQ Ingestion
  // ------------------------------------------------------------
  console.log('\n➡️ Test 5: GATE Original MSQ Ingestion');
  try {
    const res = await ingestGateQuestionPayload(env, {
      gateYear: 2024,
      gatePaper: 'CSE',
      questionNo: 'Q.25',
      questionType: 'MSQ',
      questionText: 'Which of the following statements are TRUE for regular languages?',
      options: [
        { id: 'A', text: 'Closed under union' },
        { id: 'B', text: 'Closed under intersection' },
        { id: 'C', text: 'Closed under complementation' },
        { id: 'D', text: 'Undecidable emptiness problem' },
      ],
      correctAnswers: ['A', 'B', 'C'],
      explanation: 'Regular languages are closed under union, intersection, and complementation.',
      marks: 2,
    });

    if (res.success && res.questionPayload?.questionType === 'MSQ' && res.questionPayload?.msqData?.correctAnswers.length === 3) {
      console.log(`  ✓ PASSED: Original GATE MSQ ingested cleanly with 3 correct options`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: GATE MSQ ingestion failed', res);
    }
  } catch (err) {
    console.error('  ❌ FAILED: GATE MSQ ingestion threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 6: GATE Original NAT Ingestion
  // ------------------------------------------------------------
  console.log('\n➡️ Test 6: GATE Original NAT Ingestion');
  try {
    const res = await ingestGateQuestionPayload(env, {
      gateYear: 2024,
      gatePaper: 'ECE',
      questionNo: 'Q.42',
      questionType: 'NAT',
      questionText: 'Consider a unity feedback system with open loop transfer function G(s) = 10 / (s + 2). Calculate the steady state error for unit step input.',
      exactNumericalValue: 0.166,
      acceptableNumericalRange: { min: 0.15, max: 0.18 },
      explanation: 'e_ss = 1 / (1 + K_p) where K_p = lim s->0 G(s) = 5. e_ss = 1/6 = 0.166.',
      marks: 2,
    });

    if (res.success && res.questionPayload?.questionType === 'NAT' && res.questionPayload.natData?.acceptableRange.min === 0.15) {
      console.log(`  ✓ PASSED: Original GATE NAT ingested cleanly with numerical range [0.15, 0.18]`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: GATE NAT ingestion failed', res);
    }
  } catch (err) {
    console.error('  ❌ FAILED: GATE NAT ingestion threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 7: Technical Validator - Option Count & Duplicate Option Check
  // ------------------------------------------------------------
  console.log('\n➡️ Test 7: Technical Validator - Option Count & Duplicate Option Check');
  try {
    const dupOptionRes = validateMcqTechnicalQuality({
      questionType: 'MCQ',
      mcqData: {
        options: [
          { id: 'A', text: 'Option A' },
          { id: 'B', text: 'Option A' }, // Duplicate text!
          { id: 'C', text: 'Option C' },
          { id: 'D', text: 'Option D' },
        ],
        correctAnswer: 'A',
      },
    });

    if (!dupOptionRes.isValid && dupOptionRes.errors.some(e => e.includes('duplicate option choices'))) {
      console.log(`  ✓ PASSED: Technical validator correctly flagged duplicate option texts`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Duplicate option text check failed', dupOptionRes);
    }
  } catch (err) {
    console.error('  ❌ FAILED: Duplicate option check threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 8: Technical Validator - NAT Range Check (min <= max)
  // ------------------------------------------------------------
  console.log('\n➡️ Test 8: Technical Validator - NAT Range Check');
  try {
    const invRangeRes = validateNatTechnicalQuality({
      questionType: 'NAT',
      natData: {
        exactValue: 5,
        acceptableRange: { min: 10, max: 5 }, // min > max error!
      },
    });

    if (!invRangeRes.isValid && invRangeRes.errors.some(e => e.includes('cannot exceed max'))) {
      console.log(`  ✓ PASSED: Technical validator correctly flagged invalid NAT range (min > max)`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Invalid NAT range check failed', invRangeRes);
    }
  } catch (err) {
    console.error('  ❌ FAILED: NAT range check threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 9: Provenance Mutual Exclusivity Protection
  // ------------------------------------------------------------
  console.log('\n➡️ Test 9: Provenance Mutual Exclusivity Protection');
  try {
    const conflictRes = validateTechnicalQuestion({
      questionText: 'Test question text',
      questionType: 'MCQ',
      isOriginalPyq: true,
      isAiGenerated: true, // Conflict!
      mcqData: {
        options: [
          { id: 'A', text: 'A' },
          { id: 'B', text: 'B' },
          { id: 'C', text: 'C' },
          { id: 'D', text: 'D' },
        ],
        correctAnswer: 'A',
      },
    });

    if (!conflictRes.isValid && conflictRes.errors.some(e => e.includes('CANNOT be marked as both'))) {
      console.log(`  ✓ PASSED: Provenance validator enforced strict mutual exclusivity (Original vs AI)`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Provenance mutual exclusivity check failed', conflictRes);
    }
  } catch (err) {
    console.error('  ❌ FAILED: Provenance check threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 10: Multi-Branch Mapping for GATE Papers
  // ------------------------------------------------------------
  console.log('\n➡️ Test 10: Multi-Branch Mapping for GATE Papers');
  try {
    const gateRes = await ingestGateQuestionPayload(env, {
      gateYear: 2024,
      gatePaper: 'CSE',
      questionNo: 'Q.01',
      questionType: 'MCQ',
      questionText: 'Let A be a 3x3 matrix. What is det(2A)?',
      options: [
        { id: 'A', text: '8 det(A)' },
        { id: 'B', text: '6 det(A)' },
        { id: 'C', text: '2 det(A)' },
        { id: 'D', text: 'det(A)' },
      ],
      correctAnswer: 'A',
    });

    if (gateRes.questionPayload?.applicableBranches?.length === 3) {
      console.log(`  ✓ PASSED: GATE CSE paper mapped to 3 relevant engineering branches (CE, CSE, AI-DS)`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Multi-branch mapping for GATE paper failed', gateRes.questionPayload?.applicableBranches);
    }
  } catch (err) {
    console.error('  ❌ FAILED: Multi-branch mapping check threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 11: Queue Staging & Approval Status Transition
  // ------------------------------------------------------------
  console.log('\n➡️ Test 11: Queue Staging & Approval Status Transition');
  try {
    const gateRes = await ingestGateQuestionPayload(env, {
      gateYear: 2023,
      gatePaper: 'EE',
      questionNo: 'Q.05',
      questionType: 'NAT',
      questionText: 'Calculate the RMS value of sinusoidal voltage v(t) = 100 sin(100t) V.',
      exactNumericalValue: 70.7,
      acceptableNumericalRange: { min: 70.0, max: 71.0 },
    });

    const approvalRes = await approveQueuedQuestion(env, gateRes.queueItemId!, 'admin_ayush', ['branch_09']);
    const approvedQuestion = await getQuestionById(env, approvalRes.questionId!);

    if (approvalRes.success && approvedQuestion?.verificationStatus === 'verified') {
      console.log(`  ✓ PASSED: Staged GATE payload transitioned cleanly to 'verified' in Master Question Bank (ID: ${approvalRes.questionId})`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Queue approval transition failed', approvalRes);
    }
  } catch (err) {
    console.error('  ❌ FAILED: Status transition check threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 12: Duplicate Candidate Protection
  // ------------------------------------------------------------
  console.log('\n➡️ Test 12: Duplicate Candidate Protection');
  try {
    const dupRes = await ingestGateQuestionPayload(env, {
      gateYear: 2023,
      gatePaper: 'EE',
      questionNo: 'Q.05-dup',
      questionType: 'NAT',
      questionText: 'Calculate RMS value of sinusoidal voltage v(t) = 100 sin(100t) V.', // Duplicate text!
      exactNumericalValue: 70.7,
    });

    if (dupRes.isDuplicateCandidate === true) {
      console.log(`  ✓ PASSED: Duplicate detection identified near-duplicate GATE question and flagged for review`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Duplicate detection failed to flag candidate', dupRes);
    }
  } catch (err) {
    console.error('  ❌ FAILED: Duplicate candidate check threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 13: Batch GATE Ingestion Pipeline
  // ------------------------------------------------------------
  console.log('\n➡️ Test 13: Batch GATE Ingestion Pipeline');
  try {
    const batchRes = await ingestGateBatchPayload(env, [
      {
        gateYear: 2024,
        gatePaper: 'ME',
        questionNo: 'Q.01',
        questionType: 'MCQ',
        questionText: 'What is the Poisson ratio for ideal incompressible material?',
        options: [
          { id: 'A', text: '0.5' },
          { id: 'B', text: '0.3' },
          { id: 'C', text: '0.0' },
          { id: 'D', text: '1.0' },
        ],
        correctAnswer: 'A',
      },
      {
        gateYear: 2024,
        gatePaper: 'CE',
        questionNo: 'Q.02',
        questionType: 'NAT',
        questionText: 'Calculate the void ratio if porosity is 0.333.',
        exactNumericalValue: 0.5,
      },
    ]);

    if (batchRes.ingestedCount === 2 && batchRes.results.every(r => r.success)) {
      console.log(`  ✓ PASSED: Successfully ingested batch of ${batchRes.ingestedCount} GATE questions`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Batch GATE ingestion failed', batchRes);
    }
  } catch (err) {
    console.error('  ❌ FAILED: Batch GATE ingestion threw error:', err);
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

runPhase1dTestSuite().catch(err => {
  console.error('Fatal Phase 1D test error:', err);
  process.exit(1);
});
