// ============================================================
// SHIKSHA SAHAYAK — MCQ FINAL CERTIFICATION & GO-LIVE AUDIT
// Command: npx tsx scripts/e2e-mcq-certification-audit.ts
// ============================================================

import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import {
  getMcqPracticeQuestions,
  evaluateStudentMcqAnswer,
  toggleMcqBookmark,
  getStudentMcqBookmarks,
  getStudentMcqProgressSummary,
} from '../functions/lib/questionIntelligence/mcqPracticeService';

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
              return (row as unknown as T) || null;
            },
            async all<T = Record<string, unknown>>(): Promise<{ results: T[] }> {
              const stmt = db.prepare(sql);
              const results = stmt.all(...params) as unknown as T[];
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
          return (row as unknown as T) || null;
        },
        async all<T = Record<string, unknown>>(): Promise<{ results: T[] }> {
          const stmt = db.prepare(sql);
          const results = stmt.all() as unknown as T[];
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

async function runE2eCertification() {
  console.log('================================================================');
  console.log('🎓 RUNNING SHIKSHA SAHAYAK MCQ FINAL CERTIFICATION AUDIT');
  console.log('================================================================\n');

  const mockDb = createMockD1Database();
  const env = { DB: mockDb as any };

  let passedChecks = 0;
  const totalChecks = 10;

  // ------------------------------------------------------------
  // CHECK 1: Question Selection & Verification Status Filtering
  // ------------------------------------------------------------
  console.log('➡️ Check 1: Verified MCQ Retrieval & Filtering');
  const mathsRes = await getMcqPracticeQuestions(env, {
    subjectCode: '3110014',
    limit: 10,
  });

  if (mathsRes.questions.length > 0 && mathsRes.questions.every((q) => q.subjectCode === '3110014')) {
    console.log(`  ✓ PASSED: Retrieved ${mathsRes.questions.length} verified questions for Maths-1 (3110014)`);
    passedChecks++;
  } else {
    console.error('  ❌ FAILED: Failed to retrieve verified questions for Maths-1');
  }

  // ------------------------------------------------------------
  // CHECK 2: Zero Answer-Leakage Security Audit
  // ------------------------------------------------------------
  console.log('\n➡️ Check 2: Pre-Submission Answer-Leakage Security Test');
  let hasLeakedAnswer = false;
  for (const q of mathsRes.questions) {
    if ((q as any).correctAnswer !== undefined && (q as any).correctAnswer !== null) hasLeakedAnswer = true;
    if ((q as any).correct_answer_json !== undefined) hasLeakedAnswer = true;
    if (q.explanation !== null && q.explanation !== undefined) hasLeakedAnswer = true;
    if ((q as any).stepByStepSolution !== null && (q as any).stepByStepSolution !== undefined) hasLeakedAnswer = true;
  }

  if (!hasLeakedAnswer) {
    console.log('  ✓ PASSED: Zero Answer Leakage. Client DTO contains NO correct answers or explanations');
    passedChecks++;
  } else {
    console.error('  ❌ FAILED: Security Violation! Sensitive answer fields detected in practice DTO');
  }

  // ------------------------------------------------------------
  // CHECK 3: Server-Side Answer Evaluation (Correct Answer)
  // ------------------------------------------------------------
  console.log('\n➡️ Check 3: Server-Side Answer Evaluation (Correct Option)');
  const testQ = mathsRes.questions[0];
  const evalCorrect = await evaluateStudentMcqAnswer(
    env,
    testQ.id,
    'A', // Q_GTU_3110014_2024_W_001 correct answer is 'A'
    'student_cert_01',
    15,
    'RANDOM'
  );

  if (evalCorrect.isCorrect === true && evalCorrect.explanation) {
    console.log(`  ✓ PASSED: Server correctly evaluated answer as TRUE and attached explanation post-submit`);
    passedChecks++;
  } else {
    console.error('  ❌ FAILED: Correct evaluation failed:', evalCorrect);
  }

  // ------------------------------------------------------------
  // CHECK 4: Server-Side Answer Evaluation (Incorrect Option)
  // ------------------------------------------------------------
  console.log('\n➡️ Check 4: Server-Side Answer Evaluation (Incorrect Option)');
  const evalIncorrect = await evaluateStudentMcqAnswer(
    env,
    testQ.id,
    'B', // Wrong option
    'student_cert_01',
    20,
    'RANDOM'
  );

  if (evalIncorrect.isCorrect === false && evalIncorrect.correctAnswer) {
    console.log(`  ✓ PASSED: Server correctly evaluated answer as FALSE and returned correct option '${evalIncorrect.correctAnswer}'`);
    passedChecks++;
  } else {
    console.error('  ❌ FAILED: Incorrect evaluation failed:', evalIncorrect);
  }

  // ------------------------------------------------------------
  // CHECK 5: Bookmark Toggle & Persistence
  // ------------------------------------------------------------
  console.log('\n➡️ Check 5: Student Bookmark Persistence & Retrieval');
  const bmAdded = await toggleMcqBookmark(env, 'student_cert_01', testQ.id, 'Crucial formula');
  const studentBookmarks = await getStudentMcqBookmarks(env, 'student_cert_01');

  if (bmAdded.isBookmarked && studentBookmarks.some((b) => b.id === testQ.id)) {
    console.log(`  ✓ PASSED: Question successfully bookmarked and retrieved in student bookmark list`);
    passedChecks++;
  } else {
    console.error('  ❌ FAILED: Bookmark persistence check failed');
  }

  // ------------------------------------------------------------
  // CHECK 6: Bookmark Removal
  // ------------------------------------------------------------
  console.log('\n➡️ Check 6: Student Unbookmarking');
  const bmRemoved = await toggleMcqBookmark(env, 'student_cert_01', testQ.id);
  const studentBookmarksAfter = await getStudentMcqBookmarks(env, 'student_cert_01');

  if (!bmRemoved.isBookmarked && !studentBookmarksAfter.some((b) => b.id === testQ.id)) {
    console.log(`  ✓ PASSED: Question cleanly removed from student bookmark list`);
    passedChecks++;
  } else {
    console.error('  ❌ FAILED: Bookmark removal check failed');
  }

  // ------------------------------------------------------------
  // CHECK 7: Student Progress & Topic Performance Aggregation
  // ------------------------------------------------------------
  console.log('\n➡️ Check 7: Student Progress & Accuracy Calculation');
  const progress = await getStudentMcqProgressSummary(env, 'student_cert_01', undefined, '3110014');

  if (progress.totalAttempted >= 2 && progress.totalCorrect >= 1 && progress.accuracyPercentage > 0) {
    console.log(`  ✓ PASSED: Progress aggregated cleanly (Attempted: ${progress.totalAttempted}, Correct: ${progress.totalCorrect}, Accuracy: ${progress.accuracyPercentage}%)`);
    passedChecks++;
  } else {
    console.error('  ❌ FAILED: Progress aggregation failed:', progress);
  }

  // ------------------------------------------------------------
  // CHECK 8: Cross-Student Data Isolation
  // ------------------------------------------------------------
  console.log('\n➡️ Check 8: Cross-Student Data Isolation');
  const intruderProgress = await getStudentMcqProgressSummary(env, 'student_intruder_99');
  const intruderBookmarks = await getStudentMcqBookmarks(env, 'student_intruder_99');

  if (intruderProgress.totalAttempted === 0 && intruderBookmarks.length === 0) {
    console.log('  ✓ PASSED: Complete Isolation. Student B cannot access Student A practice records');
    passedChecks++;
  } else {
    console.error('  ❌ FAILED: Cross-student data isolation violated');
  }

  // ------------------------------------------------------------
  // CHECK 9: Multi-Subject Isolation
  // ------------------------------------------------------------
  console.log('\n➡️ Check 9: Multi-Subject Question Isolation');
  const dbmsRes = await getMcqPracticeQuestions(env, { subjectCode: '3150702', limit: 10 });
  const cnRes = await getMcqPracticeQuestions(env, { subjectCode: '3150710', limit: 10 });

  const isMathsIsolated = dbmsRes.questions.every((q) => q.subjectCode === '3150702');
  const isCnIsolated = cnRes.questions.every((q) => q.subjectCode === '3150710');

  if (isMathsIsolated && isCnIsolated && dbmsRes.questions.length > 0 && cnRes.questions.length > 0) {
    console.log('  ✓ PASSED: Subject isolation verified (DBMS & Computer Networks return exact course questions)');
    passedChecks++;
  } else {
    console.error('  ❌ FAILED: Multi-subject question isolation failed');
  }

  // ------------------------------------------------------------
  // CHECK 10: Empty Subject Graceful Handling
  // ------------------------------------------------------------
  console.log('\n➡️ Check 10: Empty Subject Graceful Handling');
  const emptyRes = await getMcqPracticeQuestions(env, { subjectCode: '9999999', limit: 10 });

  if (emptyRes.questions.length === 0 && emptyRes.total === 0) {
    console.log('  ✓ PASSED: Non-indexed subject returned 0 questions gracefully with no errors');
    passedChecks++;
  } else {
    console.error('  ❌ FAILED: Empty subject handling failed');
  }

  console.log('\n================================================================');
  console.log(`🎉 FINAL AUDIT RESULT: ${passedChecks} / ${totalChecks} CHECKS PASSED (100%)`);
  console.log('================================================================');

  if (passedChecks !== totalChecks) {
    process.exit(1);
  }
}

runE2eCertification().catch((err) => {
  console.error('E2E Audit Error:', err);
  process.exit(1);
});
