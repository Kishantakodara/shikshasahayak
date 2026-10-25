# Requirements Document: Teacher Dashboard Integration

## Introduction

The Teacher Dashboard Integration extends the existing ShikshaSahayak Student Assessment Platform to provide teachers with comprehensive classroom management, assessment creation, grading, attendance tracking, and communication capabilities. This system integrates with the existing student portal to create a unified educational platform supporting teachers, course coordinators, HODs, and administrators with role-based access and real-time synchronization.

## Glossary

- **System**: The Teacher Dashboard Integration feature
- **Platform**: The entire ShikshaSahayak (student + teacher interfaces)
- **Teacher**: A user with TEACHER role (includes regular teachers, course coordinators, HODs)
- **Student**: A user with STUDENT role
- **Class**: A course offering with enrolled students, managed by a teacher
- **Enrollment**: The association between a student and a class
- **Assignment**: A teacher-created task for students with submission and grading
- **Quiz**: An assessment with questions and automatic grading
- **Material**: Study resources uploaded by teachers
- **Attendance_Record**: A daily record of student presence in class
- **Notification**: A message sent to users via in-app, email, or SMS
- **SSE**: Server-Sent Events for real-time updates
- **Join_Code**: A unique code allowing students to enroll in a class
- **Placeholder_Account**: An auto-created user account for bulk enrollment
- **Grading_Engine**: The component that calculates scores
- **Hierarchy**: Teacher permission level (HOD, COURSE_COORDINATOR, TEACHER)
- **Dashboard**: The main teacher interface displaying overview and analytics
- **At_Risk_Student**: A student with low performance or attendance
- **Rubric**: A scoring guide for grading assignments
- **Grade_Override**: Modification of a grade by authorized personnel
- **HOD**: Head of Department with highest teacher permissions
- **Course_Coordinator**: Teacher with elevated permissions for specific courses
- **D1**: Cloudflare D1 database service
- **R2**: Cloudflare R2 object storage service
- **Workers**: Cloudflare Workers serverless compute platform

## Requirements

### Requirement 1: Authentication and Authorization

**User Story:** As a teacher, I want secure access to the teacher dashboard, so that I can manage my classes and students.

#### Acceptance Criteria

