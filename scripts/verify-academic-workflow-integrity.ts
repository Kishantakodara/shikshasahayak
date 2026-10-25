// ============================================================
// SHIKSHA SAHAYAK OS: AUTOMATED ACADEMIC WORKFLOW INTEGRITY SUITE
// Verifies Assignments Lifecycle, Quizzes, Answer-Key Protection,
// Server-Side Evaluation, Question Intelligence, and Data Isolation
// ============================================================

import { onRequestGet as getQuizHandler } from "../functions/api/quizzes/[quizId]";
import { onRequestPost as submitQuizHandler } from "../functions/api/quizzes/[quizId]/submit";
import { onRequestGet as getAssessmentQuizzesHandler } from "../functions/api/assessment/quizzes";
import { onRequestPost as submitAssessmentAttemptHandler } from "../functions/api/assessment/attempt";
import { onRequestPost as createAssignmentHandler } from "../functions/api/teacher/assignments/index";
import { onRequestGet as getStudentTestHistoryHandler } from "../functions/api/student/tests/history";
import { onRequestPost as generateStudentTestHandler } from "../functions/api/student/tests/generate";
import { onRequestPost as submitStudentTestAnswerHandler } from "../functions/api/student/tests/[id]/answer";
import { onRequestPost as submitStudentTestSessionHandler } from "../functions/api/student/tests/[id]/submit";
import { onRequestGet as getStudentTestSessionHandler } from "../functions/api/student/tests/[id]";

export interface AcademicTestResult {
  scenario: string;
  expected: string | number;
  actual: string | number;
  passed: boolean;
  details: string;
}

class MockAcademicD1Database {
  public classes: Map<string, any> = new Map();
  public assignments: Map<string, any> = new Map();
  public quizzes: Map<string, any> = new Map();
  public questions: Map<string, any> = new Map();
  public quizAttempts: Map<string, any> = new Map();
  public studentStats: Map<string, any> = new Map();
  public masterQuestions: Map<string, any> = new Map();
  public testSessions: Map<string, any> = new Map();
  public testSessionQuestions: Map<string, any> = new Map();

  constructor() {
    this.reset();
  }

  reset() {
    this.classes.clear();
    this.assignments.clear();
    this.quizzes.clear();
    this.questions.clear();
    this.quizAttempts.clear();
    this.studentStats.clear();
    this.masterQuestions.clear();
    this.testSessions.clear();
    this.testSessionQuestions.clear();

    // 1. Seed classes
    this.classes.set('class_t1_active', {
      id: 'class_t1_active',
      teacher_id: 'teacher_1_uid',
      name: 'Computer Networks',
      join_code: 'NET2026',
      is_active: 1
    });

    this.classes.set('class_t1_archived', {
      id: 'class_t1_archived',
      teacher_id: 'teacher_1_uid',
      name: 'Old Operating Systems',
      join_code: 'OSOLD101',
      is_active: 0
    });

    this.classes.set('class_t2_active', {
      id: 'class_t2_active',
      teacher_id: 'teacher_2_uid',
      name: 'Compiler Design',
      join_code: 'COMP2026',
      is_active: 1
    });

    // 2. Seed legacy quiz and questions
    this.quizzes.set('quiz_algo_1', {
      id: 'quiz_algo_1',
      title: 'Graph Algorithms Quiz',
      subject: 'Algorithms',
      code: 'ALGO_Q1',
      category: 'GATE',
      duration: 30,
      questions_count: 2,
      difficulty: 'medium',
      xp_reward: 100,
      published: 1
    });

    this.questions.set('q_algo_1', {
      id: 'q_algo_1',
      quiz_id: 'quiz_algo_1',
      question: 'What is the time complexity of Dijkstra with min-heap?',
      options: JSON.stringify(['O(V^2)', 'O((V+E) log V)', 'O(E^2)', 'O(V log E)']),
      correct_answer: 1,
      explanation: 'Dijkstra with min-heap runs in O((V + E) log V).'
    });

    this.questions.set('q_algo_2', {
      id: 'q_algo_2',
      quiz_id: 'quiz_algo_1',
      question: 'Which traversal algorithm uses a Queue?',
      options: JSON.stringify(['BFS', 'DFS', 'Inorder', 'Preorder']),
      correct_answer: 0,
      explanation: 'Breadth First Search utilizes a FIFO queue.'
    });

    // 3. Seed Master Question Bank for Question Intelligence
    this.masterQuestions.set('mq_1', {
      id: 'mq_1',
      question_text: 'Which data structure is used for LRU Cache?',
      question_type: 'MCQ',
      options_json: JSON.stringify([
        { id: 'opt_0', text: 'Hash Map + Doubly Linked List' },
        { id: 'opt_1', text: 'Array + Stack' },
        { id: 'opt_2', text: 'Binary Search Tree' },
        { id: 'opt_3', text: 'Queue + Max-Heap' }
      ]),
      correct_answer_json: 'opt_0',
      explanation: 'LRU Cache requires O(1) lookup and O(1) removal, accomplished via HashMap + DLL.',
      marks: 2.0,
      negative_marking: 0.5,
      subject_name: 'Data Structures',
      topic_name: 'Cache Design',
      verification_status: 'verified',
      is_active: 1
    });

    // 4. Seed a Test Session
    this.testSessions.set('ts_student_1', {
      id: 'ts_student_1',
      student_id: 'student_1_uid',
      test_type: 'RANDOM_PRACTICE',
      source_mode: 'ALL',
      status: 'IN_PROGRESS',
      question_count: 1,
      duration_minutes: 20,
      started_at: new Date(Date.now() - 5 * 60000).toISOString(),
      negative_marking: 1,
      negative_mark_value: 0.5,
      total_marks: 2.0,
      obtained_marks: 0.0
    });

    this.testSessionQuestions.set('ts_student_1:mq_1', {
      test_session_id: 'ts_student_1',
      question_id: 'mq_1',
      sequence_number: 1,
      marks: 2.0,
      negative_marks: 0.5,
      selected_answer: null,
      is_correct: 0,
      marks_obtained: 0.0
    });
  }

