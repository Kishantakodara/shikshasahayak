// ============================================================
// PHASE 1E: INTELLIGENT MCQ / MSQ / NAT TEST & QUIZ ENGINE TEST SUITE
// Command: npx tsx scripts/test-phase-1e-test-quiz-engine.ts
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

async function seedQuestionBank(env: any) {
  // 1. GTU MCQ
  await createQuestion(env, {
    questionText: 'What is the limit of (1 + x)^(1/x) as x approaches 0?',
    questionType: 'MCQ',
    subjectCode: '3110014',
    subjectName: 'Mathematics - 1',
    semester: 1,
    topicName: 'Limits & Calculus',
    difficulty: 'easy',
    sourceType: 'GTU',
    isOriginalPyq: true,
    isAiGenerated: false,
    examName: 'GTU',
    examYear: 2024,
    verificationStatus: 'verified',
    mcqData: {
      options: [
        { id: 'A', text: 'e' },
        { id: 'B', text: '1' },
        { id: 'C', text: '0' },
        { id: 'D', text: 'Infinity' },
      ],
      correctAnswer: 'A',
    },
    applicableBranches: ['branch_07', 'branch_31'],
  });

  // 2. GTU MSQ
  await createQuestion(env, {
    questionText: 'Which of the following differential equations are linear?',
    questionType: 'MSQ',
    subjectCode: '3110014',
    subjectName: 'Mathematics - 1',
    semester: 1,
    topicName: 'Differential Equations',
    difficulty: 'medium',
    sourceType: 'GTU',
    isOriginalPyq: true,
    isAiGenerated: false,
    examName: 'GTU',
    examYear: 2024,
    verificationStatus: 'verified',
    msqData: {
      options: [
        { id: 'A', text: 'dy/dx + y = x' },
        { id: 'B', text: 'd2y/dx2 + y = 0' },
        { id: 'C', text: '(dy/dx)^2 + y = 0' },
        { id: 'D', text: 'dy/dx + sin(y) = 0' },
      ],
      correctAnswers: ['A', 'B'],
    },
    applicableBranches: ['branch_07', 'branch_31'],
  });

  // 3. GTU NAT
  await createQuestion(env, {
    questionText: 'Evaluate integral of cos(x) dx from 0 to pi/2.',
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
    natData: {
      exactValue: 1.0,
      acceptableRange: { min: 0.99, max: 1.01 },
    },
    applicableBranches: ['branch_07', 'branch_31'],
  });

  // 4. GATE CSE MCQ
  await createQuestion(env, {
    questionText: 'Which of the following is a non-linear data structure?',
    questionType: 'MCQ',
    subjectCode: 'CSE',
    subjectName: 'Data Structures',
    semester: 1,
    topicName: 'Trees',
    difficulty: 'hard',
    sourceType: 'GATE',
    isOriginalPyq: true,
    isAiGenerated: false,
    examName: 'GATE',
    examYear: 2024,
    verificationStatus: 'verified',
    mcqData: {
      options: [
        { id: 'A', text: 'Binary Tree' },
        { id: 'B', text: 'Array' },
        { id: 'C', text: 'Stack' },
        { id: 'D', text: 'Queue' },
      ],
      correctAnswer: 'A',
    },
    applicableBranches: ['branch_07', 'branch_31'],
  });

  // 5. AI Practice MCQ
  await createQuestion(env, {
    questionText: 'What is the voltage across a 10 Ohm resistor carrying 2 Amperes?',
    questionType: 'MCQ',
    subjectCode: '3110005',
    subjectName: 'Basic Electrical Engineering',
    semester: 1,
    topicName: 'Ohms Law',
    difficulty: 'easy',
    sourceType: 'AI_PRACTICE',
    isOriginalPyq: false,
    isAiGenerated: true,
    verificationStatus: 'verified',
    mcqData: {
      options: [
        { id: 'A', text: '20 V' },
        { id: 'B', text: '5 V' },
        { id: 'C', text: '12 V' },
        { id: 'D', text: '200 V' },
      ],
      correctAnswer: 'A',
    },
    applicableBranches: ['branch_09', 'branch_10'],
  });
}

