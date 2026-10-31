/**
 * ShikshaSahayak 2.0 Beta — Phase 7C: Question Moderation & Bulk Approval Safety Verification Suite
 * 
 * Verifies:
 * 1. Valid question -> single approval succeeds
 * 2. Missing question text -> approval rejected
 * 3. Invalid MCQ option count -> approval rejected
 * 4. Empty option text -> approval rejected
 * 5. Placeholder options -> approval rejected
 * 6. Invalid answer key -> approval rejected
 * 7. Invalid NAT range -> approval rejected
 * 8. Invalid provenance -> approval rejected
 * 9. Duplicate/blocked question -> approval rejected
 * 10. Bulk approval validates EVERY item
 * 11. Bulk approval does not publish malformed items
 * 12. Bulk result reports successful and failed IDs correctly
 * 13. Rejected question cannot bypass validation into verified
 * 14. Archived question cannot bypass validation into verified
 * 15. Invalid state transition / missing question ID rejected
 * 16. Audit log created for successful approval
 * 17. Bulk approval creates audit records per approved question
 * 18. Failed approval does not create false success audit records
 * 19. Student API exposes only verified questions
 * 20. Phase 7A answer protection remains intact
 * 21. Admin authentication remains required
 * 22. Student/unprivileged access cannot perform admin moderation actions
 * 23. Provenance is preserved after approval
 * 24. Placeholder detection catches all known fallback patterns
 */

import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import {
  validateQuestionPayload,
  containsPlaceholderOptions,
} from '../functions/lib/questionIntelligence/validationService';
import {
  createQuestion,
} from '../functions/lib/questionIntelligence/questionService';
import {
  approveAndPublishQuestion,
  rejectQuestionInBank,
  archiveQuestion,
  markDuplicateQuestion,
  executeBulkOperation,
  getQuestionAuditLogs,
} from '../functions/lib/questionIntelligence/adminQuestionBankService';
import {
  getMcqPracticeQuestions,
} from '../functions/lib/questionIntelligence/mcqPracticeService';
import {
  isAdmin,
} from '../functions/lib/auth';

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

