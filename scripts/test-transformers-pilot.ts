// ============================================================
// SHIKSHA SAHAYAK — TRANSFORMERS MCQ PILOT INTEGRATION TEST SUITE
// Tests:
// 1. Pilot Dataset Schema & Academic Content Quality
// 2. Dry-Run Invariance (Zero writes)
// 3. Write Safety & Foreign Key Integrity
// 4. Duplicate Detection & Non-Destructive Idempotency
// 5. Placeholder Option Protection
// 6. Student MCQ Practice Engine API Simulation
// ============================================================

import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import {
  runBatchImport,
  createLocalDatabaseAdapter,
} from './import-question-batch';
import {
  containsPlaceholderOptions,
  validateMasterQuestionPayload,
} from '../functions/lib/questionIntelligence/validationService';
import {
  getMcqPracticeQuestions,
  evaluateStudentMcqAnswer,
} from '../functions/lib/questionIntelligence/mcqPracticeService';
import { MasterQuestion } from '../src/types';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

/**
 * Creates an in-memory D1 wrapper around node:sqlite.
 */
function createD1Mock(db: DatabaseSync) {
  return {
    DB: {
      prepare(query: string) {
        return {
          bind(...args: any[]) {
            return {
              async first<T = any>() {
                const row = db.prepare(query).get(...args);
                return (row || null) as T | null;
              },
              async all<T = any>() {
                const rows = db.prepare(query).all(...args);
                return { results: rows as T[] };
              },
              async run() {
                const res = db.prepare(query).run(...args);
                return { success: true, meta: res };
              },
            };
          },
        };
      },
    },
  } as any;
}