1. WHEN a user with role TEACHER logs in, THE System SHALL redirect them to /teacher/dashboard
2. WHEN a user without role TEACHER attempts to access /teacher/* routes, THE System SHALL redirect them to their appropriate dashboard
3. THE System SHALL verify JWT tokens on all teacher API requests
4. WHERE a teacher has hierarchy level HOD, THE System SHALL grant access to department-wide data
5. WHERE a teacher has hierarchy level COURSE_COORDINATOR, THE System SHALL grant access to coordinated course data
6. WHEN a JWT access token expires, THE System SHALL allow refresh using a valid refresh token
7. THE System SHALL enforce token rotation on each refresh operation

### Requirement 2: Class Management

**User Story:** As a teacher, I want to create and manage classes, so that I can organize my courses and enroll students.

#### Acceptance Criteria

1. WHEN a teacher creates a class, THE System SHALL generate a unique join_code
2. THE System SHALL validate that class name is non-empty and max 200 characters
3. THE System SHALL validate that academic_year follows format "YYYY-YY"
4. WHERE semester is provided, THE System SHALL validate it is between 1 and 12
5. WHEN a teacher updates a class, THE System SHALL record the update timestamp
6. WHEN a teacher deletes a class, THE System SHALL set is_active to false
7. THE System SHALL prevent deletion of classes with active enrollments
8. WHERE max_students is set, THE System SHALL prevent enrollments exceeding this limit

### Requirement 3: Student Enrollment

**User Story:** As a teacher, I want to enroll students in my classes using multiple methods, so that I can efficiently build class rosters.

#### Acceptance Criteria

1. WHEN a student enters a valid join_code, THE System SHALL create an enrollment with status PENDING
2. WHEN a teacher accepts a pending enrollment, THE System SHALL change status to ACTIVE
3. WHEN a teacher performs bulk enrollment with enrollment_numbers, THE System SHALL validate each enrollment_number format
4. WHERE an enrollment_number does not match an existing user, THE System SHALL create a placeholder account with is_placeholder true
5. WHEN a placeholder account is created, THE System SHALL send an invitation email
6. WHEN a user accepts an invitation, THE System SHALL link the enrollment to their actual account and set is_placeholder to false
7. THE System SHALL enforce unique constraint on (class_id, student_id)
8. THE System SHALL enforce unique constraint on (class_id, enrollment_number)
9. WHEN a teacher removes a student from a class, THE System SHALL set enrollment_status to WITHDRAWN

### Requirement 4: Assignment Creation

**User Story:** As a teacher, I want to create assignments with detailed instructions and settings, so that students can complete and submit their work.

#### Acceptance Criteria

1. THE System SHALL validate that assignment title is non-empty and max 300 characters
2. THE System SHALL validate that total_marks is a positive number
3. THE System SHALL validate that due_date is in ISO 8601 format
4. WHERE late_penalty_percent is provided, THE System SHALL validate it is between 0 and 100
5. WHERE allowed_file_types is provided, THE System SHALL validate it is a valid JSON array of MIME types
6. WHERE rubric is provided, THE System SHALL validate it is a valid JSON object
7. WHEN a teacher creates an assignment, THE System SHALL set status to DRAFT
8. WHEN a teacher publishes an assignment, THE System SHALL set status to PUBLISHED and record published_at timestamp
9. WHERE allow_late_submission is false, THE System SHALL reject submissions after due_date

### Requirement 5: Assignment Submission

**User Story:** As a student, I want to submit assignments with files and text, so that I can complete my coursework.

#### Acceptance Criteria

1. WHEN a student submits an assignment, THE System SHALL validate submission against allowed_file_types
2. WHERE max_file_size_mb is set, THE System SHALL reject files exceeding this limit
3. WHEN submitted_at is after due_date, THE System SHALL set is_late to true
4. WHERE is_late is true and late_penalty_percent is set, THE System SHALL apply the penalty to final marks
5. THE System SHALL enforce unique constraint on (assignment_id, student_id, resubmit_count)
6. WHEN a student resubmits, THE System SHALL increment resubmit_count
7. THE System SHALL change submission status from PENDING to SUBMITTED upon submission
8. WHERE assignment status is CLOSED, THE System SHALL reject new submissions

### Requirement 6: Grading

**User Story:** As a teacher, I want to grade assignments efficiently with both automatic and manual grading, so that I can provide timely feedback to students.

#### Acceptance Criteria

1. WHEN a quiz with MCQ questions is submitted, THE Grading_Engine SHALL automatically calculate marks
2. WHERE an assignment requires manual grading, THE System SHALL add it to the teacher's grading queue
3. WHEN a teacher assigns marks to a submission, THE System SHALL validate marks <= assignment total_marks
4. WHEN a teacher provides feedback, THE System SHALL store it with the submission
5. WHERE a rubric is defined, THE Grading_Engine SHALL calculate marks based on rubric scores
6. WHEN grading is complete, THE System SHALL set submission status to GRADED
7. WHEN a teacher releases grades for an assignment, THE System SHALL set assignment status to GRADED
8. WHERE a teacher has HOD hierarchy, THE System SHALL allow grade overrides with audit trail
9. WHEN a grade is overridden, THE System SHALL log old value, new value, reason, and modifier

### Requirement 7: Attendance Management

**User Story:** As a teacher, I want to record and track student attendance, so that I can monitor class participation and identify at-risk students.

#### Acceptance Criteria

1. THE System SHALL enforce unique constraint on (class_id, student_id, date)
2. THE System SHALL validate that date is in YYYY-MM-DD format
3. WHEN a teacher records attendance, THE System SHALL store recorded_by and recorded_at
4. THE System SHALL calculate attendance percentage as (present_count / total_sessions) * 100
5. WHERE attendance percentage is below a threshold, THE System SHALL flag student as at_risk
6. WHEN generating an attendance report, THE System SHALL include date range, student names, and status counts
7. THE System SHALL support exporting attendance data in CSV format

### Requirement 8: Study Materials

**User Story:** As a teacher, I want to upload and share study materials with my classes, so that students have access to course resources.

#### Acceptance Criteria

1. THE System SHALL validate that material title is non-empty and max 300 characters
2. WHEN a teacher uploads a file, THE System SHALL store it in R2 with path materials/{material_id}/v1/{filename}
3. THE System SHALL store file metadata including file_type, file_size_bytes, and file_name
4. WHERE is_visible is false, THE System SHALL prevent student access
5. WHEN a teacher assigns a material to a class, THE System SHALL create a class_materials association
6. WHEN a student views a material, THE System SHALL record viewed_at and increment download_count
7. THE System SHALL generate pre-signed R2 URLs with 1-hour expiry for authorized access
8. THE System SHALL validate file_type against allowed MIME types

### Requirement 9: Real-Time Notifications

**User Story:** As a student or teacher, I want to receive real-time notifications about important events, so that I stay informed about class activities.

#### Acceptance Criteria

1. WHEN a teacher creates an assignment, THE System SHALL send notifications to all enrolled students
2. WHEN a teacher releases grades, THE System SHALL send notifications to all students with graded submissions
3. THE System SHALL support notification channels IN_APP, EMAIL, and SMS
4. WHEN a notification is created, THE System SHALL set is_read to false
5. WHEN a user marks a notification as read, THE System SHALL set is_read to true and record read_at
6. THE System SHALL maintain an SSE connection for real-time in-app notifications
7. WHEN an SSE connection is lost, THE System SHALL attempt reconnection with exponential backoff
8. WHERE a user is offline, THE System SHALL buffer notifications for delivery on reconnection
9. THE System SHALL validate that notification title is non-empty and max 200 characters
10. THE System SHALL validate that notification message is non-empty and max 1000 characters

### Requirement 10: Analytics and Reporting

**User Story:** As a teacher, I want comprehensive analytics about class and student performance, so that I can make informed teaching decisions.

#### Acceptance Criteria

1. WHEN a teacher views the dashboard, THE System SHALL display active class count, total student count, and pending grading count
2. WHEN a teacher views class analytics, THE System SHALL calculate average marks, median marks, and standard deviation
3. THE System SHALL identify at-risk students based on attendance and performance thresholds
4. WHERE attendance percentage is below 75%, THE System SHALL flag student as at_risk
5. WHERE average assignment marks are below 50%, THE System SHALL flag student as at_risk
6. WHEN generating quiz analytics, THE System SHALL include question-wise accuracy and time distribution
7. THE System SHALL support exporting analytics in PDF and CSV formats
8. WHERE AI insights are enabled, THE System SHALL call Gemini API to generate performance insights

### Requirement 11: Multi-Channel Communication

**User Story:** As a teacher, I want to communicate with students through multiple channels, so that I can ensure important messages are received.

#### Acceptance Criteria

1. WHEN sending a bulk notification, THE System SHALL queue notifications for all recipients
2. WHERE channel is EMAIL, THE System SHALL validate email addresses before sending
3. WHERE channel is SMS, THE System SHALL enforce rate limit of 100 SMS per hour
4. WHEN an email fails to send, THE System SHALL retry up to 3 times with exponential backoff
5. THE System SHALL sanitize notification content to prevent injection attacks
6. WHERE a user has opted out, THE System SHALL not send non-critical notifications
7. THE System SHALL not include sensitive data in email subject lines

### Requirement 12: Teacher Hierarchy and Permissions

**User Story:** As an administrator, I want to assign different permission levels to teachers, so that I can delegate responsibilities appropriately.

#### Acceptance Criteria

1. THE System SHALL support hierarchy levels HOD, COURSE_COORDINATOR, and TEACHER
2. WHERE a teacher has HOD hierarchy, THE System SHALL grant access to all department classes
3. WHERE a teacher has COURSE_COORDINATOR hierarchy, THE System SHALL grant access to coordinated courses
4. THE System SHALL enforce that only one primary department exists per teacher
5. WHERE a teacher attempts to override grades without HOD hierarchy, THE System SHALL return HTTP 403 Forbidden
6. WHERE a teacher attempts to access another department's data without HOD hierarchy, THE System SHALL return HTTP 403 Forbidden

### Requirement 13: Data Validation and Integrity

**User Story:** As a system administrator, I want all data properly validated and constrained, so that data integrity is maintained.

#### Acceptance Criteria

1. THE System SHALL validate all user inputs on the server side before database operations
2. THE System SHALL use parameterized queries to prevent SQL injection
3. THE System SHALL sanitize and encode outputs to prevent XSS attacks
4. THE System SHALL enforce foreign key constraints on all relationships
5. THE System SHALL enforce unique constraints on business keys (join_code, enrollment combinations)
6. WHEN a database transaction fails, THE System SHALL rollback all changes
7. THE System SHALL validate JSON fields are well-formed before storage

### Requirement 14: Performance and Scalability

**User Story:** As a user, I want the system to respond quickly even with many classes and students, so that my workflow is not interrupted.

#### Acceptance Criteria

1. THE System SHALL respond to read API requests within 200ms under normal load
2. THE System SHALL respond to write API requests within 500ms under normal load
3. THE System SHALL deliver SSE notifications within 1 second of event creation
4. THE System SHALL load the teacher dashboard within 2 seconds
5. WHERE a result set exceeds 50 items, THE System SHALL implement pagination
6. THE System SHALL use indexed queries on class_id, student_id, and teacher_id columns
7. THE System SHALL cache dashboard statistics with 15-minute TTL
8. THE System SHALL invalidate cache when relevant data is mutated

### Requirement 15: Security and Audit

**User Story:** As a system administrator, I want comprehensive security and audit trails, so that I can ensure data protection and accountability.

#### Acceptance Criteria

1. THE System SHALL enforce HTTPS-only communication
2. THE System SHALL encrypt student personal information at rest
3. THE System SHALL redact sensitive fields from API logs
4. WHEN a grade is modified, THE System SHALL log timestamp, old value, new value, and modifier
5. WHEN an enrollment is added or removed, THE System SHALL create an audit record
6. THE System SHALL retain audit records for 2 years
7. WHERE a file is uploaded, THE System SHALL validate file type based on content, not extension
8. THE System SHALL enforce rate limiting on authentication endpoints
9. THE System SHALL generate pre-signed R2 URLs with 1-hour expiry for file access

### Requirement 16: Error Handling and Recovery

**User Story:** As a user, I want clear error messages and graceful failure handling, so that I understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN a student attempts to join with an invalid join_code, THE System SHALL return HTTP 404 with message "Invalid join code"
2. WHEN a duplicate enrollment is attempted, THE System SHALL return HTTP 409 with message "Student already enrolled in this class"
3. WHEN bulk enrollment partially fails, THE System SHALL return HTTP 207 with lists of successful and failed enrollments
4. WHEN a file exceeds max_file_size_mb, THE System SHALL return HTTP 413 with message "File size exceeds {limit}MB"
5. WHEN concurrent grade modifications occur, THE System SHALL use optimistic locking and return HTTP 409 for conflicts
6. WHEN an SSE connection is lost, THE System SHALL automatically reconnect with exponential backoff
7. WHEN a submission is attempted after due_date with late submissions disabled, THE System SHALL return HTTP 403 with message "Assignment past due date. Late submissions not allowed"

### Requirement 17: Quiz Integration

**User Story:** As a teacher, I want to assign existing quizzes to my classes, so that students can take assessments within the class context.

#### Acceptance Criteria

1. WHEN a teacher assigns a quiz to a class, THE System SHALL create a quiz_class_assignment record
2. THE System SHALL enforce unique constraint on (quiz_id, class_id)
3. WHERE is_visible is false, THE System SHALL hide the quiz from students
4. WHEN a student views a class, THE System SHALL display all visible assigned quizzes
5. WHEN a student completes an assigned quiz, THE Grading_Engine SHALL automatically calculate marks
6. THE System SHALL include quiz attempts in class analytics and student performance reports

### Requirement 18: Material Statistics and Engagement

**User Story:** As a teacher, I want to track student engagement with study materials, so that I can understand which resources are most useful.

#### Acceptance Criteria

1. WHEN a student views a material, THE System SHALL record viewed_at timestamp
2. THE System SHALL enforce unique constraint on (material_id, student_id) for material_stats
3. WHEN a student downloads a material, THE System SHALL increment download_count
4. WHEN a teacher views material stats, THE System SHALL display total views, unique viewers, and download count
5. THE System SHALL calculate engagement percentage as (students_viewed / total_enrolled) * 100
6. WHERE engagement percentage is below 30%, THE System SHALL flag material as low_engagement

### Requirement 19: Assignment Rubric Support

**User Story:** As a teacher, I want to define and apply grading rubrics to assignments, so that grading is consistent and transparent.

#### Acceptance Criteria

1. WHERE a rubric is defined, THE System SHALL validate it is a valid JSON object with criteria and point values
2. WHEN applying a rubric, THE Grading_Engine SHALL calculate total marks as sum of criterion scores
3. THE System SHALL validate that rubric total equals assignment total_marks
4. WHEN a teacher grades using a rubric, THE System SHALL store individual criterion scores
5. THE System SHALL display rubric criteria and scores to students with graded submissions

### Requirement 20: Dashboard Overview and Navigation

**User Story:** As a teacher, I want an intuitive dashboard with key metrics and quick navigation, so that I can efficiently manage my classes.

#### Acceptance Criteria

1. WHEN a teacher views the dashboard, THE System SHALL display total active classes
2. THE System SHALL display total enrolled students across all classes
3. THE System SHALL display count of assignments pending grading
4. THE System SHALL display count of unread notifications
5. THE System SHALL display recent activity feed with latest 10 events
6. THE System SHALL provide quick navigation to classes, assignments, attendance, and materials
7. WHERE a teacher has pending tasks, THE System SHALL display task count badges