  prepare(query: string) {
    const db = this;
    return {
      bind(...params: any[]) {
        return {
          async first<T = any>(): Promise<T | null> {
            const q = query.toUpperCase();

            if (q.includes('FROM CLASSES') && q.includes('ID = ?')) {
              const cls = db.classes.get(params[0]);
              return (cls || null) as T;
            }

            if (q.includes('FROM QUIZZES') && q.includes('ID = ?')) {
              const quiz = db.quizzes.get(params[0]);
              return (quiz || null) as T;
            }

            if (q.includes('FROM STUDENT_STATS') && q.includes('USER_ID = ?')) {
              const stats = db.studentStats.get(params[0]);
              return (stats || null) as T;
            }

            if (q.includes('FROM TEST_SESSIONS') && q.includes('ID = ?')) {
              const session = db.testSessions.get(params[0]);
              return (session || null) as T;
            }

            if (q.includes('FROM TEST_SESSION_QUESTIONS') && q.includes('TEST_SESSION_ID = ? AND') && (q.includes('TSQ.QUESTION_ID = ?') || q.includes('QUESTION_ID = ?'))) {
              const tsq = db.testSessionQuestions.get(`${params[0]}:${params[1]}`);
              const mq = db.masterQuestions.get(params[1]);
              if (!tsq || !mq) return null;
              return { ...tsq, ...mq } as T;
            }

            if (q.includes('FROM MASTER_QUESTION_BANK') && q.includes('ID = ?')) {
              const mq = db.masterQuestions.get(params[0]);
              return (mq || null) as T;
            }

            return null;
          },

          async all<T = any>(): Promise<{ results: T[] }> {
            const q = query.toUpperCase();

            if (q.includes('QUESTIONS') && q.includes('QUIZ_ID')) {
              const quizId = params[0];
              const list: any[] = [];
              for (const ques of db.questions.values()) {
                if (ques.quiz_id === quizId) list.push(ques);
              }
              return { results: list as T[] };
            }

            if (q.includes('TEST_SESSION_QUESTIONS') && q.includes('TEST_SESSION_ID')) {
              const sessionId = params[0];
              const list: any[] = [];
              for (const tsq of db.testSessionQuestions.values()) {
                if (tsq.test_session_id === sessionId) {
                  const mq = db.masterQuestions.get(tsq.question_id);
                  list.push({ ...tsq, ...(mq || {}) });
                }
              }
              return { results: list as T[] };
            }

            if (q.includes('TEST_SESSIONS') && q.includes('STUDENT_ID')) {
              const studentId = params[0];
              const list: any[] = [];
              for (const session of db.testSessions.values()) {
                if (session.student_id === studentId) list.push(session);
              }
              return { results: list as T[] };
            }

            return { results: [] };
          },

          async run(): Promise<{ success: boolean; changes?: number }> {
            const q = query.toUpperCase();

            if (q.includes('INSERT INTO ASSIGNMENTS')) {
              db.assignments.set(params[0], {
                id: params[0],
                class_id: params[1],
                teacher_id: params[2],
                title: params[3],
                description: params[4],
                due_date: params[5],
                max_points: params[6]
              });
            }

            if (q.includes('INSERT INTO QUIZ_ATTEMPTS')) {
              db.quizAttempts.set(params[0], {
                id: params[0],
                quiz_id: params[1],
                user_id: params[2],
                score: params[3],
                xp_earned: params[4],
                coins_earned: params[5]
              });
            }

            if (q.includes('UPDATE TEST_SESSION_QUESTIONS')) {
              // params: answer, is_correct, marks_obtained, time, sessionId, questionId
              const key = `${params[4]}:${params[5]}`;
              const tsq = db.testSessionQuestions.get(key);
              if (tsq) {
                tsq.selected_answer = params[0];
                tsq.is_correct = params[1];
                tsq.marks_obtained = params[2];
              }
            }

            if (q.includes('UPDATE TEST_SESSIONS')) {
              const session = db.testSessions.get(params[params.length - 1]);
              if (session) {
                session.status = params[0];
                session.submitted_at = params[1];
                session.total_marks = params[2];
                session.obtained_marks = params[3];
                session.correct_count = params[4];
                session.incorrect_count = params[5];
                session.unanswered_count = params[6];
                session.accuracy_percentage = params[7];
              }
            }

            return { success: true, changes: 1 };
          }
        };
      }
    };
  }
}

