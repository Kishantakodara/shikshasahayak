// ============================================================
// SHIKSHA SAHAYAK OS: AUTOMATED CLASS & GPS ATTENDANCE INTEGRITY SUITE
// Verifies Class Code Normalization, Duplicate Enrollments,
// GPS Geofence & Accuracy, Expiration, Teacher Ownership
// ============================================================

import { onRequestPost as joinClassHandler } from "../functions/api/student/classes/join";
import { onRequestPost as submitAttendanceHandler } from "../functions/api/student/attendance/submit";
import { onRequestPost as startSessionHandler } from "../functions/api/teacher/attendance/sessions/index";

export interface TestResult {
  scenario: string;
  expected: string | number;
  actual: string | number;
  passed: boolean;
  details: string;
}

class MockD1Database {
  private classes: Map<string, any> = new Map();
  private enrollments: Map<string, any> = new Map();
  private sessions: Map<string, any> = new Map();
  private submissions: Map<string, any> = new Map();
  private records: Map<string, any> = new Map();

  constructor() {
    this.reset();
  }

  reset() {
    this.classes.clear();
    this.enrollments.clear();
    this.sessions.clear();
    this.submissions.clear();
    this.records.clear();

    // Seed test class
    this.classes.set('class_active_1', {
      id: 'class_active_1',
      teacher_id: 'teacher_owner_1',
      name: 'Advanced Algorithms',
      join_code: 'ALGO2026',
      is_active: 1
    });

    this.classes.set('class_archived_1', {
      id: 'class_archived_1',
      teacher_id: 'teacher_owner_1',
      name: 'Legacy Database Systems',
      join_code: 'DBOLD999',
      is_active: 0
    });

    // Seed test session (Class at Ahmedabad: 23.0225° N, 72.5714° E, 150m radius)
    this.sessions.set('session_active_1', {
      id: 'session_active_1',
      class_id: 'class_active_1',
      class_name: 'Advanced Algorithms',
      session_code: '123456',
      challenge_word: 'BINARY',
      duration_minutes: 15,
      geofence_enabled: 1,
      geofence_latitude: 23.0225,
      geofence_longitude: 72.5714,
      geofence_radius_meters: 150,
      starts_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 15 * 60000).toISOString(),
      is_active: 1,
      created_by: 'teacher_owner_1'
    });

