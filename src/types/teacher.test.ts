// ============================================================
// Teacher Types Test File — Validation Examples
// ============================================================

import {
  // Enums
  EnrollmentStatus,
  AssignmentStatus,
  SubmissionStatus,
  AttendanceStatus,
  NotificationType,
  NotificationChannel,
  GradingSystem,
  TeacherHierarchy,
  // Schemas
  CreateClassDTOSchema,
  CreateAssignmentDTOSchema,
  EnrollmentDTOSchema,
  GradingDTOSchema,
  AttendanceDTOSchema,
  CreateNotificationDTOSchema,
  // Types
  CreateClassDTO,
  CreateAssignmentDTO,
  Class,
  Assignment,
  ClassEnrollment,
} from './teacher';

// ============================================================
// VALIDATION EXAMPLES
// ============================================================

// Test 1: Valid Class Creation
export function testValidClassCreation() {
  const validClassData: CreateClassDTO = {
    name: 'Advanced Mathematics',
    description: 'Advanced calculus and linear algebra',
    semester: 5,
    academic_year: '2024-25',
    section: 'A',
    grading_system: GradingSystem.PERCENTAGE,
    max_students: 60,
  };

  const result = CreateClassDTOSchema.safeParse(validClassData);
  console.log('Valid Class Creation:', result.success); // Should be true
}

// Test 2: Invalid Class Name (too long)
export function testInvalidClassName() {
  const invalidClassData = {
    name: 'a'.repeat(201), // Exceeds 200 character limit
    semester: 5,
    academic_year: '2024-25',
  };

  const result = CreateClassDTOSchema.safeParse(invalidClassData);
  console.log('Invalid Class Name:', result.success); // Should be false
  if (!result.success) {
    console.log('Errors:', result.error.issues);
  }
}

// Test 3: Valid Assignment Creation
export function testValidAssignmentCreation() {
  const validAssignment: CreateAssignmentDTO = {
    class_id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Midterm Project',
    description: 'Build a React application',
    total_marks: 100,
    due_date: new Date('2024-12-31T23:59:59Z').toISOString(),
    allow_late_submission: true,
    late_penalty_percent: 10,
  };

  const result = CreateAssignmentDTOSchema.safeParse(validAssignment);
  console.log('Valid Assignment Creation:', result.success); // Should be true
}

// Test 4: Invalid Late Penalty (out of range)
export function testInvalidLatePenalty() {
  const invalidAssignment = {
    class_id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Test Assignment',
    total_marks: 100,
    due_date: new Date().toISOString(),
    late_penalty_percent: 150, // Invalid: must be 0-100
  };

  const result = CreateAssignmentDTOSchema.safeParse(invalidAssignment);
  console.log('Invalid Late Penalty:', result.success); // Should be false
}

// Test 5: Valid Attendance Recording
export function testValidAttendanceRecording() {
  const validAttendance = {
    class_id: '123e4567-e89b-12d3-a456-426614174000',
    student_id: '123e4567-e89b-12d3-a456-426614174001',
    date: '2024-12-15',
    status: AttendanceStatus.PRESENT,
    notes: 'Participated actively',
  };

  const result = AttendanceDTOSchema.safeParse(validAttendance);
  console.log('Valid Attendance Recording:', result.success); // Should be true
}

// Test 6: Invalid Date Format
export function testInvalidDateFormat() {
  const invalidAttendance = {
    class_id: '123e4567-e89b-12d3-a456-426614174000',
    student_id: '123e4567-e89b-12d3-a456-426614174001',
    date: '15/12/2024', // Invalid format: should be YYYY-MM-DD
    status: AttendanceStatus.PRESENT,
  };

  const result = AttendanceDTOSchema.safeParse(invalidAttendance);
  console.log('Invalid Date Format:', result.success); // Should be false
}

// Test 7: Valid Grading
export function testValidGrading() {
  const validGrading = {
    submission_id: '123e4567-e89b-12d3-a456-426614174002',
    marks: 85,
    feedback: 'Good work, well structured code.',
  };

  const result = GradingDTOSchema.safeParse(validGrading);
  console.log('Valid Grading:', result.success); // Should be true
}

// Test 8: Academic Year Format Validation
export function testAcademicYearFormat() {
  const testCases = [
    { academic_year: '2024-25', expected: true },
    { academic_year: '2023-24', expected: true },
    { academic_year: '2024', expected: false },
    { academic_year: '24-25', expected: false },
    { academic_year: '2024-2025', expected: false },
  ];

  testCases.forEach(({ academic_year, expected }) => {
    const data = {
      name: 'Test Class',
      academic_year,
    };
    const result = CreateClassDTOSchema.safeParse(data);
    console.log(`Academic Year "${academic_year}": ${result.success === expected ? 'PASS' : 'FAIL'}`);
  });
}

// Test 9: Semester Range Validation
export function testSemesterRange() {
  const testCases = [
    { semester: 1, expected: true },
    { semester: 6, expected: true },
    { semester: 12, expected: true },
    { semester: 0, expected: false },
    { semester: 13, expected: false },
    { semester: -1, expected: false },
  ];

  testCases.forEach(({ semester, expected }) => {
    const data = {
      name: 'Test Class',
      semester,
    };
    const result = CreateClassDTOSchema.safeParse(data);
    console.log(`Semester ${semester}: ${result.success === expected ? 'PASS' : 'FAIL'}`);
  });
}

// Test 10: Notification Validation
export function testNotificationValidation() {
  const validNotification = {
    user_id: '123e4567-e89b-12d3-a456-426614174000',
    type: NotificationType.ASSIGNMENT_CREATED,
    channel: NotificationChannel.IN_APP,
    title: 'New Assignment Posted',
    message: 'Your teacher has posted a new assignment: Midterm Project',
    link: 'https://example.com/assignments/123',
  };

  const result = CreateNotificationDTOSchema.safeParse(validNotification);
  console.log('Valid Notification:', result.success); // Should be true
}

// Test 11: Bulk Notification (Multiple Users)
export function testBulkNotification() {
  const bulkNotification = {
    user_ids: [
      '123e4567-e89b-12d3-a456-426614174000',
      '123e4567-e89b-12d3-a456-426614174001',
      '123e4567-e89b-12d3-a456-426614174002',
    ],
    type: NotificationType.GRADES_RELEASED,
    title: 'Grades Released',
    message: 'Grades for Assignment 1 have been released',
  };

  const result = CreateNotificationDTOSchema.safeParse(bulkNotification);
  console.log('Bulk Notification:', result.success); // Should be true
}

// Run all tests (for development/debugging purposes)
if (import.meta.env.DEV) {
  console.log('=== Running Teacher Types Validation Tests ===\n');
  testValidClassCreation();
  testInvalidClassName();
  testValidAssignmentCreation();
  testInvalidLatePenalty();
  testValidAttendanceRecording();
  testInvalidDateFormat();
  testValidGrading();
  testAcademicYearFormat();
  testSemesterRange();
  testNotificationValidation();
  testBulkNotification();
  console.log('\n=== Tests Complete ===');
}