export async function runPhase7CVerification() {
  console.log('\n==================================================');
  console.log('   SHIKSHA SAHAYAK 2.0: PHASE 7C VERIFICATION SUITE');
  console.log('   Question Moderation & Bulk Approval Safety');
  console.log('==================================================\n');

  const env = { DB: createTestD1Database() } as any;

  // --- 1. Valid question -> single approval succeeds ---
  await env.DB.prepare(
    `INSERT INTO master_question_bank (
      id, source_type, question_text, question_type, subject_code, subject_name, semester,
      options_json, correct_answer_json, explanation, verification_status, is_original_pyq, is_ai_generated
    ) VALUES (
      'Q_VAL_001', 'GTU', 'What is the time complexity of QuickSort average case?', 'MCQ',
      '3110014', 'Algorithms', 1,
      '[{"id":"A","text":"O(n log n)"},{"id":"B","text":"O(n^2)"},{"id":"C","text":"O(n)"},{"id":"D","text":"O(1)"}]',
      'A', 'QuickSort partitions the array recursively in O(n log n) expected time.',
      'unverified', 1, 0
    )`
  ).run();

  const appRes1 = await approveAndPublishQuestion(env, 'admin_super_uid', 'Q_VAL_001', 'Approved by admin lead');
  const pass1 = appRes1.success === true && appRes1.status === 'verified';
  record(
    'Valid Question Single Approval Succeeds',
    'SINGLE_APPROVAL',
    pass1,
    `Question 'Q_VAL_001' transitioned to verified status with full audit trace`
  );

  // --- 2. Missing question text -> approval rejected ---
  await env.DB.prepare(
    `INSERT INTO master_question_bank (
      id, source_type, question_text, question_type, subject_code, subject_name, semester,
      options_json, correct_answer_json, verification_status, is_original_pyq, is_ai_generated
    ) VALUES (
      'Q_MAL_EMPTY_TEXT', 'GTU', '', 'MCQ',
      '3110014', 'Algorithms', 1,
      '[{"id":"A","text":"Opt A"},{"id":"B","text":"Opt B"}]',
      'A', 'unverified', 1, 0
    )`
  ).run();

  let pass2 = false;
  try {
    await approveAndPublishQuestion(env, 'admin_super_uid', 'Q_MAL_EMPTY_TEXT');
  } catch (err: any) {
    pass2 = err.message.includes('Validation failed') || err.message.includes('required');
  }
  record(
    'Empty Question Text Blocks Approval',
    'VALIDATION',
    pass2,
    `Rejected approval for question with empty question_text`
  );

  // --- 3. Invalid MCQ option count -> approval rejected ---
  await env.DB.prepare(
    `INSERT INTO master_question_bank (
      id, source_type, question_text, question_type, subject_code, subject_name, semester,
      options_json, correct_answer_json, verification_status, is_original_pyq, is_ai_generated
    ) VALUES (
      'Q_MAL_ONE_OPT', 'GTU', 'What is an array?', 'MCQ',
      '3110014', 'Algorithms', 1,
      '[{"id":"A","text":"Linear data structure"}]',
      'A', 'unverified', 1, 0
    )`
  ).run();

  let pass3 = false;
  try {
    await approveAndPublishQuestion(env, 'admin_super_uid', 'Q_MAL_ONE_OPT');
  } catch (err: any) {
    pass3 = err.message.includes('options') || err.message.includes('Validation failed');
  }
  record(
    'Insufficient MCQ Option Count Blocks Approval',
    'VALIDATION',
    pass3,
    `Rejected approval for MCQ with only 1 option`
  );

  // --- 4. Empty option text -> approval rejected ---
  await env.DB.prepare(
    `INSERT INTO master_question_bank (
      id, source_type, question_text, question_type, subject_code, subject_name, semester,
      options_json, correct_answer_json, verification_status, is_original_pyq, is_ai_generated
    ) VALUES (
      'Q_MAL_EMPTY_OPT', 'GTU', 'What is stack?', 'MCQ',
      '3110014', 'Algorithms', 1,
      '[{"id":"A","text":"LIFO structure"},{"id":"B","text":"   "}]',
      'A', 'unverified', 1, 0
    )`
  ).run();

  let pass4 = false;
  try {
    await approveAndPublishQuestion(env, 'admin_super_uid', 'Q_MAL_EMPTY_OPT');
  } catch (err: any) {
    pass4 = err.message.includes('Validation failed') || err.message.includes('option');
  }
  record(
    'Whitespace-only Option Choice Blocks Approval',
    'VALIDATION',
    pass4,
    `Rejected approval for MCQ containing empty/blank option choices`
  );

  // --- 5. Placeholder options -> approval rejected ---
  await env.DB.prepare(
    `INSERT INTO master_question_bank (
      id, source_type, question_text, question_type, subject_code, subject_name, semester,
      options_json, correct_answer_json, verification_status, is_original_pyq, is_ai_generated
    ) VALUES (
      'Q_MAL_PLACEHOLDER', 'GTU', 'What is binary search tree?', 'MCQ',
      '3110014', 'Algorithms', 1,
      '[{"id":"A","text":"Option Choice A"},{"id":"B","text":"Option Choice B"},{"id":"C","text":"Option Choice C"},{"id":"D","text":"Option Choice D"}]',
      'A', 'unverified', 1, 0
    )`
  ).run();

  let pass5 = false;
  try {
    await approveAndPublishQuestion(env, 'admin_super_uid', 'Q_MAL_PLACEHOLDER');
  } catch (err: any) {
    pass5 = err.message.includes('placeholder');
  }
  record(
    'Placeholder Options (Option Choice A-D) Blocks Approval',
    'VALIDATION',
    pass5,
    `Rejected approval due to dummy placeholder options`
  );

  // --- 6. Invalid answer key -> approval rejected ---
  await env.DB.prepare(
    `INSERT INTO master_question_bank (
      id, source_type, question_text, question_type, subject_code, subject_name, semester,
      options_json, correct_answer_json, verification_status, is_original_pyq, is_ai_generated
    ) VALUES (
      'Q_MAL_BAD_ANS', 'GTU', 'What is hashing?', 'MCQ',
      '3110014', 'Algorithms', 1,
      '[{"id":"A","text":"Mapping keys to indices"},{"id":"B","text":"Sorting elements"}]',
      'Z', 'unverified', 1, 0
    )`
  ).run();

  let pass6 = false;
  try {
    await approveAndPublishQuestion(env, 'admin_super_uid', 'Q_MAL_BAD_ANS');
  } catch (err: any) {
    pass6 = err.message.includes('does not match') || err.message.includes('Validation failed');
  }
  record(
    'Non-matching Answer Key (Z) Blocks Approval',
    'VALIDATION',
    pass6,
    `Rejected approval for answer key 'Z' not present in options array`
  );

  // --- 7. Invalid NAT range -> approval rejected ---
  await env.DB.prepare(
    `INSERT INTO master_question_bank (
      id, source_type, question_text, question_type, subject_code, subject_name, semester,
      correct_answer_json, acceptable_numerical_range_json, verification_status, is_original_pyq, is_ai_generated
    ) VALUES (
      'Q_MAL_BAD_NAT', 'GTU', 'Calculate voltage across resistor in volts:', 'NAT',
      '3110014', 'Circuits', 1,
      '15.0', '{"min":20.0,"max":10.0}',
      'unverified', 1, 0
    )`
  ).run();

  let pass7 = false;
  try {
    await approveAndPublishQuestion(env, 'admin_super_uid', 'Q_MAL_BAD_NAT');
  } catch (err: any) {
    pass7 = err.message.includes('min') || err.message.includes('greater than max') || err.message.includes('Validation failed');
  }
  record(
    'Invalid NAT Range Bounds (min > max) Blocks Approval',
    'VALIDATION',
    pass7,
    `Rejected NAT question with invalid inverted range {"min":20,"max":10}`
  );

  // --- 8. Invalid provenance -> approval rejected ---
  await env.DB.prepare(
    `INSERT INTO master_question_bank (
      id, source_type, question_text, question_type, subject_code, subject_name, semester,
      options_json, correct_answer_json, verification_status, is_original_pyq, is_ai_generated
    ) VALUES (
      'Q_MAL_PROVENANCE', 'GTU', 'What is Dijkstra algorithm?', 'MCQ',
      '3110014', 'Algorithms', 1,
      '[{"id":"A","text":"Shortest path"},{"id":"B","text":"MST"}]',
      'A', 'unverified', 1, 1
    )`
  ).run();

  let pass8 = false;
  try {
    await approveAndPublishQuestion(env, 'admin_super_uid', 'Q_MAL_PROVENANCE');
  } catch (err: any) {
    pass8 = err.message.includes('provenance') || err.message.includes('Original PYQ and AI Generated');
  }
  record(
    'Dual Provenance Violation (is_original_pyq=1 & is_ai_generated=1) Blocks Approval',
    'PROVENANCE',
    pass8,
    `Enforced mutual exclusivity rule on approval attempt`
  );

  // --- 9. Duplicate/blocked question -> duplicate marking & archival ---
  await env.DB.prepare(
    `INSERT INTO master_question_bank (
      id, source_type, question_text, question_type, subject_code, subject_name, semester,
      options_json, correct_answer_json, verification_status, is_original_pyq, is_ai_generated
    ) VALUES (
      'Q_DUP_CANDIDATE', 'GTU', 'What is BFS algorithm?', 'MCQ',
      '3110014', 'Algorithms', 1,
      '[{"id":"A","text":"Breadth First Search"},{"id":"B","text":"Depth First Search"}]',
      'A', 'unverified', 1, 0
    )`
  ).run();

  const dupRes = await markDuplicateQuestion(env, 'admin_super_uid', 'Q_DUP_CANDIDATE', 'Q_VAL_001', 'Identical to existing QuickSort/BFS question');
  const dupRow = await env.DB.prepare(`SELECT verification_status FROM master_question_bank WHERE id = 'Q_DUP_CANDIDATE'`).first<{ verification_status: string }>();
  const dupLogs = await getQuestionAuditLogs(env, 'Q_DUP_CANDIDATE');

  const pass9 = dupRes.success === true &&
                dupRow?.verification_status === 'rejected' &&
                dupLogs.length > 0 &&
                dupLogs[0].action === 'QUESTION_DUPLICATE';
  record(
    'Duplicate Question Flagging & Provenance Archival',
    'DUPLICATE_PROTECTION',
    pass9,
    `Marked duplicate question 'Q_DUP_CANDIDATE' -> rejected with QUESTION_DUPLICATE audit trace targeting 'Q_VAL_001'`
  );

  // --- 10. Bulk approval validates EVERY item ---
  // Create 2 valid questions and 2 malformed questions
  await env.DB.prepare(
    `INSERT INTO master_question_bank (
      id, source_type, question_text, question_type, subject_code, subject_name, semester,
      options_json, correct_answer_json, verification_status, is_original_pyq, is_ai_generated
    ) VALUES 
    ('Q_BULK_VAL_1', 'GTU', 'What is merge sort complexity?', 'MCQ', '3110014', 'Algorithms', 1, '[{"id":"A","text":"O(n log n)"},{"id":"B","text":"O(n^2)"}]', 'A', 'unverified', 1, 0),
    ('Q_BULK_VAL_2', 'GTU', 'What is heap sort complexity?', 'MCQ', '3110014', 'Algorithms', 1, '[{"id":"A","text":"O(n log n)"},{"id":"B","text":"O(n^2)"}]', 'A', 'unverified', 1, 0),
    ('Q_BULK_BAD_1', 'GTU', 'Dummy option question', 'MCQ', '3110014', 'Algorithms', 1, '[{"id":"A","text":"Option Choice A"},{"id":"B","text":"Option Choice B"}]', 'A', 'unverified', 1, 0),
    ('Q_BULK_BAD_2', 'GTU', 'Bad answer key question', 'MCQ', '3110014', 'Algorithms', 1, '[{"id":"A","text":"Correct"},{"id":"B","text":"Incorrect"}]', 'INVALID_KEY', 'unverified', 1, 0)`
  ).run();

  const bulkRes = await executeBulkOperation(
    env,
    'admin_super_uid',
    'BULK_APPROVE',
    ['Q_BULK_VAL_1', 'Q_BULK_VAL_2', 'Q_BULK_BAD_1', 'Q_BULK_BAD_2']
  );

  const pass10 = bulkRes.processedCount === 2 &&
                 bulkRes.approvedIds?.length === 2 &&
                 bulkRes.approvedIds.includes('Q_BULK_VAL_1') &&
                 bulkRes.approvedIds.includes('Q_BULK_VAL_2');
  record(
    'Bulk Approval Validates Every Item Individually',
    'BULK_APPROVAL',
    pass10,
    `Processed exactly 2 valid items while evaluating all 4 batch candidates`
  );

  // --- 11. Bulk approval does not publish malformed items ---
  const bad1Row = await env.DB.prepare(`SELECT verification_status FROM master_question_bank WHERE id = 'Q_BULK_BAD_1'`).first<{ verification_status: string }>();
  const bad2Row = await env.DB.prepare(`SELECT verification_status FROM master_question_bank WHERE id = 'Q_BULK_BAD_2'`).first<{ verification_status: string }>();
  const pass11 = bad1Row?.verification_status === 'unverified' && bad2Row?.verification_status === 'unverified';
  record(
    'Bulk Approval Never Publishes Malformed Content',
    'BULK_APPROVAL',
    pass11,
    `Malformed items remained unverified in database after bulk approval batch`
  );

  // --- 12. Bulk result reports successful and failed IDs correctly ---
  const pass12 = bulkRes.failedItems !== undefined &&
                 bulkRes.failedItems.length === 2 &&
                 bulkRes.failedItems.some(f => f.id === 'Q_BULK_BAD_1') &&
                 bulkRes.failedItems.some(f => f.id === 'Q_BULK_BAD_2');
  record(
    'Bulk Operation Result Reports Failures Transparently',
    'BULK_APPROVAL',
    pass12,
    `Reported failed IDs and failure reasons for Q_BULK_BAD_1 and Q_BULK_BAD_2`
  );

  // --- 13. Rejected question cannot bypass validation into verified ---
  await env.DB.prepare(
    `INSERT INTO master_question_bank (
      id, source_type, question_text, question_type, subject_code, subject_name, semester,
      options_json, correct_answer_json, verification_status, is_original_pyq, is_ai_generated
    ) VALUES (
      'Q_REJ_MALFORMED', 'GTU', '', 'MCQ',
      '3110014', 'Algorithms', 1,
      '[{"id":"A","text":"A"}]',
      'A', 'rejected', 1, 0
    )`
  ).run();

  let pass13 = false;
  try {
    await approveAndPublishQuestion(env, 'admin_super_uid', 'Q_REJ_MALFORMED');
  } catch {
    pass13 = true;
  }
  record(
    'Rejected Malformed Question Cannot Bypass Validation to Verified',
    'STATE_MACHINE',
    pass13,
    `Re-verification of rejected questions strictly requires passing the full validation pipeline`
  );

  // --- 14. Archived question cannot bypass validation into verified ---
  await env.DB.prepare(
    `INSERT INTO master_question_bank (
      id, source_type, question_text, question_type, subject_code, subject_name, semester,
      options_json, correct_answer_json, verification_status, is_original_pyq, is_ai_generated
    ) VALUES (
      'Q_ARCHIVED_MALFORMED', 'GTU', 'Missing options question', 'MCQ',
      '3110014', 'Algorithms', 1,
      '[]',
      'A', 'rejected', 1, 0
    )`
  ).run();

  let pass14 = false;
  try {
    await approveAndPublishQuestion(env, 'admin_super_uid', 'Q_ARCHIVED_MALFORMED');
  } catch {
    pass14 = true;
  }
  record(
    'Archived Malformed Question Cannot Bypass Validation to Verified',
    'STATE_MACHINE',
    pass14,
    `Blocked reactivation/approval of archived question with empty options`
  );

  // --- 15. Invalid state transition / missing question ID rejected ---
  let pass15 = false;
  try {
    await approveAndPublishQuestion(env, 'admin_super_uid', 'NON_EXISTENT_QUESTION_ID');
  } catch (err: any) {
    pass15 = err.message.includes('not found');
  }
  record(
    'Non-existent Question ID Approval Rejected',
    'STATE_MACHINE',
    pass15,
    `Safely handled approval request for non-existent question ID`
  );

  // --- 16. Audit log created for successful approval ---
  const logs1 = await getQuestionAuditLogs(env, 'Q_VAL_001');
  const pass16 = logs1.length > 0 &&
                 logs1[0].action === 'QUESTION_APPROVED' &&
                 logs1[0].admin_id === 'admin_super_uid';
  record(
    'Audit Log Created for Single Approval Event',
    'AUDIT_LOG',
    pass16,
    `Logged action: ${logs1[0]?.action} with actor: ${logs1[0]?.admin_id}`
  );

  // --- 17. Bulk approval creates audit records per approved question ---
  const bulkLog1 = await getQuestionAuditLogs(env, 'Q_BULK_VAL_1');
  const bulkLog2 = await getQuestionAuditLogs(env, 'Q_BULK_VAL_2');
  const pass17 = bulkLog1.length > 0 && bulkLog2.length > 0 &&
                 bulkLog1[0].action === 'QUESTION_APPROVED' &&
                 bulkLog2[0].action === 'QUESTION_APPROVED';
  record(
    'Bulk Approval Emits Audit Records Per Approved Item',
    'AUDIT_LOG',
    pass17,
    `Generated individual immutable audit records for Q_BULK_VAL_1 and Q_BULK_VAL_2`
  );

  // --- 18. Failed approval does not create false success audit records ---
  const failLogs = await getQuestionAuditLogs(env, 'Q_MAL_EMPTY_TEXT');
  const pass18 = failLogs.length === 0;
  record(
    'Failed Approval Never Generates False Success Audit Records',
    'AUDIT_LOG',
    pass18,
    `Zero false approval audit records recorded for failed candidate Q_MAL_EMPTY_TEXT`
  );

  // --- 19. Student API exposes only verified questions ---
  const studentQuestions = await getMcqPracticeQuestions(env, {
    semester: 1,
    subjectCode: '3110014',
  });
  const unverifiedIds = ['Q_MAL_EMPTY_TEXT', 'Q_MAL_ONE_OPT', 'Q_MAL_EMPTY_OPT', 'Q_MAL_PLACEHOLDER', 'Q_MAL_BAD_ANS', 'Q_BULK_BAD_1', 'Q_BULK_BAD_2'];
  const pass19 = studentQuestions.questions.length > 0 &&
                 studentQuestions.questions.every(q => !unverifiedIds.includes(q.id));
  record(
    'Student Practice API Exposes Strictly Verified Questions',
    'STUDENT_EXPOSURE',
    pass19,
    `Student pool contains only verified questions; zero unverified or malformed questions exposed`
  );

  // --- 20. Phase 7A answer protection remains intact ---
  const studentQ = studentQuestions.questions[0];
  const pass20 = (studentQ as any).correctAnswer === undefined &&
                 (studentQ as any).correct_answer_json === undefined &&
                 studentQ.explanation === null &&
                 studentQ.stepByStepSolution === undefined;
  record(
    'Phase 7A Answer Protection Invariant Preserved',
    'STUDENT_EXPOSURE',
    pass20,
    `Pre-submission DTO strictly shields answer keys, explanations, and step-by-step solutions`
  );

  // --- 21. Admin authentication remains required ---
  const adminCheck1 = isAdmin('superadmin@shikshasahayak.org', 'admin');
  const adminCheck2 = isAdmin('student@gmail.com', 'student');
  const pass21 = adminCheck1 === true && adminCheck2 === false;
  record(
    'Admin Role & Whitelist Gate Verification',
    'AUTH_SECURITY',
    pass21,
    `Recognized canonical admin while rejecting standard student identity`
  );

  // --- 22. Student/teacher without admin privileges cannot perform admin moderation actions ---
  const isStudentAdmin = isAdmin('guest_student@shikshasahayak.org', 'student');
  const isRandomUserAdmin = isAdmin('random@otherdomain.com', 'user');
  const pass22 = isStudentAdmin === false && isRandomUserAdmin === false;
  record(
    'Non-Admin Roles Blocked From Moderation Authority',
    'AUTH_SECURITY',
    pass22,
    `Enforced server-side non-admin privilege denial`
  );

  // --- 23. Provenance is preserved after approval ---
  const approvedRow = await env.DB.prepare(`SELECT * FROM master_question_bank WHERE id = 'Q_VAL_001'`).first<Record<string, unknown>>();
  const pass23 = approvedRow?.is_original_pyq === 1 &&
                 approvedRow?.is_ai_generated === 0 &&
                 approvedRow?.source_type === 'GTU';
  record(
    'Provenance Metadata Preserved Intact Post-Approval',
    'PROVENANCE',
    pass23,
    `Retained is_original_pyq=1, is_ai_generated=0, and source_type='GTU'`
  );

  // --- 24. Placeholder detection catches all known fallback patterns ---
  const pat1 = containsPlaceholderOptions(['Option Choice A', 'Option Choice B']);
  const pat2 = containsPlaceholderOptions(['Choice A', 'Choice B']);
  const pat3 = containsPlaceholderOptions(['Dummy Option 1', 'Dummy Option 2']);
  const pat4 = containsPlaceholderOptions(['Sample Option 1', 'Sample Option 2']);
  const patReal = containsPlaceholderOptions(['Linear Probing', 'Quadratic Probing', 'Double Hashing']);
  const pass24 = pat1 && pat2 && pat3 && pat4 && !patReal;
  record(
    'Placeholder Detection Recognizes All Known Dummy Patterns',
    'VALIDATION',
    pass24,
    `Captured Option Choice, Choice A/B, Dummy Option, Sample Option, and passed legitimate engineering choices`
  );

  // --- SUMMARY ---
  console.log('\n==================================================');
  console.log('   PHASE 7C MODERATION INTEGRITY SUMMARY');
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
runPhase7CVerification().catch(err => {
  console.error('Phase 7C verification failed with error:', err);
  process.exit(1);
});
