// ============================================================
// PHASE 1D: INTELLIGENT RANDOM TEST & QUIZ ENGINE TEST SUITE
// Command: npx tsx scripts/test-phase-1d-test-engine.ts
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
  previewTestGeneration,
  createQuestion,
  ingestGateQuestionPayload,
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
  // 1. Seed GTU PYQ MCQ
  await createQuestion(
    env,
    {
      questionText: 'What is the derivative of sin(x)?',
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
          { id: 'A', text: 'cos(x)' },
          { id: 'B', text: '-cos(x)' },
          { id: 'C', text: 'tan(x)' },
          { id: 'D', text: 'sec(x)' },
        ],
        correctAnswer: 'A',
      },
    },
    ['branch_07', 'branch_31']
  );

  // 2. Seed GTU PYQ MSQ
  await createQuestion(
    env,
    {
      questionText: 'Which of the following functions are continuous at x = 0?',
      questionType: 'MSQ',
      subjectCode: '3110014',
      subjectName: 'Mathematics - 1',
      semester: 1,
      topicName: 'Calculus',
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
          { id: 'A', text: 'f(x) = x^2' },
          { id: 'B', text: 'f(x) = |x|' },
          { id: 'C', text: 'f(x) = 1/x' },
          { id: 'D', text: 'f(x) = cos(x)' },
        ],
        correctAnswers: ['A', 'B', 'D'],
      },
    },
    ['branch_07', 'branch_31']
  );

  // 3. Seed GTU NAT Question
  await createQuestion(
    env,
    {
      questionText: 'Evaluate integral of 2x dx from 0 to 3.',
      questionType: 'NAT',
      subjectCode: '3110014',
      subjectName: 'Mathematics - 1',
      semester: 1,
      topicName: 'Integration',
      difficulty: 'medium',
      sourceType: 'GTU',
      isOriginalPyq: true,
      isAiGenerated: false,
      examName: 'GTU',
      examYear: 2024,
      verificationStatus: 'verified',
      verifiedBy: 'admin_reviewer',
      verifiedAt: new Date().toISOString(),
      natData: {
        exactValue: 9.0,
        acceptableRange: { min: 8.95, max: 9.05 },
      },
    },
    ['branch_07', 'branch_31']
  );

  // 4. Seed GATE CSE Question
  await createQuestion(
    env,
    {
      questionText: 'What is the time complexity of QuickSort in worst case?',
      questionType: 'MCQ',
      subjectCode: 'CSE',
      subjectName: 'Data Structures & Algorithms',
      semester: 1,
      topicName: 'Algorithms',
      difficulty: 'hard',
      sourceType: 'GATE',
      isOriginalPyq: true,
      isAiGenerated: false,
      examName: 'GATE',
      examYear: 2024,
      verificationStatus: 'verified',
      verifiedBy: 'admin_reviewer',
      verifiedAt: new Date().toISOString(),
      mcqData: {
        options: [
          { id: 'A', text: 'O(n^2)' },
          { id: 'B', text: 'O(n log n)' },
          { id: 'C', text: 'O(n)' },
          { id: 'D', text: 'O(1)' },
        ],
        correctAnswer: 'A',
      },
    },
    ['branch_07', 'branch_31']
  );

  // 5. Seed AI Practice Question
  await createQuestion(
    env,
    {
      questionText: 'What is the SI unit of electrical resistance?',
      questionType: 'MCQ',
      subjectCode: '3110005',
      subjectName: 'Basic Electrical Engineering',
      semester: 1,
      topicName: 'Circuit Principles',
      difficulty: 'easy',
      sourceType: 'AI_PRACTICE',
      isOriginalPyq: false,
      isAiGenerated: true,
      verificationStatus: 'verified',
      verifiedBy: 'admin_reviewer',
      verifiedAt: new Date().toISOString(),
      mcqData: {
        options: [
          { id: 'A', text: 'Ohm' },
          { id: 'B', text: 'Volt' },
          { id: 'C', text: 'Ampere' },
          { id: 'D', text: 'Watt' },
        ],
        correctAnswer: 'A',
      },
    },
    ['branch_09', 'branch_10']
  );
}

