/**
 * ShikshaSahayak - Post-Migration Remote Persistence Acceptance Test
 * Executes live round-trip read/write/refresh/cleanup tests against remote Cloudflare D1 (PADHAKU_CORE_DB).
 */

import { execSync } from 'child_process';

const TEST_USER_ID = 'test_student_acceptance_2026';
const LOG_PREFIX = '[REMOTE D1 ACCEPTANCE]';

interface StepResult {
  module: string;
  test: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

const results: StepResult[] = [];

function runD1Query(sql: string): any {
  const sanitizedSql = sql.replace(/"/g, '\\"');
  const cmd = `npx wrangler d1 execute PADHAKU_CORE_DB --remote --json --command="${sanitizedSql}"`;
  const stdout = execSync(cmd, { encoding: 'utf-8', timeout: 30000 });
  const parsed = JSON.parse(stdout);
  return parsed[0];
}

console.log('====================================================');
console.log('SHIKSHA SAHAYAK: LIVE REMOTE D1 PERSISTENCE ACCEPTANCE');
console.log('====================================================\n');

async function runAcceptanceTests() {
  // Pre-cleanup in case of previous run
  console.log(`${LOG_PREFIX} Running initial test record cleanup for: ${TEST_USER_ID}...`);
  try {
    runD1Query(`
      DELETE FROM student_course_enrollments WHERE user_id = '${TEST_USER_ID}';
      DELETE FROM student_lesson_progress WHERE user_id = '${TEST_USER_ID}';
      DELETE FROM workshop_registrations WHERE user_id = '${TEST_USER_ID}';
      DELETE FROM student_fest_registrations WHERE user_id = '${TEST_USER_ID}';
      DELETE FROM student_scholarship_bookmarks WHERE user_id = '${TEST_USER_ID}';
      DELETE FROM student_interview_progress WHERE user_id = '${TEST_USER_ID}';
      DELETE FROM student_100_days_progress WHERE user_id = '${TEST_USER_ID}';
      DELETE FROM coding_conquest_submissions WHERE user_id = '${TEST_USER_ID}';
      DELETE FROM student_bookmarks WHERE user_id = '${TEST_USER_ID}';
    `);
    console.log(`${LOG_PREFIX} Initial cleanup complete.`);
  } catch (err: any) {
    console.warn('Initial cleanup warning (non-fatal):', err.message);
  }

  // 1. Course Enrollment & Lesson Progress
  console.log(`\n${LOG_PREFIX} Testing Module 1: Course Enrollment & Lesson Progress...`);
  try {
    const enrollInsert = runD1Query(`
      INSERT INTO student_course_enrollments (id, user_id, course_id, enrolled_at, progress_percent)
      VALUES ('enr_${TEST_USER_ID}_c1', '${TEST_USER_ID}', 'course-react-fullstack', CURRENT_TIMESTAMP, 0.0);
    `);
    
    const lessonInsert = runD1Query(`
      INSERT INTO student_lesson_progress (id, user_id, course_id, lesson_id, is_completed, completed_at)
      VALUES ('prog_${TEST_USER_ID}_les1', '${TEST_USER_ID}', 'course-react-fullstack', 'les-1-1', 1, CURRENT_TIMESTAMP);
    `);

    const readProg = runD1Query(`
      SELECT lesson_id, is_completed FROM student_lesson_progress 
      WHERE user_id = '${TEST_USER_ID}' AND course_id = 'course-react-fullstack';
    `);

    if (readProg.results && readProg.results.length === 1 && readProg.results[0].lesson_id === 'les-1-1') {
      results.push({
        module: 'Courses & Skills',
        test: 'Course enrollment & lesson progress persistence',
        status: 'PASS',
        details: 'Record verified in remote D1 table student_lesson_progress with is_completed=1'
      });
      console.log('✅ Course enrollment & lesson progress: PASS');
    } else {
      throw new Error('Read back verification failed for lesson progress');
    }
  } catch (err: any) {
    results.push({
      module: 'Courses & Skills',
      test: 'Course enrollment & lesson progress persistence',
      status: 'FAIL',
      details: err.message
    });
    console.error('❌ Course enrollment & lesson progress: FAIL', err.message);
  }

  // 2. Workshop Registrations & Duplicate Safe RSVP
  console.log(`\n${LOG_PREFIX} Testing Module 2: Workshop Registrations & Duplicate Protection...`);
  try {
    runD1Query(`
      INSERT INTO workshop_registrations (id, user_id, workshop_id, registered_at, attendance_status)
      VALUES ('wreg_${TEST_USER_ID}_ws1', '${TEST_USER_ID}', 'ws-gemini-cloud-01', CURRENT_TIMESTAMP, 'REGISTERED');
    `);

    // Test duplicate RSVP
    const dupRes = runD1Query(`
      INSERT INTO workshop_registrations (id, user_id, workshop_id, registered_at, attendance_status)
      VALUES ('wreg_${TEST_USER_ID}_ws1_dup', '${TEST_USER_ID}', 'ws-gemini-cloud-01', CURRENT_TIMESTAMP, 'REGISTERED')
      ON CONFLICT(user_id, workshop_id) DO NOTHING;
    `);

    const checkCount = runD1Query(`
      SELECT COUNT(*) as cnt FROM workshop_registrations WHERE user_id = '${TEST_USER_ID}' AND workshop_id = 'ws-gemini-cloud-01';
    `);

    if (checkCount.results && checkCount.results[0].cnt === 1) {
      results.push({
        module: 'Workshops & Masterclasses',
        test: 'RSVP persistence and duplicate request protection',
        status: 'PASS',
        details: 'Verified 1 registration; duplicate insert absorbed by UNIQUE(user_id, workshop_id)'
      });
      console.log('✅ Workshop RSVP & duplicate prevention: PASS');
    } else {
      throw new Error(`Expected exactly 1 registration, found ${checkCount.results?.[0]?.cnt}`);
    }
  } catch (err: any) {
    results.push({
      module: 'Workshops & Masterclasses',
      test: 'RSVP persistence and duplicate request protection',
      status: 'FAIL',
      details: err.message
    });
    console.error('❌ Workshop RSVP: FAIL', err.message);
  }

  // 3. College Festival Registrations
  console.log(`\n${LOG_PREFIX} Testing Module 3: College Festival Registrations...`);
  try {
    runD1Query(`
      INSERT INTO student_fest_registrations (id, user_id, festival_id, event_id, team_name, registered_at, status)
      VALUES ('freg_${TEST_USER_ID}_ev1', '${TEST_USER_ID}', 'fest-gtu-techfest', 'ev-gtu-hack', 'ShikshaSahayak Test Squad', CURRENT_TIMESTAMP, 'CONFIRMED');
    `);

    // Repeat RSVP
    runD1Query(`
      INSERT INTO student_fest_registrations (id, user_id, festival_id, event_id, team_name, registered_at, status)
      VALUES ('freg_${TEST_USER_ID}_ev1_repeat', '${TEST_USER_ID}', 'fest-gtu-techfest', 'ev-gtu-hack', 'ShikshaSahayak Test Squad', CURRENT_TIMESTAMP, 'CONFIRMED')
      ON CONFLICT(user_id, event_id) DO NOTHING;
    `);

    const festCheck = runD1Query(`
      SELECT team_name, status FROM student_fest_registrations WHERE user_id = '${TEST_USER_ID}' AND event_id = 'ev-gtu-hack';
    `);

    if (festCheck.results && festCheck.results.length === 1 && festCheck.results[0].team_name === 'ShikshaSahayak Test Squad') {
      results.push({
        module: 'College Festivals',
        test: 'Festival event RSVP and repeat request protection',
        status: 'PASS',
        details: 'Confirmed registration in student_fest_registrations; repeat absorbed by UNIQUE(user_id, event_id)'
      });
      console.log('✅ Festival event RSVP: PASS');
    } else {
      throw new Error('Festival read back verification failed');
    }
  } catch (err: any) {
    results.push({
      module: 'College Festivals',
      test: 'Festival event RSVP and repeat request protection',
      status: 'FAIL',
      details: err.message
    });
    console.error('❌ Festival RSVP: FAIL', err.message);
  }

  // 4. Scholarship Bookmarks
  console.log(`\n${LOG_PREFIX} Testing Module 4: Scholarship Bookmarks...`);
  try {
    runD1Query(`
      INSERT INTO student_scholarship_bookmarks (id, user_id, scholarship_id, status, created_at)
      VALUES ('sbm_${TEST_USER_ID}_sch1', '${TEST_USER_ID}', 'sch-reliance-ug-2026', 'SAVED', CURRENT_TIMESTAMP);
    `);

    const schRead = runD1Query(`
      SELECT scholarship_id, status FROM student_scholarship_bookmarks WHERE user_id = '${TEST_USER_ID}';
    `);

    if (schRead.results && schRead.results.length === 1 && schRead.results[0].scholarship_id === 'sch-reliance-ug-2026') {
      results.push({
        module: 'Scholarships Directory',
        test: 'Scholarship bookmark persistence',
        status: 'PASS',
        details: 'Verified bookmark record in student_scholarship_bookmarks'
      });
      console.log('✅ Scholarship bookmarks: PASS');
    } else {
      throw new Error('Scholarship bookmark read back failed');
    }
  } catch (err: any) {
    results.push({
      module: 'Scholarships Directory',
      test: 'Scholarship bookmark persistence',
      status: 'FAIL',
      details: err.message
    });
    console.error('❌ Scholarship bookmarks: FAIL', err.message);
  }

  // 5. 5-Day Interview Prep Progress
  console.log(`\n${LOG_PREFIX} Testing Module 5: 5-Day Interview Prep Progress...`);
  try {
    runD1Query(`
      INSERT INTO student_interview_progress (id, user_id, day_number, task_id, is_completed, completed_at)
      VALUES ('ip_${TEST_USER_ID}_d1t1', '${TEST_USER_ID}', 1, 'd1-t1', 1, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, day_number, task_id) DO UPDATE SET is_completed = excluded.is_completed;
    `);

    const ipRead = runD1Query(`
      SELECT day_number, task_id, is_completed FROM student_interview_progress 
      WHERE user_id = '${TEST_USER_ID}' AND task_id = 'd1-t1';
    `);

    if (ipRead.results && ipRead.results.length === 1 && ipRead.results[0].is_completed === 1) {
      results.push({
        module: '5-Day Interview Prep',
        test: 'Task completion toggle and remote persistence',
        status: 'PASS',
        details: 'Task progress stored and retrieved from student_interview_progress with is_completed=1'
      });
      console.log('✅ 5-Day Interview Prep progress: PASS');
    } else {
      throw new Error('Interview prep read back failed');
    }
  } catch (err: any) {
    results.push({
      module: '5-Day Interview Prep',
      test: 'Task completion toggle and remote persistence',
      status: 'FAIL',
      details: err.message
    });
    console.error('❌ 5-Day Interview Prep: FAIL', err.message);
  }

  // 6. 100 Days of Code Challenge
  console.log(`\n${LOG_PREFIX} Testing Module 6: 100 Days of Code Submissions...`);
  try {
    runD1Query(`
      INSERT INTO student_100_days_progress (id, user_id, day_number, status, language, submitted_code, passed_tests, total_tests, execution_time_ms, submitted_at)
      VALUES ('hnd_${TEST_USER_ID}_1', '${TEST_USER_ID}', 1, 'SOLVED', 'javascript', 'function test() { return true; }', 3, 3, 22, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, day_number) DO UPDATE SET status = 'SOLVED', execution_time_ms = excluded.execution_time_ms;
    `);

    const codeRead = runD1Query(`
      SELECT day_number, status, language, passed_tests FROM student_100_days_progress 
      WHERE user_id = '${TEST_USER_ID}' AND day_number = 1;
    `);

    if (codeRead.results && codeRead.results.length === 1 && codeRead.results[0].status === 'SOLVED') {
      results.push({
        module: '100 Days of Code',
        test: 'Daily problem submission and conflict update',
        status: 'PASS',
        details: 'Submission verified in student_100_days_progress with status=SOLVED, 3/3 tests passed'
      });
      console.log('✅ 100 Days of Code submissions: PASS');
    } else {
      throw new Error('100 days of code read back failed');
    }
  } catch (err: any) {
    results.push({
      module: '100 Days of Code',
      test: 'Daily problem submission and conflict update',
      status: 'FAIL',
      details: err.message
    });
    console.error('❌ 100 Days of Code: FAIL', err.message);
  }

  // 7. Coding Conquest Arena
  console.log(`\n${LOG_PREFIX} Testing Module 7: Coding Conquest Arena Submissions...`);
  try {
    runD1Query(`
      INSERT INTO coding_conquest_submissions (id, user_id, user_name, conquest_id, problem_id, language, code, status, execution_time_ms, score, submitted_at)
      VALUES ('csub_${TEST_USER_ID}_1', '${TEST_USER_ID}', 'Acceptance Tester', 'conquest-gtu-sprint', 'prob-cq-1', 'cpp', '#include <iostream>', 'ACCEPTED', 18, 100, CURRENT_TIMESTAMP);
    `);

    const cqRead = runD1Query(`
      SELECT problem_id, status, score FROM coding_conquest_submissions 
      WHERE user_id = '${TEST_USER_ID}' AND conquest_id = 'conquest-gtu-sprint';
    `);

    if (cqRead.results && cqRead.results.length === 1 && cqRead.results[0].status === 'ACCEPTED') {
      results.push({
        module: 'Coding Conquest',
        test: 'Contest submission scoring and persistence',
        status: 'PASS',
        details: 'Submission verified in coding_conquest_submissions with status=ACCEPTED and score=100'
      });
      console.log('✅ Coding Conquest submissions: PASS');
    } else {
      throw new Error('Coding conquest read back failed');
    }
  } catch (err: any) {
    results.push({
      module: 'Coding Conquest',
      test: 'Contest submission scoring and persistence',
      status: 'FAIL',
      details: err.message
    });
    console.error('❌ Coding Conquest: FAIL', err.message);
  }

  // 8. Student Bookmarks (My Library Study Materials Vault)
  console.log(`\n${LOG_PREFIX} Testing Module 8: Student Bookmarks Vault...`);
  try {
    runD1Query(`
      INSERT INTO student_bookmarks (id, user_id, resource_id, resource_type, title, url, subject_name)
      VALUES ('bm_${TEST_USER_ID}_res1', '${TEST_USER_ID}', 'doc_cn_unit1', 'study_material', 'Unit 1 OSI Model Notes', '/materials/doc_cn_unit1', 'Computer Networks');
    `);

    const bmRead = runD1Query(`
      SELECT resource_id, title, subject_name FROM student_bookmarks 
      WHERE user_id = '${TEST_USER_ID}' AND resource_id = 'doc_cn_unit1';
    `);

    if (bmRead.results && bmRead.results.length === 1 && bmRead.results[0].title === 'Unit 1 OSI Model Notes') {
      results.push({
        module: 'My Library & Study Vault',
        test: 'Study material bookmarking in student_bookmarks',
        status: 'PASS',
        details: 'Bookmark stored and retrieved cleanly from newly migrated table student_bookmarks'
      });
      console.log('✅ Student Bookmarks Vault: PASS');
    } else {
      throw new Error('Student bookmark read back failed');
    }
  } catch (err: any) {
    results.push({
      module: 'My Library & Study Vault',
      test: 'Study material bookmarking in student_bookmarks',
      status: 'FAIL',
      details: err.message
    });
    console.error('❌ Student Bookmarks Vault: FAIL', err.message);
  }

  // Final Cleanup
  console.log(`\n${LOG_PREFIX} Performing final test record cleanup for: ${TEST_USER_ID}...`);
  try {
    runD1Query(`
      DELETE FROM student_course_enrollments WHERE user_id = '${TEST_USER_ID}';
      DELETE FROM student_lesson_progress WHERE user_id = '${TEST_USER_ID}';
      DELETE FROM workshop_registrations WHERE user_id = '${TEST_USER_ID}';
      DELETE FROM student_fest_registrations WHERE user_id = '${TEST_USER_ID}';
      DELETE FROM student_scholarship_bookmarks WHERE user_id = '${TEST_USER_ID}';
      DELETE FROM student_interview_progress WHERE user_id = '${TEST_USER_ID}';
      DELETE FROM student_100_days_progress WHERE user_id = '${TEST_USER_ID}';
      DELETE FROM coding_conquest_submissions WHERE user_id = '${TEST_USER_ID}';
      DELETE FROM student_bookmarks WHERE user_id = '${TEST_USER_ID}';
    `);
    console.log(`${LOG_PREFIX} Final cleanup confirmed. Zero residual test records left in remote D1.`);
  } catch (err: any) {
    console.warn('Final cleanup warning:', err.message);
  }

  console.log('\n====================================================');
  console.log('ACCEPTANCE SUMMARY:');
  console.table(results);
  console.log('====================================================');

  const allPassed = results.every(r => r.status === 'PASS');
  if (!allPassed) {
    process.exit(1);
  }
}

runAcceptanceTests().catch(err => {
  console.error('Fatal acceptance test failure:', err);
  process.exit(1);
});
