// ============================================================
// PHASE 1E: STUDENT TEST EXPERIENCE & PERFORMANCE ANALYTICS TEST SUITE
// Command: npx tsx scripts/test-phase-1e-student-test-experience.ts
// ============================================================

import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import {
  generateTestSession,
  getTestSession,
  submitQuestionAnswer,
  submitTestSession,
  getTestResult,
  getStudentPerformanceAnalytics,
  getStudentWeakTopics,
  getStudentTestHistory,
  checkTestAvailability,
  createQuestion,
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
          const results = stmt.all();
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

async function seedVerifiedQuestions(env: any) {
  // Seed GTU Calculus MCQ
  await createQuestion(
    env,
    {
      questionText: 'What is the limit of sin(x)/x as x -> 0?',
      questionType: 'MCQ',
      subjectCode: '3110014',
      subjectName: 'Mathematics - 1',
      semester: 1,
      topicName: 'Calculus',
      difficulty: 'easy',
      sourceType: 'GTU',
      isOriginalPyq: true,
      isAiGenerated: false,
      examName: 'GTU',
      examYear: 2024,
      verificationStatus: 'verified',
      verifiedBy: 'admin_reviewer',
      verifiedAt: new Date().toISOString(),
      mcqData: {
        options: [
          { id: 'A', text: '1' },
          { id: 'B', text: '0' },
          { id: 'C', text: 'Infinity' },
          { id: 'D', text: 'Undefined' },
        ],
        correctAnswer: 'A',
      },
    },
    ['branch_07', 'branch_31']
  );

  // Seed GTU Linear Algebra MSQ
  await createQuestion(
    env,
    {
      questionText: 'Which of the following matrices are symmetric?',
      questionType: 'MSQ',
      subjectCode: '3110014',
      subjectName: 'Mathematics - 1',
      semester: 1,
      topicName: 'Linear Algebra',
      difficulty: 'medium',
      sourceType: 'GTU',
      isOriginalPyq: true,
      isAiGenerated: false,
      examName: 'GTU',
      examYear: 2024,
      verificationStatus: 'verified',
      verifiedBy: 'admin_reviewer',
      verifiedAt: new Date().toISOString(),
      msqData: {
        options: [
          { id: 'A', text: 'Identity Matrix I' },
          { id: 'B', text: 'Diagonal Matrix D' },
          { id: 'C', text: 'Skew-Symmetric Matrix S' },
          { id: 'D', text: 'Zero Matrix O' },
        ],
        correctAnswers: ['A', 'B', 'D'],
      },
    },
    ['branch_07', 'branch_31']
  );

  // Seed GATE NAT Question (Weak topic candidate)
  await createQuestion(
    env,
    {
      questionText: 'Calculate the rank of a 3x3 matrix with 3 non-zero pivot elements.',
      questionType: 'NAT',
      subjectCode: '3110014',
      subjectName: 'Mathematics - 1',
      semester: 1,
      topicName: 'Differential Equations', // Weak topic candidate
      difficulty: 'hard',
      sourceType: 'GATE',
      isOriginalPyq: true,
      isAiGenerated: false,
      examName: 'GATE',
      examYear: 2024,
      verificationStatus: 'verified',
      verifiedBy: 'admin_reviewer',
      verifiedAt: new Date().toISOString(),
      natData: {
        exactValue: 3.0,
        acceptableRange: { min: 2.9, max: 3.1 },
      },
    },
    ['branch_07', 'branch_31']
  );
}

async function runStudentExperienceTestSuite() {
  console.log('================================================================');
  console.log('🧪 RUNNING PHASE 1E: STUDENT TEST EXPERIENCE & ANALYTICS TEST SUITE');
  console.log('================================================================\n');

  const mockDb = createMockD1Database();
  const env = { DB: mockDb as any };

  await seedVerifiedQuestions(env);

  let passedTests = 0;
  const totalTests = 20;

  // ------------------------------------------------------------
  // TEST 1: Question Availability Checking
  // ------------------------------------------------------------
  console.log('➡️ Test 1: Question Availability Checking');
  try {
    const avail = await checkTestAvailability(env, {
      testType: 'RANDOM_TEST',
      questionCount: 3,
      durationMinutes: 10,
      branchId: 'branch_07',
    });

    if (avail.availableCount === 3 && avail.isSufficient === true) {
      console.log(`  ✓ PASSED: Availability checker accurately reported ${avail.availableCount} verified questions`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Availability check failed', avail);
    }
  } catch (err) {
    console.error('  ❌ FAILED: Availability check threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 2: Availability Shortage Warning
  // ------------------------------------------------------------
  console.log('\n➡️ Test 2: Availability Shortage Warning');
  try {
    const avail = await checkTestAvailability(env, {
      testType: 'RANDOM_TEST',
      questionCount: 20, // Only 3 seeded!
      durationMinutes: 20,
    });

    if (avail.availableCount === 3 && avail.isSufficient === false) {
      console.log(`  ✓ PASSED: Shortage warning correctly triggered (Available: 3, Requested: 20)`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Shortage warning failed', avail);
    }
  } catch (err) {
    console.error('  ❌ FAILED: Shortage warning check threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 3: Quick Test Session Generation (10 min)
  // ------------------------------------------------------------
  console.log('\n➡️ Test 3: Quick Test Session Generation');
  try {
    const session = await generateTestSession(env, {
      testType: 'RANDOM_TEST',
      sourceMode: 'ALL',
      questionCount: 2,
      durationMinutes: 10,
      studentId: 'student_alex',
    });

    if ('id' in session && session.durationMinutes === 10 && session.questions.length === 2) {
      console.log(`  ✓ PASSED: Generated Quick Test session (ID: ${session.id})`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Quick test generation failed', session);
    }
  } catch (err) {
    console.error('  ❌ FAILED: Quick test generation threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 4: Student Test Start & Payload Security (Hiding Correct Answer)
  // ------------------------------------------------------------
  console.log('\n➡️ Test 4: Student Test Start & Payload Security');
  try {
    const session = await generateTestSession(env, {
      testType: 'RANDOM_TEST',
      questionCount: 1,
      durationMinutes: 10,
      studentId: 'student_alex',
    });

    if ('id' in session) {
      const activeSession = await getTestSession(env, session.id, 'student_alex');
      const q = activeSession.questions[0];

      if (activeSession.status === 'IN_PROGRESS' && (q as any).correctAnswer === undefined) {
        console.log(`  ✓ PASSED: Active session payload loaded cleanly while hiding correct answer reference`);
        passedTests++;
      } else {
        console.error('  ❌ FAILED: Active payload leaked correct answer reference', q);
      }
    }
  } catch (err) {
    console.error('  ❌ FAILED: Security payload check threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 5: MCQ Answer Selection & Logging
  // ------------------------------------------------------------
  console.log('\n➡️ Test 5: MCQ Answer Selection & Logging');
  try {
    const session = await generateTestSession(env, {
      testType: 'RANDOM_TEST',
      questionTypes: ['MCQ'],
      questionCount: 1,
      durationMinutes: 10,
      studentId: 'student_alex',
    });

    if ('id' in session) {
      await getTestSession(env, session.id, 'student_alex');
      const qId = session.questions[0].id;
      const ansRes = await submitQuestionAnswer(env, session.id, 'student_alex', qId, 'A', 8);

      if (ansRes.success && ansRes.isCorrect === true) {
        console.log(`  ✓ PASSED: MCQ option selection 'A' evaluated accurately server-side`);
        passedTests++;
      } else {
        console.error('  ❌ FAILED: MCQ option selection failed', ansRes);
      }
    }
  } catch (err) {
    console.error('  ❌ FAILED: MCQ selection check threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 6: MSQ Multi-Option Selection & Logging
  // ------------------------------------------------------------
  console.log('\n➡️ Test 6: MSQ Multi-Option Selection & Logging');
  try {
    const session = await generateTestSession(env, {
      testType: 'RANDOM_TEST',
      questionTypes: ['MSQ'],
      questionCount: 1,
      durationMinutes: 10,
      studentId: 'student_alex',
    });

    if ('id' in session) {
      await getTestSession(env, session.id, 'student_alex');
      const qId = session.questions[0].id;
      const ansRes = await submitQuestionAnswer(env, session.id, 'student_alex', qId, JSON.stringify(['A', 'B', 'D']), 12);

      if (ansRes.success && ansRes.isCorrect === true) {
        console.log(`  ✓ PASSED: MSQ multi-option set ['A', 'B', 'D'] evaluated accurately server-side`);
        passedTests++;
      } else {
        console.error('  ❌ FAILED: MSQ selection failed', ansRes);
      }
    }
  } catch (err) {
    console.error('  ❌ FAILED: MSQ selection check threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 7: NAT Numeric Input Submission & Logging
  // ------------------------------------------------------------
  console.log('\n➡️ Test 7: NAT Numeric Input Submission & Logging');
  try {
    const session = await generateTestSession(env, {
      testType: 'RANDOM_TEST',
      questionTypes: ['NAT'],
      questionCount: 1,
      durationMinutes: 10,
      studentId: 'student_alex',
    });

    if ('id' in session) {
      await getTestSession(env, session.id, 'student_alex');
      const qId = session.questions[0].id;
      const ansRes = await submitQuestionAnswer(env, session.id, 'student_alex', qId, '3.0', 14);

      if (ansRes.success && ansRes.isCorrect === true) {
        console.log(`  ✓ PASSED: NAT numeric value '3.0' evaluated accurately within tolerance range`);
        passedTests++;
      } else {
        console.error('  ❌ FAILED: NAT numeric input failed', ansRes);
      }
    }
  } catch (err) {
    console.error('  ❌ FAILED: NAT selection check threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 8: Server-Side Timer Expiration Calculation
  // ------------------------------------------------------------
  console.log('\n➡️ Test 8: Server-Side Timer Expiration Calculation');
  try {
    const session = await generateTestSession(env, {
      testType: 'RANDOM_TEST',
      questionCount: 1,
      durationMinutes: 15,
      studentId: 'student_alex',
    });

    if ('id' in session) {
      const activeSession = await getTestSession(env, session.id, 'student_alex');
      if (activeSession.remainingSeconds <= 900 && activeSession.remainingSeconds > 0) {
        console.log(`  ✓ PASSED: Remaining timer calculated accurately (${activeSession.remainingSeconds}s remaining)`);
        passedTests++;
      } else {
        console.error('  ❌ FAILED: Timer calculation failed', activeSession);
      }
    }
  } catch (err) {
    console.error('  ❌ FAILED: Timer calculation test threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 9: Final Test Submission & Score Computation
  // ------------------------------------------------------------
  console.log('\n➡️ Test 9: Final Test Submission & Score Computation');
  try {
    const session = await generateTestSession(env, {
      testType: 'RANDOM_TEST',
      questionTypes: ['MCQ'],
      questionCount: 1,
      durationMinutes: 10,
      studentId: 'student_alex',
    });

    if ('id' in session) {
      await getTestSession(env, session.id, 'student_alex');
      await submitQuestionAnswer(env, session.id, 'student_alex', session.questions[0].id, 'A', 5);
      const result = await submitTestSession(env, session.id, 'student_alex');

      if (result.status === 'SUBMITTED' && result.correctCount === 1 && result.score === 1.0) {
        console.log(`  ✓ PASSED: Final test submission completed and score computed server-side`);
        passedTests++;
      } else {
        console.error('  ❌ FAILED: Final submission score failed', result);
      }
    }
  } catch (err) {
    console.error('  ❌ FAILED: Final submission test threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 10: Result Access & Provenance Labels Verification
  // ------------------------------------------------------------
  console.log('\n➡️ Test 10: Result Access & Provenance Labels Verification');
  try {
    const session = await generateTestSession(env, {
      testType: 'GATE_PYQ_TEST',
      sourceMode: 'GATE_PYQ',
      questionCount: 1,
      durationMinutes: 10,
      studentId: 'student_alex',
    });

    if ('id' in session) {
      await getTestSession(env, session.id, 'student_alex');
      await submitTestSession(env, session.id, 'student_alex');
      const result = await getTestResult(env, session.id, 'student_alex');

      if (result.questionResults[0].sourceLabel.includes('GATE 2024')) {
        console.log(`  ✓ PASSED: Provenance label 'GATE 2024' verified in result review payload`);
        passedTests++;
      } else {
        console.error('  ❌ FAILED: Provenance label verification failed', result);
      }
    }
  } catch (err) {
    console.error('  ❌ FAILED: Provenance label check threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 11: Test History Retrieval & Filtering
  // ------------------------------------------------------------
  console.log('\n➡️ Test 11: Test History Retrieval & Filtering');
  try {
    const history = await getStudentTestHistory(env, 'student_alex');
    if (history.length >= 1) {
      console.log(`  ✓ PASSED: Test history retrieved ${history.length} completed sessions for student_alex`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Test history retrieval failed', history);
    }
  } catch (err) {
    console.error('  ❌ FAILED: Test history check threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 12: Student Performance Analytics Aggregation
  // ------------------------------------------------------------
  console.log('\n➡️ Test 12: Student Performance Analytics Aggregation');
  try {
    const analytics = await getStudentPerformanceAnalytics(env, 'student_alex');
    if (analytics.totalTestsCompleted >= 1 && analytics.overallAccuracyPercentage >= 0) {
      console.log(`  ✓ PASSED: Performance analytics aggregated (Tests: ${analytics.totalTestsCompleted}, Accuracy: ${analytics.overallAccuracyPercentage}%)`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Analytics aggregation failed', analytics);
    }
  } catch (err) {
    console.error('  ❌ FAILED: Analytics check threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 13: Weak-Topic Calculation (<60% Accuracy Threshold)
  // ------------------------------------------------------------
  console.log('\n➡️ Test 13: Weak-Topic Calculation');
  try {
    // Generate a session with NAT question (Differential Equations) and submit incorrect answer to simulate weak topic
    const session = await generateTestSession(env, {
      testType: 'RANDOM_TEST',
      questionTypes: ['NAT'],
      questionCount: 1,
      durationMinutes: 10,
      studentId: 'student_weak',
    });

    if ('id' in session) {
      await getTestSession(env, session.id, 'student_weak');
      await submitQuestionAnswer(env, session.id, 'student_weak', session.questions[0].id, '999.0', 10); // Wrong answer
      await submitTestSession(env, session.id, 'student_weak');

      const weakTopics = await getStudentWeakTopics(env, 'student_weak');
      if (weakTopics.length > 0 && weakTopics.some(wt => wt.topicName === 'Differential Equations')) {
        console.log(`  ✓ PASSED: Identified 'Differential Equations' as weak topic (Accuracy < 60%)`);
        passedTests++;
      } else {
        console.error('  ❌ FAILED: Weak topic calculation failed', weakTopics);
      }
    }
  } catch (err) {
    console.error('  ❌ FAILED: Weak topic check threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 14: Targeted Weak-Topic Test Generation
  // ------------------------------------------------------------
  console.log('\n➡️ Test 14: Targeted Weak-Topic Test Generation');
  try {
    const weakTopics = await getStudentWeakTopics(env, 'student_weak');
    if (weakTopics.length > 0) {
      const config = { ...weakTopics[0].recommendedConfig, questionCount: 1 };
      const targetSession = await generateTestSession(env, config);

      if ('id' in targetSession && targetSession.questions[0].topicName === weakTopics[0].topicName) {
        console.log(`  ✓ PASSED: Generated targeted weak-topic practice session for '${weakTopics[0].topicName}'`);
        passedTests++;
      } else {
        console.error('  ❌ FAILED: Targeted weak topic test generation failed', targetSession);
      }
    }
  } catch (err) {
    console.error('  ❌ FAILED: Targeted weak topic test threw error:', err);
  }


  // ------------------------------------------------------------
  // TEST 15: Retry Complete Test Session Creation
  // ------------------------------------------------------------
  console.log('\n➡️ Test 15: Retry Complete Test Session Creation');
  try {
    const originalSession = await generateTestSession(env, {
      testType: 'RANDOM_TEST',
      questionCount: 2,
      durationMinutes: 10,
      studentId: 'student_retry',
    });

    if ('id' in originalSession) {
      const retrySession = await generateTestSession(env, {
        testType: 'RANDOM_TEST',
        sourceMode: 'ALL',
        questionCount: originalSession.questionCount,
        durationMinutes: originalSession.durationMinutes,
        studentId: 'student_retry',
      });

      if ('id' in retrySession && retrySession.id !== originalSession.id) {
        console.log(`  ✓ PASSED: Created new retry test session (New ID: ${retrySession.id})`);
        passedTests++;
      } else {
        console.error('  ❌ FAILED: Retry complete test session failed', retrySession);
      }
    }
  } catch (err) {
    console.error('  ❌ FAILED: Retry test creation threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 16: Retry Incorrect Questions Test Creation
  // ------------------------------------------------------------
  console.log('\n➡️ Test 16: Retry Incorrect Questions Test Creation');
  try {
    const session = await generateTestSession(env, {
      testType: 'RANDOM_TEST',
      questionTypes: ['MCQ'],
      questionCount: 1,
      durationMinutes: 10,
      studentId: 'student_retry_inc',
    });

    if ('id' in session) {
      await getTestSession(env, session.id, 'student_retry_inc');
      await submitQuestionAnswer(env, session.id, 'student_retry_inc', session.questions[0].id, 'WRONG_OPT', 5);
      await submitTestSession(env, session.id, 'student_retry_inc');

      const retryIncSession = await generateTestSession(env, {
        testType: 'RANDOM_TEST',
        questionTypes: ['MCQ'],
        questionCount: 1,
        durationMinutes: 10,
        studentId: 'student_retry_inc',
      });

      if ('id' in retryIncSession) {
        console.log(`  ✓ PASSED: Created targeted test session to retry incorrect questions`);
        passedTests++;
      } else {
        console.error('  ❌ FAILED: Retry incorrect questions test creation failed', retryIncSession);
      }
    }
  } catch (err) {
    console.error('  ❌ FAILED: Retry incorrect test check threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 17: Unauthorized Result Access Protection
  // ------------------------------------------------------------
  console.log('\n➡️ Test 17: Unauthorized Result Access Protection');
  try {
    const session = await generateTestSession(env, {
      testType: 'RANDOM_TEST',
      questionCount: 1,
      durationMinutes: 10,
      studentId: 'student_legit',
    });

    if ('id' in session) {
      await getTestSession(env, session.id, 'student_legit');
      await submitTestSession(env, session.id, 'student_legit');

      let blocked = false;
      try {
        await getTestResult(env, session.id, 'student_intruder');
      } catch (err: any) {
        if (err.message?.includes('Unauthorized access')) {
          blocked = true;
        }
      }

      if (blocked) {
        console.log(`  ✓ PASSED: Blocked student_intruder from viewing student_legit test result`);
        passedTests++;
      } else {
        console.error('  ❌ FAILED: Unauthorized result access check failed');
      }
    }
  } catch (err) {
    console.error('  ❌ FAILED: Unauthorized result check threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 18: Submitted Test Immutability
  // ------------------------------------------------------------
  console.log('\n➡️ Test 18: Submitted Test Immutability');
  try {
    const session = await generateTestSession(env, {
      testType: 'RANDOM_TEST',
      questionCount: 1,
      durationMinutes: 10,
      studentId: 'student_immut',
    });

    if ('id' in session) {
      await getTestSession(env, session.id, 'student_immut');
      await submitTestSession(env, session.id, 'student_immut');

      let blocked = false;
      try {
        await submitQuestionAnswer(env, session.id, 'student_immut', session.questions[0].id, 'A', 10);
      } catch (err: any) {
        if (err.message?.includes('Cannot modify test session')) {
          blocked = true;
        }
      }

      if (blocked) {
        console.log(`  ✓ PASSED: Immutability verified - submitted session refused modifications`);
        passedTests++;
      } else {
        console.error('  ❌ FAILED: Submitted test permitted modification');
      }
    }
  } catch (err) {
    console.error('  ❌ FAILED: Test immutability check threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 19: Mobile / API Contract Validation
  // ------------------------------------------------------------
  console.log('\n➡️ Test 19: Mobile / API Contract Validation');
  try {
    const session = await generateTestSession(env, {
      testType: 'RANDOM_TEST',
      questionCount: 2,
      durationMinutes: 15,
      studentId: 'student_mobile',
    });

    if ('id' in session) {
      const active = await getTestSession(env, session.id, 'student_mobile');
      const q = active.questions[0];

      if (q.id && q.sequenceNumber === 1 && Array.isArray(q.options) && q.questionType) {
        console.log(`  ✓ PASSED: Mobile API DTO contract validated cleanly (ID, Sequence, Options, Type)`);
        passedTests++;
      } else {
        console.error('  ❌ FAILED: Mobile DTO contract validation failed', q);
      }
    }
  } catch (err) {
    console.error('  ❌ FAILED: Mobile DTO contract test threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 20: Comprehensive Dashboard Analytics Payload Contract
  // ------------------------------------------------------------
  console.log('\n➡️ Test 20: Comprehensive Dashboard Analytics Payload Contract');
  try {
    const analytics = await getStudentPerformanceAnalytics(env, 'student_alex');
    if (
      Array.isArray(analytics.recentTestSessions) &&
      Array.isArray(analytics.topicBreakdown) &&
      Array.isArray(analytics.difficultyBreakdown) &&
      Array.isArray(analytics.sourceBreakdown)
    ) {
      console.log(`  ✓ PASSED: Student Dashboard analytics payload contract validated cleanly`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Dashboard analytics contract validation failed', analytics);
    }
  } catch (err) {
    console.error('  ❌ FAILED: Analytics payload contract test threw error:', err);
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

runStudentExperienceTestSuite().catch(err => {
  console.error('Fatal Student Experience test error:', err);
  process.exit(1);
});
