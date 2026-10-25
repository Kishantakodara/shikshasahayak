-- ============================================================
-- LIVE REMOTE D1 PERSISTENCE ACCEPTANCE TEST SUITE
-- Executes isolated round-trip tests and cleans up test records.
-- ============================================================

-- 1. SETUP & PARENT RECORD SEEDING FOR ISOLATED TEST USER
INSERT OR REPLACE INTO learning_courses (id, title, slug, category, level, instructor_name)
VALUES ('test_c_2026', 'Test Cloud Systems', 'test-cloud-systems', 'Core Engineering', 'Beginner', 'Antigravity Test');

INSERT OR REPLACE INTO course_modules (id, course_id, title, order_index)
VALUES ('test_mod_2026', 'test_c_2026', 'Module 1: Test Foundations', 1);

INSERT OR REPLACE INTO course_lessons (id, course_id, module_id, title, duration_minutes, order_index)
VALUES ('test_les_2026', 'test_c_2026', 'test_mod_2026', 'Lesson 1.1: Test Overview', 10, 1);

INSERT OR REPLACE INTO workshops (id, title, slug, category, speaker_name, speaker_company_or_institution, start_time, end_time, venue_or_url)
VALUES ('test_ws_2026', 'Test AI Edge Workshop', 'test-ai-edge-workshop', 'AI & Cloud', 'Test Speaker', 'Test Lab', '2026-11-01 10:00:00', '2026-11-01 12:00:00', 'https://meet.test');

INSERT OR REPLACE INTO college_festivals (id, name, slug, college_name, location, fest_type, start_date, end_date)
VALUES ('test_fest_2026', 'Test TechFest 2026', 'test-techfest-2026', 'Test Institute of Tech', 'Ahmedabad', 'Technical', '2026-12-01', '2026-12-03');

INSERT OR REPLACE INTO fest_events (id, festival_id, title, category, entry_fee, prize_pool)
VALUES ('test_ev_2026', 'test_fest_2026', 'Test Hackathon', 'Coding', 0, 50000);

INSERT OR REPLACE INTO scholarships (id, title, slug, provider, amount_inr, official_application_url)
VALUES ('test_sch_2026', 'Test Merit Scholarship', 'test-merit-scholarship', 'Test Foundation', 50000, 'https://test.scholarship');

INSERT OR REPLACE INTO coding_conquests (id, title, slug, description, category, difficulty, start_time, end_time, problems_json)
VALUES ('test_cq_2026', 'Test Sprint Arena', 'test-sprint-arena', 'Test contest', 'DSA Sprint', 'All Divisions', '2026-11-01 18:00:00', '2026-11-01 19:00:00', '[]');


-- 2. CHILD TRANSACTIONS & DUPLICATE PROTECTION TESTS

-- Module 1: Course Enrollment & Lesson Progress
INSERT INTO student_course_enrollments (id, user_id, course_id, enrolled_at, progress_percent)
VALUES ('enr_t2026_c', 'test_user_acceptance_2026', 'test_c_2026', CURRENT_TIMESTAMP, 50.0);

INSERT INTO student_lesson_progress (id, user_id, course_id, lesson_id, is_completed, completed_at)
VALUES ('prog_t2026_l', 'test_user_acceptance_2026', 'test_c_2026', 'test_les_2026', 1, CURRENT_TIMESTAMP);

-- Module 2: Workshop RSVP & Duplicate Prevention
INSERT INTO workshop_registrations (id, user_id, workshop_id, registered_at, attendance_status)
VALUES ('wreg_t2026_1', 'test_user_acceptance_2026', 'test_ws_2026', CURRENT_TIMESTAMP, 'REGISTERED');

INSERT INTO workshop_registrations (id, user_id, workshop_id, registered_at, attendance_status)
VALUES ('wreg_t2026_dup', 'test_user_acceptance_2026', 'test_ws_2026', CURRENT_TIMESTAMP, 'REGISTERED')
ON CONFLICT(user_id, workshop_id) DO NOTHING;

-- Module 3: Festival RSVP & Repeat Prevention
INSERT INTO student_fest_registrations (id, user_id, festival_id, event_id, team_name, registered_at, status)
VALUES ('freg_t2026_1', 'test_user_acceptance_2026', 'test_fest_2026', 'test_ev_2026', 'Test Coders', CURRENT_TIMESTAMP, 'CONFIRMED');

INSERT INTO student_fest_registrations (id, user_id, festival_id, event_id, team_name, registered_at, status)
VALUES ('freg_t2026_rep', 'test_user_acceptance_2026', 'test_fest_2026', 'test_ev_2026', 'Test Coders', CURRENT_TIMESTAMP, 'CONFIRMED')
ON CONFLICT(user_id, event_id) DO NOTHING;