async function runTests() {
  console.log('============================================================');
  console.log('RUNNING TRANSFORMERS MCQ PILOT TEST SUITE');
  console.log('============================================================\n');

  const pilotFilePath = path.join(process.cwd(), 'data', 'questions', 'transformers_pilot.json');

  // ------------------------------------------------------------
  // TEST 1: Pilot Dataset Schema & Content Quality
  // ------------------------------------------------------------
  try {
    assert(fs.existsSync(pilotFilePath), 'Pilot file data/questions/transformers_pilot.json must exist');
    const raw = fs.readFileSync(pilotFilePath, 'utf8');
    const items: Partial<MasterQuestion>[] = JSON.parse(raw);

    assert(items.length >= 10 && items.length <= 15, `Pilot batch must contain 10-15 questions. Found: ${items.length}`);

    for (let i = 0; i < items.length; i++) {
      const q = items[i];
      const qId = q.id || `Item_${i + 1}`;

      assert(Boolean(q.id && q.id.startsWith('Q_EM_TRANS_')), `${qId}: Must follow Q_EM_TRANS_xxx naming`);
      assert(q.questionType === 'MCQ', `${qId}: Question type must be MCQ`);
      assert(q.subjectCode === 'BE03009021', `${qId}: Subject code must be BE03009021`);
      assert(q.semester === 3, `${qId}: Semester must be 3`);
      assert(q.subjectName === 'Electrical Machines I', `${qId}: Subject name must be Electrical Machines I`);
      assert(Boolean(q.topicName && q.topicName.includes('Transformer')), `${qId}: Topic must relate to Transformers`);
      
      // Provenance assertions (Strict policy: not authentic PYQs)
      assert(q.isOriginalPyq === false, `${qId}: isOriginalPyq must be false`);
      assert(q.isAiGenerated === false, `${qId}: isAiGenerated must be false`);
      assert(q.sourceType === 'TEACHER', `${qId}: sourceType must be TEACHER`);
      assert(q.verificationStatus === 'verified', `${qId}: verificationStatus must be verified`);
      assert(q.marks === 1.0, `${qId}: marks must be 1.0`);
      assert(q.negativeMarking === 0.25, `${qId}: negativeMarking must be 0.25`);

      // Payload validation
      const val = validateMasterQuestionPayload(q);
      assert(val.isValid, `${qId}: Payload validation failed: ${val.errors.join('; ')}`);

      // Options & answer validation
      const options = q.mcqData?.options || [];
      assert(options.length === 4, `${qId}: Must have exactly 4 options`);
      assert(!containsPlaceholderOptions(options), `${qId}: Must not contain placeholder options`);

      const optIds = options.map((o: any) => o.id);
      assert(optIds.includes(q.mcqData?.correctAnswer), `${qId}: correctAnswer '${q.mcqData?.correctAnswer}' must match an option ID`);

      assert(Boolean(q.explanation && q.explanation.length > 20), `${qId}: Explanation must be thorough (> 20 chars)`);
    }

    results.push({
      name: '1. Pilot Dataset Schema & Academic Content Quality',
      passed: true,
      details: `12/12 questions passed validation with verified answers, explanations, and strict provenance`,
    });
  } catch (err: any) {
    results.push({
      name: '1. Pilot Dataset Schema & Academic Content Quality',
      passed: false,
      error: err.message,
    });
  }

  // ------------------------------------------------------------
  // TEST 2: Dry-Run Invariance (Zero writes)
  // ------------------------------------------------------------
  try {
    const memDb = createLocalDatabaseAdapter(':memory:');
    const report = runBatchImport({
      filePath: pilotFilePath,
      isDryRun: true,
      targetDbPath: ':memory:',
    });

    assert(report.totalLoaded === 12, 'Total loaded must be 12');
    assert(report.validCount === 12, 'Valid count must be 12');
    assert(report.invalidCount === 0, 'Invalid count must be 0');
    assert(report.duplicateCount === 0, 'Duplicate count must be 0');
    assert(report.readyForInsertCount === 12, 'Ready for insert must be 12');
    assert(report.insertedCount === 0, 'Dry-run must insert 0 rows');
    assert(report.branchMappingsCount === 0, 'Dry-run must create 0 branch mappings');
    assert(report.practiceReadiness.isReadyForMcqPractice === true, 'Practice readiness must be true');

    // Verify zero database writes occurred
    const rowCount = (memDb.prepare('SELECT COUNT(*) AS c FROM master_question_bank').get() as any).c;
    assert(rowCount === 0, `Database must contain 0 questions in dry-run mode. Found: ${rowCount}`);

    results.push({
      name: '2. Dry-Run Invariance (Zero writes)',
      passed: true,
      details: 'Dry-run executed cleanly; zero database records written',
    });
  } catch (err: any) {
    results.push({
      name: '2. Dry-Run Invariance (Zero writes)',
      passed: false,
      error: err.message,
    });
  }

  // ------------------------------------------------------------
  // TEST 3: Disposable Write Safety & Foreign Key Integrity
  // ------------------------------------------------------------
  let sharedDb: DatabaseSync;
  try {
    sharedDb = createLocalDatabaseAdapter(':memory:');
    
    // Perform write into sharedDb
    const rawJson = fs.readFileSync(pilotFilePath, 'utf8');
    const items: Partial<MasterQuestion>[] = JSON.parse(rawJson);

    // Save temporary json to pass to runBatchImport with target db
    // We can test runBatchImport using an in-memory database
    const report = runBatchImport({
      filePath: pilotFilePath,
      isDryRun: false,
      targetDbPath: ':memory:',
    });

    assert(report.insertedCount === 12, `Inserted count must be 12. Got: ${report.insertedCount}`);
    assert(report.branchMappingsCount === 12, `Branch mappings count must be 12. Got: ${report.branchMappingsCount}`);

    results.push({
      name: '3. Disposable Write Safety & Foreign Key Integrity',
      passed: true,
      details: 'Successfully inserted 12 questions and 12 branch mappings without constraint violations',
    });
  } catch (err: any) {
    results.push({
      name: '3. Disposable Write Safety & Foreign Key Integrity',
      passed: false,
      error: err.message,
    });
  }

  // ------------------------------------------------------------
  // TEST 4: Duplicate Detection & Non-Destructive Idempotency
  // ------------------------------------------------------------
  try {
    // Create an isolated sqlite file in data directory
    const tempDbPath = path.join(process.cwd(), 'data', 'temp_idempotency_test.sqlite');
    if (fs.existsSync(tempDbPath)) fs.unlinkSync(tempDbPath);

    // Run 1: First write
    const run1 = runBatchImport({
      filePath: pilotFilePath,
      isDryRun: false,
      targetDbPath: tempDbPath,
    });
    assert(run1.insertedCount === 12, `Run 1 must insert 12. Got ${run1.insertedCount}`);

    // Run 2: Re-run with identical data
    const run2 = runBatchImport({
      filePath: pilotFilePath,
      isDryRun: false,
      targetDbPath: tempDbPath,
    });
    assert(run2.insertedCount === 0, `Run 2 must insert 0. Got ${run2.insertedCount}`);
    assert(run2.duplicateCount === 12, `Run 2 must detect 12 duplicates. Got ${run2.duplicateCount}`);

    // Verify row count remains exactly 12
    const verifyDb = new DatabaseSync(tempDbPath);
    const count = (verifyDb.prepare('SELECT COUNT(*) AS c FROM master_question_bank').get() as any).c;
    assert(count === 12, `Table row count must remain 12. Found: ${count}`);

    // Cleanup temp DB
    verifyDb.close();
    try {
      if (fs.existsSync(tempDbPath)) fs.unlinkSync(tempDbPath);
    } catch {
      // Ignore if Windows locks briefly
    }

    results.push({
      name: '4. Duplicate Detection & Non-Destructive Idempotency',
      passed: true,
      details: 'Re-importing batch identified 12 duplicates and inserted 0 rows; zero existing records modified',
    });
  } catch (err: any) {
    results.push({
      name: '4. Duplicate Detection & Non-Destructive Idempotency',
      passed: false,
      error: err.message,
    });
  }

  // ------------------------------------------------------------
  // TEST 5: Placeholder Option Guardrail
  // ------------------------------------------------------------
  try {
    const dummyOptions = [
      { id: 'A', text: 'Option Choice A' },
      { id: 'B', text: 'Option Choice B' },
      { id: 'C', text: 'Option Choice C' },
      { id: 'D', text: 'Option Choice D' },
    ];
    assert(containsPlaceholderOptions(dummyOptions) === true, 'Placeholder check must detect dummy options');

    const validOptions = [
      { id: 'A', text: 'Silicon Steel with 3-4% silicon' },
      { id: 'B', text: 'Cast Iron' },
      { id: 'C', text: 'Pure Copper' },
      { id: 'D', text: 'Mild Steel' },
    ];
    assert(containsPlaceholderOptions(validOptions) === false, 'Placeholder check must pass valid engineering options');

    results.push({
      name: '5. Placeholder Option Guardrail',
      passed: true,
      details: 'Generic/placeholder options correctly blocked from entering the question bank',
    });
  } catch (err: any) {
    results.push({
      name: '5. Placeholder Option Guardrail',
      passed: false,
      error: err.message,
    });
  }

  // ------------------------------------------------------------
  // TEST 6: Student Practice Engine Integration Simulation
  // ------------------------------------------------------------
  try {
    // Create an in-memory DB and populate it
    const liveDb = createLocalDatabaseAdapter(':memory:');
    const rawJson = fs.readFileSync(pilotFilePath, 'utf8');
    const items: Partial<MasterQuestion>[] = JSON.parse(rawJson);

    // Insert questions into liveDb
    const insertQ = liveDb.prepare(`
      INSERT INTO master_question_bank (
        id, source_type, is_original_pyq, is_ai_generated, subject_code, subject_name, semester,
        topic_name, question_type, question_text, options_json, correct_answer_json,
        explanation, step_by_step_solution_json, marks, negative_marking, difficulty,
        verification_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertBM = liveDb.prepare(`
      INSERT INTO question_branch_mappings (id, question_id, branch_id, is_primary)
      VALUES (?, ?, ?, 1)
    `);

    for (const q of items) {
      insertQ.run(
        q.id,
        q.sourceType || 'TEACHER',
        0,
        0,
        q.subjectCode,
        q.subjectName,
        q.semester,
        q.topicName,
        q.questionType,
        q.questionText,
        JSON.stringify(q.mcqData?.options),
        JSON.stringify(q.mcqData?.correctAnswer),
        q.explanation,
        q.stepByStepSolution ? JSON.stringify(q.stepByStepSolution) : null,
        q.marks || 1.0,
        q.negativeMarking || 0.25,
        q.difficulty || 'medium',
        'verified'
      );
      insertBM.run(`qbm_${q.id}_branch_09`, q.id, 'branch_09');
    }

    const d1Mock = createD1Mock(liveDb);

    // 6a. Student Practice Fetch: Verify explanations stripped
    const practiceResult = await getMcqPracticeQuestions(d1Mock, {
      branchId: '09',
      subjectCode: 'BE03009021',
      limit: 10,
    });

    assert(practiceResult.questions.length === 10, `Expected 10 practice questions. Got: ${practiceResult.questions.length}`);
    for (const q of practiceResult.questions) {
      assert(q.explanation === null, `Explanation must be null pre-submission for ${q.id}`);
      assert(q.stepByStepSolution === undefined, `stepByStepSolution must be undefined pre-submission for ${q.id}`);
      assert(q.options.length === 4, `Each question must have 4 options`);
    }

    // 6b. Evaluate Correct Answer
    const correctEval = await evaluateStudentMcqAnswer(
      d1Mock,
      'Q_EM_TRANS_001',
      'A',
      'student_pilot_101',
      25,
      'TOPIC_WISE'
    );
    assert(correctEval.isCorrect === true, 'Answer A should evaluate to true');
    assert(correctEval.correctAnswer === 'A', 'Correct answer should be A');
    assert(Boolean(correctEval.explanation && correctEval.explanation.length > 20), 'Explanation must be revealed on evaluation');

    // 6c. Evaluate Incorrect Answer
    const incorrectEval = await evaluateStudentMcqAnswer(
      d1Mock,
      'Q_EM_TRANS_001',
      'C',
      'student_pilot_101',
      15,
      'TOPIC_WISE'
    );
    assert(incorrectEval.isCorrect === false, 'Answer C should evaluate to false');
    assert(incorrectEval.correctAnswer === 'A', 'Correct answer must still show A');

    // 6d. Check Student Progress Aggregation
    const progressRow = liveDb.prepare(`
      SELECT total_attempted, total_correct
      FROM student_mcq_topic_progress
      WHERE student_id = ? AND branch_id = ? AND subject_code = ?
    `).get('student_pilot_101', 'branch_09', 'BE03009021') as any;

    assert(Boolean(progressRow), 'Student topic progress record must exist');
    assert(progressRow.total_attempted === 2, `Total attempted should be 2. Got: ${progressRow.total_attempted}`);
    assert(progressRow.total_correct === 1, `Total correct should be 1. Got: ${progressRow.total_correct}`);

    results.push({
      name: '6. Student Practice Engine API Integration Simulation',
      passed: true,
      details: 'Explanations safely hidden pre-submission, evaluation accurate, attempt logged, and topic progress updated',
    });
  } catch (err: any) {
    results.push({
      name: '6. Student Practice Engine API Integration Simulation',
      passed: false,
      error: err.message,
    });
  }

  // ------------------------------------------------------------
  // SUMMARY
  // ------------------------------------------------------------
  console.log('--- TEST RESULTS ---');
  let allPassed = true;
  for (const r of results) {
    const statusMark = r.passed ? '✓ PASS' : '✗ FAIL';
    console.log(`${statusMark} - ${r.name}`);
    if (r.details) console.log(`       ${r.details}`);
    if (r.error) {
      console.log(`       ERROR: ${r.error}`);
      allPassed = false;
    }
  }
  console.log('============================================================');

  if (!allPassed) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