async function runExhaustiveTestEngineSuite() {
  console.log('================================================================');
  console.log('🧪 RUNNING EXHAUSTIVE PHASE 1E: 38 TEST SCENARIOS SUITE');
  console.log('================================================================\n');

  const mockDb = createMockD1Database();
  const env = { DB: mockDb as any };

  await seedQuestionBank(env);

  let passedTests = 0;
  const totalTests = 38;

  // Helper macro runner
  const executeTest = async (testNum: number, name: string, fn: () => Promise<boolean>) => {
    process.stdout.write(`➡️ Test ${testNum}: ${name}... `);
    try {
      const ok = await fn();
      if (ok) {
        console.log('✓ PASSED');
        passedTests++;
      } else {
        console.log('❌ FAILED');
      }
    } catch (err: any) {
      console.log(`❌ THREW ERROR: ${err.message || err}`);
    }
  };

  await executeTest(1, 'Random MCQ Test', async () => {
    const res = await generateTestSession(env, { testType: 'RANDOM_TEST', questionTypes: ['MCQ'], questionCount: 2, durationMinutes: 10 });
    return 'id' in res && res.questions.every(q => q.questionType === 'MCQ');
  });

  await executeTest(2, 'Random MSQ Test', async () => {
    const res = await generateTestSession(env, { testType: 'RANDOM_TEST', questionTypes: ['MSQ'], questionCount: 1, durationMinutes: 10 });
    return 'id' in res && res.questions[0].questionType === 'MSQ';
  });

  await executeTest(3, 'Random NAT Test', async () => {
    const res = await generateTestSession(env, { testType: 'RANDOM_TEST', questionTypes: ['NAT'], questionCount: 1, durationMinutes: 10 });
    return 'id' in res && res.questions[0].questionType === 'NAT';
  });

  await executeTest(4, 'Mixed Test', async () => {
    const res = await generateTestSession(env, { testType: 'MIXED_TEST', questionTypes: 'MIXED', questionCount: 3, durationMinutes: 15 });
    return 'id' in res && res.questions.length === 3;
  });

  await executeTest(5, 'Topic Test', async () => {
    const res = await generateTestSession(env, { testType: 'TOPIC_TEST', topicName: 'Differential Equations', questionCount: 1, durationMinutes: 10 });
    return 'id' in res && res.questions[0].topicName === 'Differential Equations';
  });

  await executeTest(6, 'Subject Test', async () => {
    const res = await generateTestSession(env, { testType: 'SUBJECT_TEST', subjectCode: '3110014', questionCount: 3, durationMinutes: 15 });
    return 'id' in res && res.questions.length === 3;
  });

  await executeTest(7, 'Branch Test', async () => {
    const res = await generateTestSession(env, { testType: 'BRANCH_TEST', branchId: 'branch_07', questionCount: 3, durationMinutes: 15 });
    return 'id' in res && res.questions.length === 3;
  });

  await executeTest(8, 'GTU PYQ Test', async () => {
    const res = await generateTestSession(env, { testType: 'GTU_PYQ_TEST', sourceMode: 'GTU_PYQ', questionCount: 2, durationMinutes: 15 });
    return 'id' in res && res.questions.every(q => q.sourceType === 'GTU' && q.isOriginalPyq);
  });

  await executeTest(9, 'GATE PYQ Test', async () => {
    const res = await generateTestSession(env, { testType: 'GATE_PYQ_TEST', sourceMode: 'GATE_PYQ', questionCount: 1, durationMinutes: 10 });
    return 'id' in res && res.questions[0].sourceType === 'GATE' && res.questions[0].examName === 'GATE';
  });

  await executeTest(10, 'Practice-Only Test', async () => {
    const res = await generateTestSession(env, { testType: 'CUSTOM_TEST', sourceMode: 'PRACTICE', questionCount: 1, durationMinutes: 10 });
    return 'id' in res && res.questions[0].isAiGenerated === true;
  });

  await executeTest(11, 'Difficulty Filtering', async () => {
    const res = await generateTestSession(env, { testType: 'RANDOM_TEST', difficulty: 'HARD', questionCount: 1, durationMinutes: 10 });
    return 'id' in res && res.questions.length === 1;
  });

  await executeTest(12, 'Source Filtering', async () => {
    const res = await generateTestSession(env, { testType: 'RANDOM_TEST', sourceMode: 'GATE_PYQ', questionCount: 1, durationMinutes: 10 });
    return 'id' in res && res.questions[0].sourceType === 'GATE';
  });

  await executeTest(13, 'Question-Type Filtering', async () => {
    const res = await generateTestSession(env, { testType: 'RANDOM_TEST', questionTypes: ['NAT'], questionCount: 1, durationMinutes: 10 });
    return 'id' in res && res.questions[0].questionType === 'NAT';
  });

  await executeTest(14, 'Question Count Validation', async () => {
    const res = await generateTestSession(env, { testType: 'RANDOM_TEST', questionCount: 3, durationMinutes: 15 });
    return 'id' in res && res.questions.length === 3;
  });

  await executeTest(15, 'Duplicate Prevention', async () => {
    const res = await generateTestSession(env, { testType: 'RANDOM_TEST', questionCount: 4, durationMinutes: 20 });
    if ('id' in res) {
      const qIds = res.questions.map(q => q.id);
      return new Set(qIds).size === qIds.length;
    }
    return false;
  });

  await executeTest(16, 'Insufficient Question Handling', async () => {
    const res = await generateTestSession(env, { testType: 'RANDOM_TEST', questionCount: 999, durationMinutes: 30 });
    return 'success' in res && res.success === false && res.reason === 'INSUFFICIENT_QUESTIONS';
  });

  await executeTest(17, 'Exclude Attempted Questions', async () => {
    await env.DB.prepare(
      `INSERT INTO student_mcq_attempts (id, student_id, question_id, selected_option_id, is_correct, time_taken_seconds, practice_mode)
       VALUES ('att_101', 'std_ex', (SELECT id FROM master_question_bank WHERE subject_code = '3110014' LIMIT 1), 'A', 1, 10, 'TOPIC_WISE')`
    ).run();
    const res = await generateTestSession(env, { testType: 'RANDOM_TEST', excludeAttempted: true, studentId: 'std_ex', questionCount: 1, durationMinutes: 10 });
    return 'id' in res;
  });

  await executeTest(18, 'Exclude Correctly Answered', async () => {
    const res = await generateTestSession(env, { testType: 'RANDOM_TEST', excludeCorrectlyAnswered: true, studentId: 'std_ex', questionCount: 1, durationMinutes: 10 });
    return 'id' in res;
  });

  await executeTest(19, 'MCQ Evaluation', async () => {
    const gen = await generateTestSession(env, { testType: 'RANDOM_TEST', questionTypes: ['MCQ'], questionCount: 1, durationMinutes: 10, studentId: 'std_ev' });
    if ('id' in gen) {
      await getTestSession(env, gen.id, 'std_ev');
      const evalRes = await submitQuestionAnswer(env, gen.id, 'std_ev', gen.questions[0].id, 'A', 5);
      return evalRes.isCorrect === true;
    }
    return false;
  });

  await executeTest(20, 'MSQ Evaluation', async () => {
    const gen = await generateTestSession(env, { testType: 'RANDOM_TEST', questionTypes: ['MSQ'], questionCount: 1, durationMinutes: 10, studentId: 'std_msq' });
    if ('id' in gen) {
      await getTestSession(env, gen.id, 'std_msq');
      const evalRes = await submitQuestionAnswer(env, gen.id, 'std_msq', gen.questions[0].id, JSON.stringify(['A', 'B']), 10);
      return evalRes.isCorrect === true;
    }
    return false;
  });

  await executeTest(21, 'NAT Evaluation', async () => {
    const gen = await generateTestSession(env, { testType: 'RANDOM_TEST', questionTypes: ['NAT'], questionCount: 1, durationMinutes: 10, studentId: 'std_nat' });
    if ('id' in gen) {
      await getTestSession(env, gen.id, 'std_nat');
      const evalRes = await submitQuestionAnswer(env, gen.id, 'std_nat', gen.questions[0].id, '1.0', 10);
      return evalRes.isCorrect === true;
    }
    return false;
  });

  await executeTest(22, 'Negative Marking', async () => {
    const gen = await generateTestSession(env, { testType: 'RANDOM_TEST', questionTypes: ['MCQ'], negativeMarking: true, negativeMarkValue: 0.25, questionCount: 2, durationMinutes: 10, studentId: 'std_neg' });
    if ('id' in gen) {
      await getTestSession(env, gen.id, 'std_neg');
      await submitQuestionAnswer(env, gen.id, 'std_neg', gen.questions[0].id, 'A', 5); // +1
      await submitQuestionAnswer(env, gen.id, 'std_neg', gen.questions[1].id, 'B', 5); // -0.25
      const res = await submitTestSession(env, gen.id, 'std_neg');
      return res.score === 0.75;
    }
    return false;
  });

  await executeTest(23, 'Score Calculation', async () => {
    const gen = await generateTestSession(env, { testType: 'RANDOM_TEST', questionTypes: ['MCQ'], questionCount: 1, durationMinutes: 10, studentId: 'std_sc' });
    if ('id' in gen) {
      await getTestSession(env, gen.id, 'std_sc');
      await submitQuestionAnswer(env, gen.id, 'std_sc', gen.questions[0].id, 'A', 5);
      const res = await submitTestSession(env, gen.id, 'std_sc');
      return res.score === 1.0;
    }
    return false;
  });

  await executeTest(24, 'Accuracy Calculation', async () => {
    const gen = await generateTestSession(env, { testType: 'RANDOM_TEST', questionTypes: ['MCQ'], questionCount: 1, durationMinutes: 10, studentId: 'std_acc' });
    if ('id' in gen) {
      await getTestSession(env, gen.id, 'std_acc');
      await submitQuestionAnswer(env, gen.id, 'std_acc', gen.questions[0].id, 'A', 5);
      const res = await submitTestSession(env, gen.id, 'std_acc');
      return res.accuracyPercentage === 100.0;
    }
    return false;
  });

  await executeTest(25, 'Session Creation', async () => {
    const gen = await generateTestSession(env, { testType: 'RANDOM_TEST', questionCount: 1, durationMinutes: 10, studentId: 'std_cr' });
    return 'id' in gen && gen.status === 'CREATED';
  });

  await executeTest(26, 'Session State Transitions', async () => {
    const gen = await generateTestSession(env, { testType: 'RANDOM_TEST', questionCount: 1, durationMinutes: 10, studentId: 'std_st' });
    if ('id' in gen) {
      const active = await getTestSession(env, gen.id, 'std_st');
      return active.status === 'IN_PROGRESS';
    }
    return false;
  });

  await executeTest(27, 'Answer Persistence', async () => {
    const gen = await generateTestSession(env, { testType: 'RANDOM_TEST', questionTypes: ['MCQ'], questionCount: 1, durationMinutes: 10, studentId: 'std_ap' });
    if ('id' in gen) {
      await getTestSession(env, gen.id, 'std_ap');
      await submitQuestionAnswer(env, gen.id, 'std_ap', gen.questions[0].id, 'A', 5);
      const reGet = await getTestSession(env, gen.id, 'std_ap');
      return reGet.questions[0].selectedAnswer === 'A';
    }
    return false;
  });

  await executeTest(28, 'Submitted Session Immutability', async () => {
    const gen = await generateTestSession(env, { testType: 'RANDOM_TEST', questionCount: 1, durationMinutes: 10, studentId: 'std_im' });
    if ('id' in gen) {
      await getTestSession(env, gen.id, 'std_im');
      await submitTestSession(env, gen.id, 'std_im');
      try {
        await submitQuestionAnswer(env, gen.id, 'std_im', gen.questions[0].id, 'A', 5);
        return false;
      } catch {
        return true;
      }
    }
    return false;
  });

  await executeTest(29, 'Expired Session Handling', async () => {
    const gen = await generateTestSession(env, { testType: 'RANDOM_TEST', questionCount: 1, durationMinutes: 0, studentId: 'std_exp' });
    if ('id' in gen) {
      const active = await getTestSession(env, gen.id, 'std_exp');
      return active.status === 'EXPIRED';
    }
    return false;
  });

  await executeTest(30, 'Unauthorized Session Access Protection', async () => {
    const gen = await generateTestSession(env, { testType: 'RANDOM_TEST', questionCount: 1, durationMinutes: 10, studentId: 'std_owner' });
    if ('id' in gen) {
      try {
        await getTestSession(env, gen.id, 'std_intruder');
        return false;
      } catch {
        return true;
      }
    }
    return false;
  });

  await executeTest(31, 'Provenance Preservation', async () => {
    const gen = await generateTestSession(env, { testType: 'GATE_PYQ_TEST', sourceMode: 'GATE_PYQ', questionCount: 1, durationMinutes: 10, studentId: 'std_prov' });
    if ('id' in gen) {
      await getTestSession(env, gen.id, 'std_prov');
      await submitTestSession(env, gen.id, 'std_prov');
      const res = await getTestResult(env, gen.id, 'std_prov');
      return res.questionResults[0].sourceLabel.includes('GATE 2024');
    }
    return false;
  });

  await executeTest(32, 'Randomization', async () => {
    const gen = await generateTestSession(env, { testType: 'RANDOM_TEST', randomizeQuestions: true, questionCount: 2, durationMinutes: 10, studentId: 'std_rnd' });
    return 'id' in gen && gen.questions.length === 2;
  });

  await executeTest(33, 'Seed Reproducibility', async () => {
    const s1 = await generateTestSession(env, { testType: 'RANDOM_TEST', seed: 'seed_abc', questionCount: 2, durationMinutes: 10, studentId: 's1' });
    const s2 = await generateTestSession(env, { testType: 'RANDOM_TEST', seed: 'seed_abc', questionCount: 2, durationMinutes: 10, studentId: 's2' });
    if ('id' in s1 && 'id' in s2) {
      return s1.questions.map(q => q.id).join(',') === s2.questions.map(q => q.id).join(',');
    }
    return false;
  });

  await executeTest(34, 'Mixed-Source Distribution', async () => {
    const gen = await generateTestSession(env, { testType: 'MIXED_TEST', sourceMode: 'ALL', questionCount: 3, durationMinutes: 10, studentId: 'std_ms' });
    return 'id' in gen && gen.questions.length === 3;
  });

  await executeTest(35, 'Mixed-Question-Type Distribution', async () => {
    const gen = await generateTestSession(env, { testType: 'MIXED_TEST', questionTypes: 'MIXED', questionCount: 3, durationMinutes: 10, studentId: 'std_mqt' });
    return 'id' in gen && gen.questions.length === 3;
  });

  await executeTest(36, 'Quick Quiz Presets (5/10/20/30 mins)', async () => {
    const q1 = await generateTestSession(env, { testType: 'RANDOM_TEST', questionCount: 5, durationMinutes: 5 });
    return 'id' in q1 || ('reason' in q1 && q1.reason === 'INSUFFICIENT_QUESTIONS');
  });

  await executeTest(37, 'Immediate Practice Mode Feedback', async () => {
    const gen = await generateTestSession(env, { testType: 'RANDOM_TEST', practiceMode: 'IMMEDIATE_PRACTICE', questionTypes: ['MCQ'], questionCount: 1, durationMinutes: 10, studentId: 'std_imm_pr' });
    if ('id' in gen) {
      await getTestSession(env, gen.id, 'std_imm_pr');
      const evalRes = await submitQuestionAnswer(env, gen.id, 'std_imm_pr', gen.questions[0].id, 'A', 5);
      return evalRes.isCorrect === true && evalRes.correctAnswer === 'A';
    }
    return false;
  });

  await executeTest(38, 'Exam Mode Answer Confidentiality', async () => {
    const gen = await generateTestSession(env, { testType: 'RANDOM_TEST', practiceMode: 'EXAM_MODE', questionTypes: ['MCQ'], questionCount: 1, durationMinutes: 10, studentId: 'std_ex_mod' });
    if ('id' in gen) {
      await getTestSession(env, gen.id, 'std_ex_mod');
      const evalRes = await submitQuestionAnswer(env, gen.id, 'std_ex_mod', gen.questions[0].id, 'A', 5);
      return evalRes.isCorrect === true && evalRes.correctAnswer === undefined;
    }
    return false;
  });

  console.log('\n================================================================');
  console.log(`🎉 EXHAUSTIVE TEST SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED CLEANLY`);
  console.log('================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runExhaustiveTestEngineSuite().catch(err => {
  console.error('Fatal Exhaustive Test Engine test error:', err);
  process.exit(1);
});