-- Module 4: Scholarship Bookmarks
INSERT INTO student_scholarship_bookmarks (id, user_id, scholarship_id, status, created_at)
VALUES ('sbm_t2026_1', 'test_user_acceptance_2026', 'test_sch_2026', 'SAVED', CURRENT_TIMESTAMP);

-- Module 5: 5-Day Interview Prep Progress
INSERT INTO student_interview_progress (id, user_id, day_number, task_id, is_completed, completed_at)
VALUES ('ip_t2026_1', 'test_user_acceptance_2026', 1, 'd1-t1', 1, CURRENT_TIMESTAMP)
ON CONFLICT(user_id, day_number, task_id) DO UPDATE SET is_completed = excluded.is_completed;

-- Module 6: 100 Days of Code Submissions
INSERT INTO student_100_days_progress (id, user_id, day_number, status, language, submitted_code, passed_tests, total_tests, execution_time_ms, submitted_at)
VALUES ('hnd_t2026_1', 'test_user_acceptance_2026', 1, 'SOLVED', 'javascript', 'function test() {}', 3, 3, 15, CURRENT_TIMESTAMP)
ON CONFLICT(user_id, day_number) DO UPDATE SET status = 'SOLVED', execution_time_ms = excluded.execution_time_ms;

-- Module 7: Coding Conquest Submissions
INSERT INTO coding_conquest_submissions (id, user_id, user_name, conquest_id, problem_id, language, code, status, execution_time_ms, score, submitted_at)
VALUES ('csub_t2026_1', 'test_user_acceptance_2026', 'Tester 2026', 'test_cq_2026', 'prob-1', 'cpp', '#include <iostream>', 'ACCEPTED', 20, 100, CURRENT_TIMESTAMP);

-- Module 8: My Library Study Material Bookmarks
INSERT INTO student_bookmarks (id, user_id, resource_id, resource_type, title, url, subject_name)
VALUES ('bm_t2026_1', 'test_user_acceptance_2026', 'doc_test_101', 'study_material', 'Test Notes Unit 1', '/materials/test101', 'Operating Systems');


-- 3. VERIFICATION QUERIES (ASSERTIONS)
SELECT 
  (SELECT count(*) FROM student_course_enrollments WHERE user_id = 'test_user_acceptance_2026') as count_enrollments,
  (SELECT count(*) FROM student_lesson_progress WHERE user_id = 'test_user_acceptance_2026') as count_lesson_progress,
  (SELECT count(*) FROM workshop_registrations WHERE user_id = 'test_user_acceptance_2026') as count_workshop_registrations,
  (SELECT count(*) FROM student_fest_registrations WHERE user_id = 'test_user_acceptance_2026') as count_fest_registrations,
  (SELECT count(*) FROM student_scholarship_bookmarks WHERE user_id = 'test_user_acceptance_2026') as count_scholarship_bookmarks,
  (SELECT count(*) FROM student_interview_progress WHERE user_id = 'test_user_acceptance_2026') as count_interview_progress,
  (SELECT count(*) FROM student_100_days_progress WHERE user_id = 'test_user_acceptance_2026') as count_100days_progress,
  (SELECT count(*) FROM coding_conquest_submissions WHERE user_id = 'test_user_acceptance_2026') as count_conquest_submissions,
  (SELECT count(*) FROM student_bookmarks WHERE user_id = 'test_user_acceptance_2026') as count_student_bookmarks;


-- 4. CLEANUP ALL TEST ARTIFACTS
DELETE FROM student_course_enrollments WHERE user_id = 'test_user_acceptance_2026';
DELETE FROM student_lesson_progress WHERE user_id = 'test_user_acceptance_2026';
DELETE FROM workshop_registrations WHERE user_id = 'test_user_acceptance_2026';
DELETE FROM student_fest_registrations WHERE user_id = 'test_user_acceptance_2026';
DELETE FROM student_scholarship_bookmarks WHERE user_id = 'test_user_acceptance_2026';
DELETE FROM student_interview_progress WHERE user_id = 'test_user_acceptance_2026';
DELETE FROM student_100_days_progress WHERE user_id = 'test_user_acceptance_2026';
DELETE FROM coding_conquest_submissions WHERE user_id = 'test_user_acceptance_2026';
DELETE FROM student_bookmarks WHERE user_id = 'test_user_acceptance_2026';

DELETE FROM course_lessons WHERE id = 'test_les_2026';
DELETE FROM course_modules WHERE id = 'test_mod_2026';
DELETE FROM learning_courses WHERE id = 'test_c_2026';
DELETE FROM workshops WHERE id = 'test_ws_2026';
DELETE FROM fest_events WHERE id = 'test_ev_2026';
DELETE FROM college_festivals WHERE id = 'test_fest_2026';
DELETE FROM scholarships WHERE id = 'test_sch_2026';
DELETE FROM coding_conquests WHERE id = 'test_cq_2026';

-- Confirm clean database
SELECT count(*) as residual_test_rows FROM student_bookmarks WHERE user_id = 'test_user_acceptance_2026';