    this.sessions.set('session_expired_1', {
      id: 'session_expired_1',
      class_id: 'class_active_1',
      class_name: 'Advanced Algorithms',
      session_code: '999999',
      challenge_word: null,
      duration_minutes: 10,
      geofence_enabled: 0,
      geofence_latitude: null,
      geofence_longitude: null,
      geofence_radius_meters: 150,
      starts_at: new Date(Date.now() - 30 * 60000).toISOString(),
      expires_at: new Date(Date.now() - 15 * 60000).toISOString(), // Expired
      is_active: 1,
      created_by: 'teacher_owner_1'
    });
  }

  seedEnrollment(classId: string, studentId: string) {
    const key = `${classId}:${studentId}`;
    this.enrollments.set(key, {
      id: `enr_${studentId}`,
      class_id: classId,
      student_id: studentId,
      enrollment_number: 'GTU001',
      enrollment_status: 'ACTIVE',
      enrolled_at: new Date().toISOString()
    });
  }

  prepare(query: string) {
    const db = this;
    return {
      bind(...params: any[]) {
        return {
          async first<T = any>(): Promise<T | null> {
            const q = query.toUpperCase();

            // Classes lookup
            if (q.includes('FROM CLASSES') && q.includes('JOIN_CODE')) {
              const code = String(params[0] || '').trim().toUpperCase();
              for (const cls of db.classes.values()) {
                if (cls.join_code.toUpperCase() === code) {
                  return cls as T;
                }
              }
              return null;
            }

            if (q.includes('FROM CLASSES') && q.includes('ID = ?')) {
              const classId = params[0];
              const cls = db.classes.get(classId);
              return (cls || null) as T;
            }

            // Enrollments lookup
            if (q.includes('CLASS_ENROLLMENTS') && q.includes('CLASS_ID = ?') && q.includes('STUDENT_ID = ?')) {
              const key = `${params[0]}:${params[1]}`;
              const enr = db.enrollments.get(key);
              return (enr || null) as T;
            }

            if (q.includes('CLASS_ENROLLMENTS') && q.includes('ENROLLMENT_NUMBER = ?')) {
              const classId = params[0];
              const enrNo = params[1];
              for (const enr of db.enrollments.values()) {
                if (enr.class_id === classId && enr.enrollment_number === enrNo) {
                  return enr as T;
                }
              }
              return null;
            }

            // Attendance Sessions lookup
            if (q.includes('ATTENDANCE_SESSIONS') && q.includes('SESSION_CODE')) {
              const code = String(params[0] || '').trim().toUpperCase();
              for (const ses of db.sessions.values()) {
                if (ses.session_code.toUpperCase() === code && ses.is_active === 1) {
                  const notExpired = new Date(ses.expires_at).getTime() > Date.now();
                  if (notExpired) return ses as T;
                }
              }
              return null;
            }

            if (q.includes('ATTENDANCE_SESSIONS') && q.includes('ID = ?')) {
              return (db.sessions.get(params[0]) || null) as T;
            }

            // Submissions lookup
            if (q.includes('ATTENDANCE_SUBMISSIONS') && q.includes('SESSION_ID = ?') && q.includes('STUDENT_ID = ?')) {
              const key = `${params[0]}:${params[1]}`;
              return (db.submissions.get(key) || null) as T;
            }

            return null;
          },

          async all<T = any>(): Promise<{ results: T[] }> {
            return { results: [] };
          },

          async run(): Promise<{ success: boolean }> {
            const q = query.toUpperCase();

            if (q.includes('INSERT INTO CLASS_ENROLLMENTS')) {
              const key = `${params[1]}:${params[2]}`;
              db.enrollments.set(key, {
                id: params[0],
                class_id: params[1],
                student_id: params[2],
                enrollment_number: params[3],
                enrollment_status: 'ACTIVE'
              });
            }

            if (q.includes('INSERT INTO ATTENDANCE_SUBMISSIONS')) {
              const key = `${params[1]}:${params[2]}`;
              db.submissions.set(key, {
                id: params[0],
                session_id: params[1],
                student_id: params[2],
                student_name: params[3],
                enrollment_number: params[4],
                latitude: params[5],
                longitude: params[6],
                distance_meters: params[7],
                status: 'VERIFIED_PRESENT'
              });
            }

            if (q.includes('INSERT INTO ATTENDANCE_SESSIONS')) {
              db.sessions.set(params[0], {
                id: params[0],
                class_id: params[1],
                class_name: params[2],
                session_code: params[3],
                challenge_word: params[4],
                duration_minutes: params[5],
                geofence_enabled: params[6],
                geofence_latitude: params[7],
                geofence_longitude: params[8],
                geofence_radius_meters: params[9],
                expires_at: params[10],
                is_active: 1,
                created_by: params[11]
              });
            }

            return { success: true };
          }
        };
      }
    };
  }
}