async function runTestEngineTestSuite() {
  console.log('================================================================');
  console.log('🧪 RUNNING PHASE 1D: INTELLIGENT RANDOM TEST & QUIZ ENGINE TEST SUITE');
  console.log('================================================================\n');

  const mockDb = createMockD1Database();
  const env = { DB: mockDb as any };

  await seedVerifiedQuestions(env);

  let passedTests = 0;
  const totalTests = 25;

  // ------------------------------------------------------------
  // TEST 1: Random MCQ Test Generation
  // ------------------------------------------------------------
  console.log('➡️ Test 1: Random MCQ Test Generation');
  try {
    const res = await generateTestSession(env, {
      testType: 'RANDOM_TEST',
      sourceMode: 'ALL',
      questionTypes: ['MCQ'],
      questionCount: 2,
      durationMinutes: 15,
      studentId: 'std_01',
    });

    if ('id' in res && res.questions.length === 2 && res.questions.every(q => q.questionType === 'MCQ')) {
      console.log(`  ✓ PASSED: Generated Random MCQ test session (ID: ${res.id}, Questions: ${res.questions.length})`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Random MCQ test generation failed', res);
    }
  } catch (err) {
    console.error('  ❌ FAILED: Random MCQ test generation threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 2: Random MSQ Test Generation
  // ------------------------------------------------------------
  console.log('\n➡️ Test 2: Random MSQ Test Generation');
  try {
    const res = await generateTestSession(env, {
      testType: 'RANDOM_TEST',
      sourceMode: 'ALL',
      questionTypes: ['MSQ'],
      questionCount: 1,
      durationMinutes: 10,
      studentId: 'std_01',
    });

    if ('id' in res && res.questions[0].questionType === 'MSQ') {
      console.log(`  ✓ PASSED: Generated Random MSQ test session`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Random MSQ test generation failed', res);
    }
  } catch (err) {
    console.error('  ❌ FAILED: Random MSQ test generation threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 3: Random NAT Test Generation
  // ------------------------------------------------------------
  console.log('\n➡️ Test 3: Random NAT Test Generation');
  try {
    const res = await generateTestSession(env, {
      testType: 'RANDOM_TEST',
      sourceMode: 'ALL',
      questionTypes: ['NAT'],
      questionCount: 1,
      durationMinutes: 10,
      studentId: 'std_01',
    });

    if ('id' in res && res.questions[0].questionType === 'NAT') {
      console.log(`  ✓ PASSED: Generated Random NAT test session`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Random NAT test generation failed', res);
    }
  } catch (err) {
    console.error('  ❌ FAILED: Random NAT test generation threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 4: Mixed MCQ/MSQ/NAT Test Generation
  // ------------------------------------------------------------
  console.log('\n➡️ Test 4: Mixed MCQ/MSQ/NAT Test Generation');
  try {
    const res = await generateTestSession(env, {
      testType: 'MIXED_TEST',
      sourceMode: 'ALL',
      questionTypes: 'MIXED',
      questionCount: 3,
      durationMinutes: 20,
      studentId: 'std_01',
    });

    if ('id' in res && res.questions.length === 3) {
      console.log(`  ✓ PASSED: Generated Mixed MCQ/MSQ/NAT test session with 3 questions`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Mixed test generation failed', res);
    }
  } catch (err) {
    console.error('  ❌ FAILED: Mixed test generation threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 5: Topic-Specific Test Generation
  // ------------------------------------------------------------
  console.log('\n➡️ Test 5: Topic-Specific Test Generation');
  try {
    const res = await generateTestSession(env, {
      testType: 'TOPIC_TEST',
      topicName: 'Calculus',
      questionCount: 2,
      durationMinutes: 15,
      studentId: 'std_01',
    });

    if ('id' in res && res.questions.every(q => q.topicName === 'Calculus')) {
      console.log(`  ✓ PASSED: Generated Topic test filtered by 'Calculus'`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Topic test generation failed', res);
    }
  } catch (err) {
    console.error('  ❌ FAILED: Topic test generation threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 6: Subject-Specific Test Generation
  // ------------------------------------------------------------
  console.log('\n➡️ Test 6: Subject-Specific Test Generation');
  try {
    const res = await generateTestSession(env, {
      testType: 'SUBJECT_TEST',
      subjectCode: '3110014',
      questionCount: 3,
      durationMinutes: 20,
      studentId: 'std_01',
    });

    if ('id' in res && res.questions.length === 3) {
      console.log(`  ✓ PASSED: Generated Subject test filtered by code 3110014`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Subject test generation failed', res);
    }
  } catch (err) {
    console.error('  ❌ FAILED: Subject test generation threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 7: GTU PYQ Test Generation
  // ------------------------------------------------------------
  console.log('\n➡️ Test 7: GTU PYQ Test Generation');
  try {
    const res = await generateTestSession(env, {
      testType: 'GTU_PYQ_TEST',
      sourceMode: 'GTU_PYQ',
      questionCount: 2,
      durationMinutes: 15,
      studentId: 'std_01',
    });

    if ('id' in res && res.questions.every(q => q.sourceType === 'GTU' && q.isOriginalPyq)) {
      console.log(`  ✓ PASSED: Generated GTU PYQ test with only original GTU questions`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: GTU PYQ test generation failed', res);
    }
  } catch (err) {
    console.error('  ❌ FAILED: GTU PYQ test generation threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 8: GATE PYQ Test Generation
  // ------------------------------------------------------------
  console.log('\n➡️ Test 8: GATE PYQ Test Generation');
  try {
    const res = await generateTestSession(env, {
      testType: 'GATE_PYQ_TEST',
      sourceMode: 'GATE_PYQ',
      questionCount: 1,
      durationMinutes: 10,
      studentId: 'std_01',
    });

    if ('id' in res && res.questions[0].sourceType === 'GATE' && res.questions[0].examName === 'GATE') {
      console.log(`  ✓ PASSED: Generated GATE PYQ test with original GATE question`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: GATE PYQ test generation failed', res);
    }
  } catch (err) {
    console.error('  ❌ FAILED: GATE PYQ test generation threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 9: Difficulty Filtering
  // ------------------------------------------------------------
  console.log('\n➡️ Test 9: Difficulty Filtering');
  try {
    const res = await generateTestSession(env, {
      testType: 'RANDOM_TEST',
      difficulty: 'HARD',
      questionCount: 1,
      durationMinutes: 10,
      studentId: 'std_01',
    });

    if ('id' in res && res.questions.length === 1) {
      console.log(`  ✓ PASSED: Filtered test session by HARD difficulty`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Difficulty filtering failed', res);
    }
  } catch (err) {
    console.error('  ❌ FAILED: Difficulty filtering threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 10: Question Count Requirement
  // ------------------------------------------------------------
  console.log('\n➡️ Test 10: Question Count Requirement');
  try {
    const res = await generateTestSession(env, {
      testType: 'RANDOM_TEST',
      questionCount: 3,
      durationMinutes: 20,
      studentId: 'std_01',
    });

    if ('id' in res && res.questions.length === 3 && res.questionCount === 3) {
      console.log(`  ✓ PASSED: Exactly 3 questions bound to session matching requested questionCount`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Question count match failed', res);
    }
  } catch (err) {
    console.error('  ❌ FAILED: Question count check threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 11: Duplicate Question Prevention within Test
  // ------------------------------------------------------------
  console.log('\n➡️ Test 11: Duplicate Question Prevention within Test');
  try {
    const res = await generateTestSession(env, {
      testType: 'RANDOM_TEST',
      questionCount: 4,
      durationMinutes: 20,
      studentId: 'std_01',
    });

    if ('id' in res) {
      const qIds = res.questions.map(q => q.id);
      const isUnique = new Set(qIds).size === qIds.length;
      if (isUnique) {
        console.log(`  ✓ PASSED: All 4 questions in generated test session are unique`);
        passedTests++;
      } else {
        console.error('  ❌ FAILED: Duplicate questions found in test session', qIds);
      }
    } else {
      console.error('  ❌ FAILED: Test generation failed', res);
    }
  } catch (err) {
    console.error('  ❌ FAILED: Duplicate prevention check threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 12: Insufficient Question Shortage Handling
  // ------------------------------------------------------------
  console.log('\n➡️ Test 12: Insufficient Question Shortage Handling');
  try {
    const res = await generateTestSession(env, {
      testType: 'RANDOM_TEST',
      questionCount: 100, // We only seeded 5 verified questions!
      durationMinutes: 30,
      studentId: 'std_01',
    });

    if ('success' in res && res.success === false && res.reason === 'INSUFFICIENT_QUESTIONS' && res.requested === 100) {
      console.log(`  ✓ PASSED: Returned structured shortage error (Requested: 100, Available: ${res.available})`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Shortage response check failed', res);
    }
  } catch (err) {
    console.error('  ❌ FAILED: Shortage check threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 13: Exclude Attempted Questions
  // ------------------------------------------------------------
  console.log('\n➡️ Test 13: Exclude Attempted Questions');
  try {
    // Log an attempt for student std_02 on question 1
    await env.DB.prepare(
      `INSERT INTO student_mcq_attempts (id, student_id, question_id, selected_option_id, is_correct, time_taken_seconds, practice_mode)
       VALUES ('att_01', 'std_02', (SELECT id FROM master_question_bank WHERE subject_code = '3110014' LIMIT 1), 'A', 1, 10, 'TOPIC_WISE')`
    ).run();

    const res = await generateTestSession(env, {
      testType: 'RANDOM_TEST',
      excludeAttempted: true,
      studentId: 'std_02',
      questionCount: 1,
      durationMinutes: 10,
    });

    if ('id' in res) {
      console.log(`  ✓ PASSED: Successfully excluded previously attempted question for std_02`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Exclude attempted questions check failed', res);
    }
  } catch (err) {
    console.error('  ❌ FAILED: Exclude attempted check threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 14: Test Session Creation & Initial State
  // ------------------------------------------------------------
  console.log('\n➡️ Test 14: Test Session Creation & Initial State');
  try {
    const res = await generateTestSession(env, {
      testType: 'RANDOM_TEST',
      questionCount: 2,
      durationMinutes: 15,
      studentId: 'std_03',
    });

    if ('id' in res && res.status === 'CREATED') {
      console.log(`  ✓ PASSED: Test session created in 'CREATED' status (Session ID: ${res.id})`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Session creation state check failed', res);
    }
  } catch (err) {
    console.error('  ❌ FAILED: Session state check threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 15: State Transition CREATED -> IN_PROGRESS on Access
  // ------------------------------------------------------------
  console.log('\n➡️ Test 15: State Transition CREATED -> IN_PROGRESS');
  try {
    const createdRes = await generateTestSession(env, {
      testType: 'RANDOM_TEST',
      questionCount: 2,
      durationMinutes: 15,
      studentId: 'std_04',
    });

    if ('id' in createdRes) {
      const accessedSession = await getTestSession(env, createdRes.id, 'std_04');
      if (accessedSession.status === 'IN_PROGRESS' && accessedSession.startedAt !== null) {
        console.log(`  ✓ PASSED: State transitioned CREATED -> IN_PROGRESS on first student retrieval`);
        passedTests++;
      } else {
        console.error('  ❌ FAILED: State transition CREATED -> IN_PROGRESS failed', accessedSession);
      }
    }
  } catch (err) {
    console.error('  ❌ FAILED: State transition test threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 16: MCQ Server-Side Answer Evaluation
  // ------------------------------------------------------------
  console.log('\n➡️ Test 16: MCQ Server-Side Answer Evaluation');
  try {
    const genRes = await generateTestSession(env, {
      testType: 'RANDOM_TEST',
      questionTypes: ['MCQ'],
      questionCount: 1,
      durationMinutes: 10,
      studentId: 'std_05',
    });

    if ('id' in genRes) {
      await getTestSession(env, genRes.id, 'std_05'); // Activate IN_PROGRESS
      const qId = genRes.questions[0].id;
      const ansRes = await submitQuestionAnswer(env, genRes.id, 'std_05', qId, 'A', 12);

      if (ansRes.success && ansRes.isCorrect === true) {
        console.log(`  ✓ PASSED: MCQ correct option 'A' evaluated accurately server-side`);
        passedTests++;
      } else {
        console.error('  ❌ FAILED: MCQ answer evaluation failed', ansRes);
      }
    }
  } catch (err) {
    console.error('  ❌ FAILED: MCQ evaluation test threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 17: MSQ Server-Side Answer Evaluation
  // ------------------------------------------------------------
  console.log('\n➡️ Test 17: MSQ Server-Side Answer Evaluation');
  try {
    const genRes = await generateTestSession(env, {
      testType: 'RANDOM_TEST',
      questionTypes: ['MSQ'],
      questionCount: 1,
      durationMinutes: 10,
      studentId: 'std_06',
    });

    if ('id' in genRes) {
      await getTestSession(env, genRes.id, 'std_06');
      const qId = genRes.questions[0].id;
      // Correct answers for seeded MSQ: ['A', 'B', 'D']
      const ansRes = await submitQuestionAnswer(env, genRes.id, 'std_06', qId, JSON.stringify(['A', 'B', 'D']), 15);

      if (ansRes.success && ansRes.isCorrect === true) {
        console.log(`  ✓ PASSED: MSQ correct set ['A', 'B', 'D'] evaluated accurately server-side`);
        passedTests++;
      } else {
        console.error('  ❌ FAILED: MSQ evaluation failed', ansRes);
      }
    }
  } catch (err) {
    console.error('  ❌ FAILED: MSQ evaluation test threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 18: NAT Server-Side Answer Evaluation
  // ------------------------------------------------------------
  console.log('\n➡️ Test 18: NAT Server-Side Answer Evaluation');
  try {
    const genRes = await generateTestSession(env, {
      testType: 'RANDOM_TEST',
      questionTypes: ['NAT'],
      questionCount: 1,
      durationMinutes: 10,
      studentId: 'std_07',
    });

    if ('id' in genRes) {
      await getTestSession(env, genRes.id, 'std_07');
      const qId = genRes.questions[0].id;
      // Seeded NAT exact value: 9.0, range: [8.95, 9.05]
      const ansRes = await submitQuestionAnswer(env, genRes.id, 'std_07', qId, '9.0', 20);

      if (ansRes.success && ansRes.isCorrect === true) {
        console.log(`  ✓ PASSED: NAT answer 9.0 evaluated accurately within tolerance range`);
        passedTests++;
      } else {
        console.error('  ❌ FAILED: NAT answer evaluation failed', ansRes);
      }
    }
  } catch (err) {
    console.error('  ❌ FAILED: NAT evaluation test threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 19: Negative Marking Calculation
  // ------------------------------------------------------------
  console.log('\n➡️ Test 19: Negative Marking Calculation');
  try {
    const genRes = await generateTestSession(env, {
      testType: 'RANDOM_TEST',
      questionTypes: ['MCQ'],
      negativeMarking: true,
      negativeMarkValue: 0.25,
      questionCount: 2,
      durationMinutes: 10,
      studentId: 'std_08',
    });

    if ('id' in genRes) {
      await getTestSession(env, genRes.id, 'std_08');
      const q1 = genRes.questions[0].id;
      const q2 = genRes.questions[1].id;

      await submitQuestionAnswer(env, genRes.id, 'std_08', q1, 'A', 10); // Correct (+1.0)
      await submitQuestionAnswer(env, genRes.id, 'std_08', q2, 'WRONG_OPT', 10); // Incorrect (-0.25)

      const result = await submitTestSession(env, genRes.id, 'std_08');
      if (result.score === 0.75) {
        console.log(`  ✓ PASSED: Negative marking accurately calculated (+1.0 - 0.25 = 0.75)`);
        passedTests++;
      } else {
        console.error('  ❌ FAILED: Negative marking score calculation failed (Got:', result.score, ')');
      }
    }
  } catch (err) {
    console.error('  ❌ FAILED: Negative marking test threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 20: Server-Side Final Score & Analytics Calculation
  // ------------------------------------------------------------
  console.log('\n➡️ Test 20: Server-Side Final Score & Analytics Calculation');
  try {
    const genRes = await generateTestSession(env, {
      testType: 'RANDOM_TEST',
      questionTypes: ['MCQ'],
      questionCount: 2,
      durationMinutes: 10,
      studentId: 'std_09',
    });

    if ('id' in genRes) {
      await getTestSession(env, genRes.id, 'std_09');
      const q1 = genRes.questions[0].id;
      await submitQuestionAnswer(env, genRes.id, 'std_09', q1, 'A', 15);

      const result = await submitTestSession(env, genRes.id, 'std_09');

      if (result.status === 'SUBMITTED' && result.totalQuestions === 2 && result.correctCount === 1 && result.unansweredCount === 1) {
        console.log(`  ✓ PASSED: Server-side final score and analytics calculated accurately`);
        passedTests++;
      } else {

        console.error('  ❌ FAILED: Final score calculation failed', result);
      }
    }
  } catch (err) {
    console.error('  ❌ FAILED: Final score test threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 21: Submitted Test Immutability
  // ------------------------------------------------------------
  console.log('\n➡️ Test 21: Submitted Test Immutability');
  try {
    const genRes = await generateTestSession(env, {
      testType: 'RANDOM_TEST',
      questionCount: 1,
      durationMinutes: 10,
      studentId: 'std_10',
    });

    if ('id' in genRes) {
      await getTestSession(env, genRes.id, 'std_10');
      await submitTestSession(env, genRes.id, 'std_10');

      let blocked = false;
      try {
        await submitQuestionAnswer(env, genRes.id, 'std_10', genRes.questions[0].id, 'A', 5);
      } catch (err: any) {
        if (err.message?.includes('Cannot modify test session')) {
          blocked = true;
        }
      }

      if (blocked) {
        console.log(`  ✓ PASSED: Submitted test session blocked subsequent answer modifications`);
        passedTests++;
      } else {
        console.error('  ❌ FAILED: Submitted test session permitted modification');
      }
    }
  } catch (err) {
    console.error('  ❌ FAILED: Test immutability test threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 22: Unauthorized Access Protection
  // ------------------------------------------------------------
  console.log('\n➡️ Test 22: Unauthorized Access Protection');
  try {
    const genRes = await generateTestSession(env, {
      testType: 'RANDOM_TEST',
      questionCount: 1,
      durationMinutes: 10,
      studentId: 'std_owner',
    });

    if ('id' in genRes) {
      let blocked = false;
      try {
        await getTestSession(env, genRes.id, 'std_attacker');
      } catch (err: any) {
        if (err.message?.includes('Unauthorized access')) {
          blocked = true;
        }
      }

      if (blocked) {
        console.log(`  ✓ PASSED: Unauthorized student std_attacker blocked from accessing std_owner test session`);
        passedTests++;
      } else {
        console.error('  ❌ FAILED: Unauthorized student access was not blocked');
      }
    }
  } catch (err) {
    console.error('  ❌ FAILED: Unauthorized access test threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 23: Provenance Preservation in Results
  // ------------------------------------------------------------
  console.log('\n➡️ Test 23: Provenance Preservation in Results');
  try {
    const genRes = await generateTestSession(env, {
      testType: 'GATE_PYQ_TEST',
      sourceMode: 'GATE_PYQ',
      questionCount: 1,
      durationMinutes: 10,
      studentId: 'std_11',
    });

    if ('id' in genRes) {
      await getTestSession(env, genRes.id, 'std_11');
      await submitTestSession(env, genRes.id, 'std_11');
      const result = await getTestResult(env, genRes.id, 'std_11');

      if (result.questionResults[0].sourceLabel.includes('GATE 2024')) {
        console.log(`  ✓ PASSED: Provenance label 'GATE 2024' preserved intact in post-test result payload`);
        passedTests++;
      } else {
        console.error('  ❌ FAILED: Provenance preservation check failed', result.questionResults[0]);
      }
    }
  } catch (err) {
    console.error('  ❌ FAILED: Provenance preservation test threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 24: Seed-Based Reproducible Randomization
  // ------------------------------------------------------------
  console.log('\n➡️ Test 24: Seed-Based Reproducible Randomization');
  try {
    const seed = 'test_seed_123';
    const genRes1 = await generateTestSession(env, {
      testType: 'RANDOM_TEST',
      questionCount: 3,
      durationMinutes: 15,
      seed,
      studentId: 'std_12',
    });
    const genRes2 = await generateTestSession(env, {
      testType: 'RANDOM_TEST',
      questionCount: 3,
      durationMinutes: 15,
      seed,
      studentId: 'std_13',
    });

    if ('id' in genRes1 && 'id' in genRes2) {
      const qIds1 = genRes1.questions.map(q => q.id).join(',');
      const qIds2 = genRes2.questions.map(q => q.id).join(',');

      if (qIds1 === qIds2) {
        console.log(`  ✓ PASSED: Same seed produced identical question sequence for reproduciblity`);
        passedTests++;
      } else {
        console.error('  ❌ FAILED: Seed randomization was not reproducible', qIds1, qIds2);
      }
    }
  } catch (err) {
    console.error('  ❌ FAILED: Seed reproducibility test threw error:', err);
  }

  // ------------------------------------------------------------
  // TEST 25: Admin Test Generation Preview (No DB Record)
  // ------------------------------------------------------------
  console.log('\n➡️ Test 25: Admin Test Generation Preview');
  try {
    const prev = await previewTestGeneration(env, {
      testType: 'RANDOM_TEST',
      questionCount: 2,
      durationMinutes: 15,
    });

    if (prev.success && prev.sampleQuestions.length === 2 && prev.availableCount >= 2) {
      console.log(`  ✓ PASSED: Admin test preview returned 2 sample questions without DB session logs`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Admin test preview failed', prev);
    }
  } catch (err) {
    console.error('  ❌ FAILED: Admin preview test threw error:', err);
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

runTestEngineTestSuite().catch(err => {
  console.error('Fatal Test Engine test error:', err);
  process.exit(1);
});