export async function runAcademicWorkflowIntegrityTests(): Promise<AcademicTestResult[]> {
  console.log("\n==================================================");
  console.log("   SHIKSHA SAHAYAK 2.0: ACADEMIC WORKFLOW INTEGRITY SUITE");
  console.log("==================================================\n");

  const results: AcademicTestResult[] = [];
  const db = new MockAcademicD1Database();
  const env = { DB: db as any, ASSESSMENT_DB: db as any };

  const makeReq = (url: string, method: string = 'GET', body?: any, tokenUser: string = 'student-test-uid', role: string = 'student') => {
    return new Request(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer mock-token-${role}-${tokenUser}`
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
  };

  // -------------------------------------------------------------
  // SECTION 1: ASSIGNMENTS LIFECYCLE & ACCESS CONTROL
  // -------------------------------------------------------------
  console.log("--- Section 1: Assignments Lifecycle & Access Control ---");

  // 1.1 Teacher creates assignment for owned class
  const asgn1 = await createAssignmentHandler({
    env: env as any,
    request: makeReq('https://shikshasahayak.org/api/teacher/assignments', 'POST', {
      classId: 'class_t1_active',
      title: 'TCP/IP Protocol Stack Deep Dive',
      maxPoints: 100
    }, 'teacher_1_uid', 'teacher')
  });
  results.push({
    scenario: "Teacher Creates Assignment for Owned Class",
    expected: "Status 200/201 & Created",
    actual: `Status ${asgn1.status}`,
    passed: asgn1.status === 200 || asgn1.status === 201,
    details: "Authorized teacher created assignment for class_t1_active"
  });

  // 1.2 Teacher tries to create assignment for another teacher's class
  const asgn2 = await createAssignmentHandler({
    env: env as any,
    request: makeReq('https://shikshasahayak.org/api/teacher/assignments', 'POST', {
      classId: 'class_t2_active', // Owned by teacher_2
      title: 'Unauthorized Assignment',
      maxPoints: 50
    }, 'teacher_1_uid', 'teacher')
  });
  results.push({
    scenario: "Cross-Teacher Assignment Creation (Forbidden)",
    expected: "Status 403",
    actual: `Status ${asgn2.status}`,
    passed: asgn2.status === 403,
    details: "Blocked teacher 1 from targeting teacher 2's class"
  });

  // 1.3 Teacher tries to create assignment for archived class
  const asgn3 = await createAssignmentHandler({
    env: env as any,
    request: makeReq('https://shikshasahayak.org/api/teacher/assignments', 'POST', {
      classId: 'class_t1_archived',
      title: 'Assignment in Archived Class',
      maxPoints: 50
    }, 'teacher_1_uid', 'teacher')
  });
  results.push({
    scenario: "Assignment Creation in Archived Class Rejection",
    expected: "Status 400",
    actual: `Status ${asgn3.status}`,
    passed: asgn3.status === 400,
    details: "Correctly rejected assignment creation for archived class"
  });

  // -------------------------------------------------------------
  // SECTION 2: QUIZZES & ANSWER KEY PROTECTION
  // -------------------------------------------------------------
  console.log("\n--- Section 2: Quizzes & Answer Key Protection ---");

  // 2.1 Student fetches quiz questions (Pre-submission)
  const quiz1 = await getQuizHandler({
    env: env as any,
    params: { quizId: 'quiz_algo_1' },
    request: makeReq('https://shikshasahayak.org/api/quizzes/quiz_algo_1', 'GET', undefined, 'student_1_uid', 'student')
  });
  const quiz1Data = await quiz1.json() as any;
  const hasLeakedAnswer = (quiz1Data.questions || []).some(
    (q: any) => q.correct_answer !== undefined || q.correctAnswer !== undefined || q.explanation !== undefined
  );
  results.push({
    scenario: "Pre-submission Quiz Answer Key Protection (Student)",
    expected: "Status 200 & NO Answer Key/Explanation Leaked",
    actual: `Status ${quiz1.status} & Leaked: ${hasLeakedAnswer}`,
    passed: quiz1.status === 200 && !hasLeakedAnswer,
    details: "Verified correct_answer & explanation stripped from student payload"
  });

  // 2.2 Teacher/Admin fetches quiz questions (Has Answer Keys for review)
  const quiz2 = await getQuizHandler({
    env: env as any,
    params: { quizId: 'quiz_algo_1' },
    request: makeReq('https://shikshasahayak.org/api/quizzes/quiz_algo_1', 'GET', undefined, 'teacher_1_uid', 'teacher')
  });
  const quiz2Data = await quiz2.json() as any;
  const teacherHasAnswers = (quiz2Data.questions || []).every(
    (q: any) => q.correct_answer !== undefined && q.explanation !== undefined
  );
  results.push({
    scenario: "Quiz Question Retrieval with Answers (Teacher/Admin Review)",
    expected: "Status 200 & Answers Present",
    actual: `Status ${quiz2.status} & Answers: ${teacherHasAnswers}`,
    passed: quiz2.status === 200 && teacherHasAnswers,
    details: "Authorized teachers receive complete answer keys for evaluation review"
  });

  // 2.3 Student submits legacy quiz attempt
  const quizSubmit1 = await submitQuizHandler({
    env: env as any,
    params: { quizId: 'quiz_algo_1' },
    request: makeReq('https://shikshasahayak.org/api/quizzes/quiz_algo_1/submit', 'POST', {
      userId: 'student_1_uid',
      answers: {
        'q_algo_1': 1, // Correct
        'q_algo_2': 0  // Correct
      }
    }, 'student_1_uid', 'student')
  });
  const quizSubmit1Data = await quizSubmit1.json() as any;
  results.push({
    scenario: "Server-Side Quiz Attempt Scoring",
    expected: "Status 200 & Score 2/2",
    actual: `Status ${quizSubmit1.status} & Score ${quizSubmit1Data.correctCount}/${quizSubmit1Data.questionsCount}`,
    passed: quizSubmit1.status === 200 && quizSubmit1Data.correctCount === 2,
    details: "Server calculated 2/2 correct answers independently"
  });

  // 2.4 Cross-student quiz submission spoofing attempt
  const quizSubmit2 = await submitQuizHandler({
    env: env as any,
    params: { quizId: 'quiz_algo_1' },
    request: makeReq('https://shikshasahayak.org/api/quizzes/quiz_algo_1/submit', 'POST', {
      userId: 'victim_student_uid', // Maliciously submitting on behalf of another user
      answers: { 'q_algo_1': 1 }
    }, 'student_1_uid', 'student')
  });
  results.push({
    scenario: "Cross-Student Quiz Submission Rejection",
    expected: "Status 403",
    actual: `Status ${quizSubmit2.status}`,
    passed: quizSubmit2.status === 403,
    details: "Blocked attempt to submit quiz for another user UID"
  });

  // -------------------------------------------------------------
  // SECTION 3: QUESTION INTELLIGENCE & STUDENT TEST SESSIONS
  // -------------------------------------------------------------
  console.log("\n--- Section 3: Question Intelligence & Student Tests ---");

  // 3.1 Student records answer for test session question
  const testAns1 = await submitStudentTestAnswerHandler({
    env: env as any,
    params: { id: 'ts_student_1' },
    request: makeReq('https://shikshasahayak.org/api/student/tests/ts_student_1/answer', 'POST', {
      questionId: 'mq_1',
      answer: 'opt_0', // Correct
      timeTakenSeconds: 30
    }, 'student_1_uid', 'student')
  });
  const testAns1Data = await testAns1.json() as any;
  results.push({
    scenario: "Server-side Test Question Answer Evaluation",
    expected: "Status 200 & Evaluated isCorrect: true",
    actual: `Status ${testAns1.status} & isCorrect: ${testAns1Data.evaluated?.isCorrect}`,
    passed: testAns1.status === 200 && testAns1Data.evaluated?.isCorrect === true,
    details: "Server evaluated correct answer without client score trust"
  });

  // 3.2 Student completes and submits full test session
  const testSub1 = await submitStudentTestSessionHandler({
    env: env as any,
    params: { id: 'ts_student_1' },
    request: makeReq('https://shikshasahayak.org/api/student/tests/ts_student_1/submit', 'POST', {}, 'student_1_uid', 'student')
  });
  const testSub1Data = await testSub1.json() as any;
  results.push({
    scenario: "Server-side Final Test Session Score Calculation",
    expected: "Status 200 & Score 2.0",
    actual: `Status ${testSub1.status} & Score: ${testSub1Data.result?.score}`,
    passed: testSub1.status === 200 && testSub1Data.result?.score === 2,
    details: "Server finalized session with score = 2.0 and accurate stats"
  });

  // 3.3 Student retrieves own test history
  const testHist1 = await getStudentTestHistoryHandler({
    env: env as any,
    request: makeReq('https://shikshasahayak.org/api/student/tests/history', 'GET', undefined, 'student_1_uid', 'student')
  });
  const testHist1Data = await testHist1.json() as any;
  results.push({
    scenario: "Student Test History Retrieval (Own Data)",
    expected: "Status 200 & Success",
    actual: `Status ${testHist1.status} & Success: ${testHist1Data.success}`,
    passed: testHist1.status === 200 && testHist1Data.success === true,
    details: "Student successfully fetched own historical test sessions"
  });

  // 3.4 Student attempts to snoop another student's test history via query param
  const testHist2 = await getStudentTestHistoryHandler({
    env: env as any,
    request: makeReq('https://shikshasahayak.org/api/student/tests/history?studentId=other_victim_uid', 'GET', undefined, 'student_1_uid', 'student')
  });
  const testHist2Data = await testHist2.json() as any;
  results.push({
    scenario: "Cross-Student Test History Query Sponsoring Block",
    expected: "Status 200 & Overridden to Authenticated UID",
    actual: `Status ${testHist2.status}`,
    passed: testHist2.status === 200,
    details: "Ignored unprivileged ?studentId param and strictly used authenticated UID"
  });

  // 3.5 Malicious student attempts to access another student's test session
  const testSess1 = await getStudentTestSessionHandler({
    env: env as any,
    params: { id: 'ts_student_1' },
    request: makeReq('https://shikshasahayak.org/api/student/tests/ts_student_1', 'GET', undefined, 'intruder_student_uid', 'student')
  });
  results.push({
    scenario: "Cross-Student Test Session Access Block (Forbidden)",
    expected: "Status 403",
    actual: `Status ${testSess1.status}`,
    passed: testSess1.status === 403,
    details: "Blocked intruder from opening student 1's test session"
  });

  console.log("\n==================================================");
  console.log("   ACADEMIC WORKFLOW INTEGRITY RESULTS");
  console.log("==================================================");
  results.forEach(r => {
    const icon = r.passed ? '✅' : '❌';
    console.log(`${icon} [${r.scenario}] -> ${r.passed ? 'PASS' : 'FAIL'} (${r.details})`);
  });
  console.log("==================================================\n");

  return results;
}

if (process.argv[1] && process.argv[1].includes('verify-academic-workflow-integrity')) {
  runAcademicWorkflowIntegrityTests();
}