export async function runClassAndAttendanceIntegrityTests(): Promise<TestResult[]> {
  console.log("\n==================================================");
  console.log("   SHIKSHA SAHAYAK 2.0: CLASS & GPS ATTENDANCE INTEGRITY SUITE");
  console.log("==================================================\n");

  const results: TestResult[] = [];
  const db = new MockD1Database();
  const env = { ASSESSMENT_DB: db as any, DB: db as any };

  // Helper to create mock requests
  const makeReq = (url: string, body: any, tokenUser: string = 'student-test-uid', role: string = 'student') => {
    return new Request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer mock-token-${role}-${tokenUser}`
      },
      body: JSON.stringify(body)
    });
  };

  // -------------------------------------------------------------
  // SECTION 1: CLASS JOIN FLOW
  // -------------------------------------------------------------
  console.log("--- Section 1: Class Join Flow ---");

  // 1.1 Valid Code
  db.reset();
  const join1 = await joinClassHandler({
    env,
    request: makeReq('https://shikshasahayak.org/api/student/classes/join', { join_code: 'ALGO2026' }, 'student_1')
  });
  const join1Data = await join1.json() as any;
  results.push({
    scenario: "Valid Class Join Code (ALGO2026)",
    expected: "Status 200 & Enrolled",
    actual: `Status ${join1.status} & ${join1Data.success ? 'Enrolled' : 'Failed'}`,
    passed: join1.status === 200 && join1Data.success === true,
    details: join1Data.message || ""
  });

  // 1.2 Lowercase & Trimmed Code Normalization
  db.reset();
  const join2 = await joinClassHandler({
    env,
    request: makeReq('https://shikshasahayak.org/api/student/classes/join', { join_code: '  algo2026  ' }, 'student_2')
  });
  const join2Data = await join2.json() as any;
  results.push({
    scenario: "Lowercase & Whitespace Code Normalization ('  algo2026  ')",
    expected: "Status 200 & Enrolled",
    actual: `Status ${join2.status} & ${join2Data.success ? 'Enrolled' : 'Failed'}`,
    passed: join2.status === 200 && join2Data.success === true,
    details: "Normalized '  algo2026  ' -> ALGO2026"
  });

  // 1.3 Invalid Class Code
  const join3 = await joinClassHandler({
    env,
    request: makeReq('https://shikshasahayak.org/api/student/classes/join', { join_code: 'NONEXISTENT' }, 'student_3')
  });
  results.push({
    scenario: "Invalid Class Code Rejection ('NONEXISTENT')",
    expected: "Status 404",
    actual: `Status ${join3.status}`,
    passed: join3.status === 404,
    details: "Correctly rejected non-existent class code"
  });

  // 1.4 Inactive / Archived Class Join Rejection
  const join4 = await joinClassHandler({
    env,
    request: makeReq('https://shikshasahayak.org/api/student/classes/join', { join_code: 'DBOLD999' }, 'student_4')
  });
  results.push({
    scenario: "Archived Class Join Rejection ('DBOLD999')",
    expected: "Status 400",
    actual: `Status ${join4.status}`,
    passed: join4.status === 400,
    details: "Correctly blocked new enrollment into archived class"
  });

  // 1.5 Duplicate Enrollment Handling
  db.seedEnrollment('class_active_1', 'student_1');
  const join5 = await joinClassHandler({
    env,
    request: makeReq('https://shikshasahayak.org/api/student/classes/join', { join_code: 'ALGO2026' }, 'student_1')
  });
  const join5Data = await join5.json() as any;
  results.push({
    scenario: "Duplicate Enrollment Handling (Already Enrolled)",
    expected: "Status 200 & alreadyEnrolled: true",
    actual: `Status ${join5.status} & alreadyEnrolled: ${join5Data.alreadyEnrolled}`,
    passed: join5.status === 200 && join5Data.alreadyEnrolled === true,
    details: join5Data.message
  });

  // -------------------------------------------------------------
  // SECTION 2: GPS ATTENDANCE SUBMISSION
  // -------------------------------------------------------------
  console.log("\n--- Section 2: GPS Attendance Submission ---");

  // 2.1 Valid GPS inside 150m radius (Distance ~15m)
  db.reset();
  db.seedEnrollment('class_active_1', 'student_1');
  const att1 = await submitAttendanceHandler({
    env,
    request: makeReq('https://shikshasahayak.org/api/student/attendance/submit', {
      session_code: '123456',
      challenge_word: 'BINARY',
      latitude: 23.0226, // ~15m away
      longitude: 72.5715,
      accuracy: 10
    }, 'student_1')
  });
  const att1Data = await att1.json() as any;
  results.push({
    scenario: "Valid GPS Submission Inside Geofence (15m from class)",
    expected: "Status 200 & VERIFIED_PRESENT",
    actual: `Status ${att1.status} & ${att1Data.submission?.status}`,
    passed: att1.status === 200 && att1Data.submission?.status === 'VERIFIED_PRESENT',
    details: `Computed distance: ${att1Data.submission?.distance_meters}m`
  });

  // 2.2 Outside Geofence Radius (> 150m away)
  db.seedEnrollment('class_active_1', 'student_out_of_range');
  const att2 = await submitAttendanceHandler({
    env,
    request: makeReq('https://shikshasahayak.org/api/student/attendance/submit', {
      session_code: '123456',
      challenge_word: 'BINARY',
      latitude: 23.0300, // ~850m away
      longitude: 72.5714,
      accuracy: 10
    }, 'student_out_of_range')
  });
  results.push({
    scenario: "Out of Geofence Rejection (~850m away)",
    expected: "Status 400",
    actual: `Status ${att2.status}`,
    passed: att2.status === 400,
    details: "Server calculated distance exceeds 150m radius"
  });

  // 2.3 Poor GPS Accuracy (> 250m accuracy error)
  db.seedEnrollment('class_active_1', 'student_poor_gps');
  const att3 = await submitAttendanceHandler({
    env,
    request: makeReq('https://shikshasahayak.org/api/student/attendance/submit', {
      session_code: '123456',
      challenge_word: 'BINARY',
      latitude: 23.0225,
      longitude: 72.5714,
      accuracy: 500 // 500m error radius from cellular tower
    }, 'student_poor_gps')
  });
  results.push({
    scenario: "Imprecise GPS Accuracy Rejection (±500m error)",
    expected: "Status 400",
    actual: `Status ${att3.status}`,
    passed: att3.status === 400,
    details: "Rejected cell-tower level imprecise fix"
  });

  // 2.4 Incorrect Challenge Word
  db.seedEnrollment('class_active_1', 'student_wrong_word');
  const att4 = await submitAttendanceHandler({
    env,
    request: makeReq('https://shikshasahayak.org/api/student/attendance/submit', {
      session_code: '123456',
      challenge_word: 'WRONGWORD',
      latitude: 23.0225,
      longitude: 72.5714,
      accuracy: 10
    }, 'student_wrong_word')
  });
  results.push({
    scenario: "Incorrect Challenge Word Rejection",
    expected: "Status 400",
    actual: `Status ${att4.status}`,
    passed: att4.status === 400,
    details: "Rejected mismatching challenge word"
  });

  // 2.5 Student Not Enrolled in Class
  const att5 = await submitAttendanceHandler({
    env,
    request: makeReq('https://shikshasahayak.org/api/student/attendance/submit', {
      session_code: '123456',
      challenge_word: 'BINARY',
      latitude: 23.0225,
      longitude: 72.5714,
      accuracy: 10
    }, 'unenrolled_student_99')
  });
  results.push({
    scenario: "Unenrolled Student Attendance Rejection",
    expected: "Status 403",
    actual: `Status ${att5.status}`,
    passed: att5.status === 403,
    details: "Student not enrolled in class"
  });

  // 2.6 Expired Attendance Session
  db.seedEnrollment('class_active_1', 'student_expired');
  const att6 = await submitAttendanceHandler({
    env,
    request: makeReq('https://shikshasahayak.org/api/student/attendance/submit', {
      session_code: '999999', // Expired
      latitude: 23.0225,
      longitude: 72.5714,
      accuracy: 10
    }, 'student_expired')
  });
  results.push({
    scenario: "Expired Attendance Session Rejection",
    expected: "Status 404",
    actual: `Status ${att6.status}`,
    passed: att6.status === 404,
    details: "Rejected session past expires_at timestamp"
  });

  // 2.7 Duplicate Attendance Handling
  const att7 = await submitAttendanceHandler({
    env,
    request: makeReq('https://shikshasahayak.org/api/student/attendance/submit', {
      session_code: '123456',
      challenge_word: 'BINARY',
      latitude: 23.0225,
      longitude: 72.5714,
      accuracy: 10
    }, 'student_1') // Already submitted in 2.1
  });
  const att7Data = await att7.json() as any;
  results.push({
    scenario: "Duplicate Attendance Submission (Already Marked)",
    expected: "Status 200 & alreadyMarked: true",
    actual: `Status ${att7.status} & alreadyMarked: ${att7Data.alreadyMarked}`,
    passed: att7.status === 200 && att7Data.alreadyMarked === true,
    details: att7Data.message
  });

  // -------------------------------------------------------------
  // SECTION 3: TEACHER ATTENDANCE SESSION MANAGEMENT
  // -------------------------------------------------------------
  console.log("\n--- Section 3: Teacher Attendance Session Management ---");

  // 3.1 Teacher owns class -> creates session successfully
  const teach1 = await startSessionHandler({
    env,
    request: makeReq('https://shikshasahayak.org/api/teacher/attendance/sessions', {
      class_id: 'class_active_1',
      challenge_word: 'MATRIX',
      duration_minutes: 15,
      geofence_enabled: true,
      geofence_latitude: 23.0225,
      geofence_longitude: 72.5714,
      geofence_radius_meters: 100
    }, 'teacher_owner_1', 'teacher')
  });
  const teach1Data = await teach1.json() as any;
  results.push({
    scenario: "Authorized Teacher Creates Attendance Session",
    expected: "Status 201 & Created",
    actual: `Status ${teach1.status} & ${teach1Data.success ? 'Created' : 'Failed'}`,
    passed: teach1.status === 201 && teach1Data.success === true,
    details: `Session Code: ${teach1Data.session?.session_code}`
  });

  // 3.2 Unauthorized Teacher (does not own class)
  const teach2 = await startSessionHandler({
    env,
    request: makeReq('https://shikshasahayak.org/api/teacher/attendance/sessions', {
      class_id: 'class_active_1',
      duration_minutes: 15
    }, 'intruder_teacher_99', 'teacher')
  });
  results.push({
    scenario: "Unauthorized Teacher Class Session Creation (Forbidden)",
    expected: "Status 403",
    actual: `Status ${teach2.status}`,
    passed: teach2.status === 403,
    details: "Teacher does not own class"
  });

  // 3.3 Invalid Radius Rejection (< 10m or > 2000m)
  const teach3 = await startSessionHandler({
    env,
    request: makeReq('https://shikshasahayak.org/api/teacher/attendance/sessions', {
      class_id: 'class_active_1',
      geofence_radius_meters: -50
    }, 'teacher_owner_1', 'teacher')
  });
  results.push({
    scenario: "Invalid Geofence Radius Rejection (-50m)",
    expected: "Status 400",
    actual: `Status ${teach3.status}`,
    passed: teach3.status === 400,
    details: "Rejected negative/out-of-bounds radius"
  });

  // 3.4 Invalid Duration Rejection (> 180 min)
  const teach4 = await startSessionHandler({
    env,
    request: makeReq('https://shikshasahayak.org/api/teacher/attendance/sessions', {
      class_id: 'class_active_1',
      duration_minutes: 500
    }, 'teacher_owner_1', 'teacher')
  });
  results.push({
    scenario: "Invalid Duration Rejection (500 min)",
    expected: "Status 400",
    actual: `Status ${teach4.status}`,
    passed: teach4.status === 400,
    details: "Rejected duration exceeding 180 minute maximum"
  });

  console.log("\n==================================================");
  console.log("   CLASS & ATTENDANCE INTEGRITY RESULTS");
  console.log("==================================================");
  results.forEach(r => {
    const icon = r.passed ? '✅' : '❌';
    console.log(`${icon} [${r.scenario}] -> ${r.passed ? 'PASS' : 'FAIL'} (${r.details})`);
  });
  console.log("==================================================\n");

  return results;
}

if (process.argv[1] && process.argv[1].includes('verify-attendance-class-integrity')) {
  runClassAndAttendanceIntegrityTests();
}
