# Implementation Plan: Teacher Dashboard Integration

## Overview

This implementation plan breaks down the Teacher Dashboard Integration feature into discrete, actionable coding tasks. The plan follows an incremental approach, building foundation components first, then layering on advanced features. Each task is designed to be implementable by a code-generation LLM and includes specific requirements references for traceability.

**Current Implementation Status**: Foundation and core class management features are complete. The system now needs completion of advanced features like grading, attendance, notifications, and analytics.

The implementation is organized into 11 phases:
1. ✅ **Foundation & Database Schema** - Complete
2. ✅ **Class Management** - Complete (analytics pending)
3. 🚧 **Student Management** - Partially complete (profile UI pending)
4. 🚧 **Quiz & Assignment Creation** - In progress
5. ⏳ **Grading System** - Started (engine exists, UI needed)
6. ⏳ **Attendance Tracking** - Not started
7. ⏳ **Real-Time Notifications & SSE** - Not started
8. ⏳ **Dashboard Analytics** - Not started
9. ⏳ **Communication Center** - Not started
10. ⏳ **Study Material Management** - Not started
11. ⏳ **Testing & Polish** - Not started

## Tasks

### Phase 1: Foundation & Database Schema ✅ COMPLETE

- [x] 1. ✅ **COMPLETED**: Extend D1 database schema with teacher dashboard tables
  - ✅ Created migration file `migrations-assessment/0004_teacher_dashboard_schema.sql`
  - ✅ Added 12 tables: `classes`, `class_enrollments`, `assignments`, `assignment_submissions`, etc.
  - ✅ Added indexes, constraints, and validation rules
  - ✅ Migration tested and deployed
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.7, 4.1, 4.2, 4.4, 5.1, 5.2, 7.1, 7.2, 8.1, 9.9, 9.10, 13.2, 13.4, 13.7_

- [x] 2. ✅ **COMPLETED**: Create TypeScript types and interfaces for teacher domain models
  - ✅ Created comprehensive `src/types/teacher.ts`
  - ✅ All interfaces, DTOs, and enums implemented
  - ✅ Validation schemas using Zod
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 4.1, 4.2, 5.3, 7.1, 8.1, 9.1_

### Phase 2: Class Management ✅ MOSTLY COMPLETE

- [x] 3. ✅ **COMPLETED**: Implement TeacherRoute guard component
  - ✅ Created `src/components/teacher/TeacherRoute.tsx` with full authentication flow
  - ✅ Role validation, redirects, and hierarchy checking (placeholder for future enhancement)
  - _Requirements: 1.1, 1.2, 11.1, 11.2_

- [x] 4. ✅ **COMPLETED**: Create Class Management API endpoints
  - ✅ Full CRUD API in `functions/api/teacher/classes/index.ts`
  - ✅ Join code generation, pagination, authorization
  - ✅ Comprehensive error handling and validation
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 11.1, 11.2, 13.1, 13.2_

- [x] 5. ✅ **COMPLETED**: Build Class Management UI components
  - ✅ Complete UI suite: ClassList, ClassDetails, ClassCard, CreateClassModal, JoinCodeDisplay
  - ✅ Mobile-responsive design with TanStack Query integration
  - ✅ Loading states and error handling
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [ ] 6. **PENDING**: Implement class analytics calculations
  - Create `src/lib/teacher/classAnalytics.ts` with functions:
    - `calculateClassAverageMarks(classId: string): Promise<number>` - Average across all assignments
    - `calculateSubmissionRate(classId: string): Promise<number>` - Percentage of students submitting on time
    - `calculateAttendanceRate(classId: string): Promise<number>` - Average attendance percentage
    - `getTopPerformers(classId: string, limit: number): Promise<Student[]>` - Top N students by marks
    - `getAssignmentDistribution(classId: string): Promise<GradeDistribution>` - Grade ranges histogram
  - Use D1 aggregate queries (SUM, AVG, COUNT, GROUP BY)
  - Cache results with 15-minute TTL
  - _Requirements: 10.1, 10.2, 10.3_

### Phase 3: Student Management 🚧 PARTIALLY COMPLETE

- [x] 7. ✅ **COMPLETED**: Create Student Enrollment API endpoints
  - ✅ Full enrollment API with bulk operations and placeholder account creation
  - ✅ Multi-Status responses for partial failures
  - ⏳ **TODO**: Complete student self-join endpoint and invitation email system
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

- [x] 8. ✅ **COMPLETED**: Build bulk enrollment UI with CSV upload
  - ✅ Complete BulkEnrollModal with CSV parsing and validation
  - ✅ Error handling and template download
  - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6_

- [ ] 9. **PRIORITY**: Complete Student List and Profile UI
  - ✅ `src/components/teacher/StudentList.tsx` exists but needs enhancement
  - ⏳ Add search and filter controls (by status, performance, attendance)
  - ⏳ Add sorting by name, enrollment number, performance
  - ⏳ Complete `src/components/teacher/StudentProfileModal.tsx` - Show student details, submission history, attendance records, performance charts
  - ⏳ Add action buttons: Remove from class, Send message, View submissions
  - ⏳ Ensure mobile-responsive table (horizontal scroll or card view on small screens)
  - _Requirements: 3.8, 3.9, 10.6_

### Phase 4: Quiz & Assignment Creation

- [ ] 10. Extend Quiz API to support class assignments
  - Modify `functions/api/teacher/quizzes/index.ts`:
    - Add `assigned_class_ids` field to quiz creation payload
    - Create `quiz_class_assignments` records on quiz publish
    - Add `is_visible` toggle for each class assignment
  - Create `functions/api/teacher/classes/[id]/quizzes.ts`:
    - `GET /api/teacher/classes/:id/quizzes` - List quizzes assigned to class
    - `POST /api/teacher/classes/:id/quizzes/:quizId/assign` - Assign existing quiz
    - `DELETE /api/teacher/classes/:id/quizzes/:quizId` - Unassign quiz
    - `PUT /api/teacher/classes/:id/quizzes/:quizId/visibility` - Toggle visibility
  - _Requirements: 17.1, 17.2, 17.3_

- [ ] 11. Create Assignment authoring API endpoints
  - Create `functions/api/teacher/assignments/index.ts`:
    - `POST /api/teacher/assignments` - Create assignment (status = DRAFT)
    - `GET /api/teacher/assignments/:id` - Get assignment details
    - `PUT /api/teacher/assignments/:id` - Update assignment
    - `DELETE /api/teacher/assignments/:id` - Delete assignment (only if no submissions)
    - `POST /api/teacher/assignments/:id/publish` - Publish assignment (status = PUBLISHED, set published_at, send notifications)
    - `POST /api/teacher/assignments/:id/close` - Close assignment (status = CLOSED, no more submissions)
  - Validate rubric JSON structure if provided
  - Validate allowed_file_types as JSON array of MIME types
  - Enforce total_marks > 0, late_penalty_percent between 0-100
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 16.1_

- [ ] 12. Build Assignment creation UI
  - Create `src/pages/teacher/CreateAssignment.tsx` with form sections:
    - Basic Info: title, description, instructions, total_marks, due_date
    - Submission Settings: allow_late_submission, late_penalty_percent, max_file_size_mb, allowed_file_types (multi-select)
    - Rubric Builder: Add criteria with descriptions and point allocations
    - Attachments: Upload reference materials (PDFs, images, links)
    - Questions: Add subjective questions with expected answer guidelines
  - Show rubric point total and validate equals total_marks
  - Add "Save Draft" and "Publish" buttons
  - Show preview of student view before publishing
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 19.1, 19.2, 19.3_

- [ ] 13. Create assignment listing and management UI
  - Create `src/pages/teacher/AssignmentList.tsx` - Table with columns: title, class, due date, status, submission count, average marks, actions
  - Add filters: By class, by status (draft/published/closed/graded), by date range
  - Create `src/components/teacher/AssignmentCard.tsx` - Summary card with quick stats
  - Add action buttons: Edit (draft only), Publish, Close, View Submissions, Analytics
  - Show warning before deleting assignments with submissions
  - _Requirements: 4.7, 4.8, 16.1_

### Phase 5: Grading System

- [ ] 14. Implement Grading Engine for auto-grading
  - Create `src/lib/teacher/gradingEngine.ts` with functions:
    - `autoGradeQuiz(attemptId: string): Promise<GradingResult>` - Grade MCQ questions by comparing answers
    - `autoGradeAssignment(submissionId: string): Promise<GradingResult>` - Grade objective questions if any
    - `calculateLatePenalty(submittedAt: Date, dueDate: Date, penaltyPercent: number): number` - Apply late penalty
    - `validateMarksWithinBounds(marks: number, totalMarks: number): boolean` - Ensure marks <= total_marks
  - Support negative marking for quizzes if configured
  - Handle edge cases: missing answers, partial submissions
  - Log grading actions for audit trail
  - _Requirements: 6.1, 6.2, 6.3, 5.4, 13.5_

- [ ] 15. Create Grading API endpoints
  - Create `functions/api/teacher/submissions/index.ts`:
    - `GET /api/teacher/assignments/:id/submissions` - List all submissions for assignment
    - `GET /api/teacher/submissions/:id` - Get submission details with student info
    - `POST /api/teacher/submissions/:id/grade` - Manual grade submission (set marks, feedback, status = GRADED)
    - `POST /api/teacher/submissions/:id/override` - Override existing grade with reason
    - `POST /api/teacher/submissions/:id/return` - Return graded submission to student (status = RETURNED, send notification)
    - `POST /api/teacher/assignments/:id/release-grades` - Batch release all graded submissions
  - Validate marks <= assignment total_marks
  - Log grade changes with old value, new value, grader, timestamp
  - Send notifications on grade release
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 13.5_

- [ ] 16. Build Grading UI workflow
  - Create `src/pages/teacher/GradingQueue.tsx` - List pending submissions grouped by assignment
  - Create `src/pages/teacher/GradeSubmission.tsx` - Full-screen grading interface with:
    - Student submission view (text, attachments, external links)
    - Rubric scoring interface (sliders or inputs for each criterion)
    - Rich text editor for feedback
    - File annotation tools (highlight, comment on PDFs)
    - Marks input with validation (max = total_marks)
    - Submit and Next buttons for batch grading
  - Show auto-graded marks if applicable (MCQ portion)
  - Add "Return to Student" and "Save Draft" options
  - Implement keyboard shortcuts for efficient grading
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 19.4_

- [ ] 17. Create grade analytics and distribution charts
  - Create `src/components/teacher/GradeDistribution.tsx` - Histogram showing grade ranges
  - Use Recharts `BarChart` component for visualization
  - Calculate bins: 0-25%, 26-50%, 51-75%, 76-100%
  - Show average, median, highest, lowest marks
  - Highlight outliers (significantly above/below average)
  - Add export to CSV functionality
  - _Requirements: 10.1, 10.2, 10.3_

### Phase 6: Attendance Tracking

- [ ] 18. Create Attendance API endpoints
  - Create `functions/api/teacher/attendance/index.ts`:
    - `POST /api/teacher/classes/:id/attendance` - Record attendance for a session (bulk operation)
    - `PUT /api/teacher/attendance/:id` - Update individual attendance record
    - `GET /api/teacher/classes/:id/attendance` - Get attendance records by date range
    - `GET /api/teacher/classes/:id/attendance/stats` - Get class attendance statistics
    - `GET /api/teacher/students/:id/attendance` - Get student attendance across classes
    - `POST /api/teacher/classes/:id/attendance/export` - Export attendance CSV
  - Enforce unique constraint on (class_id, student_id, date)
  - Validate date format YYYY-MM-DD
  - Calculate attendance percentage: (present + excused) / total_sessions × 100
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ] 19. Build Attendance Recording UI
  - Create `src/pages/teacher/AttendanceSheet.tsx` - Grid view with student rows and date columns
  - Add quick mark options: Mark All Present, Mark All Absent
  - Add status toggle buttons for each student: Present, Absent, Late, Excused
  - Show attendance percentage next to each student name
  - Add date picker to select attendance session date
  - Add notes field for individual students
  - Auto-save changes with debounce (2 seconds)
  - _Requirements: 7.1, 7.2, 7.3, 7.5, 7.6_

- [ ] 20. Create Attendance reports and at-risk identification
  - Create `src/pages/teacher/AttendanceReport.tsx` - Table with columns: student name, total sessions, present, absent, percentage, status
  - Add date range filter
  - Highlight students below 75% attendance threshold in red
  - Create `src/lib/teacher/atRiskIdentification.ts`:
    - `identifyAtRiskStudents(classId: string): Promise<AtRiskStudent[]>` - Find students with attendance < 75% OR average marks < 50%
  - Show "At Risk" badge on student profiles
  - Add "Send Reminder" button to notify low-attendance students
  - _Requirements: 7.4, 10.4, 10.5, 10.6_

### Phase 7: Real-Time Notifications & SSE

- [ ] 21. Implement Server-Sent Events (SSE) infrastructure
  - Create `functions/api/notifications/stream.ts`:
    - `GET /api/notifications/stream` - Establish SSE connection for authenticated user
    - Send heartbeat messages every 30 seconds to keep connection alive
    - Use Durable Objects to manage active connections if needed
  - Create notification queue system:
    - Store pending notifications in D1 `notifications` table
    - Poll for new notifications every 5 seconds
    - Broadcast to relevant SSE streams
  - Handle connection cleanup on client disconnect
  - Implement exponential backoff reconnection on client side
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 14.1, 14.2_

- [ ] 22. Create Notification Service and UI components
  - Create `src/lib/notifications/notificationService.ts`:
    - `sendNotification(notification: NotificationDTO): Promise<void>` - Queue notification
    - `sendBulkNotifications(notifications: NotificationDTO[]): Promise<void>` - Batch queue
    - `subscribeToStream(userId: string): EventSource` - Create SSE connection
    - `markAsRead(notificationId: string): Promise<void>` - Update read status
  - Create `src/components/shared/NotificationBell.tsx` - Bell icon with unread count badge
  - Create `src/components/shared/NotificationDropdown.tsx` - Dropdown list of recent notifications
  - Create `src/pages/shared/NotificationsPage.tsx` - Full notification history with filters
  - Show real-time toast notifications for high-priority alerts
  - Add notification preferences UI (in-app, email, SMS toggles)
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 14.1, 14.2_

### Phase 8: Dashboard Analytics

- [ ] 23. Create Teacher Dashboard Overview page
  - Create `src/pages/teacher/Dashboard.tsx` with sections:
    - **Overview Cards**: Total classes, total students, pending submissions, average class performance
    - **Recent Activity**: Latest submissions, new enrollments, upcoming due dates
    - **Quick Actions**: Create assignment, record attendance, create class, view grading queue
    - **Performance Charts**: Class-wise average marks (bar chart), submission rate trends (line chart)
    - **At-Risk Students**: List of students below thresholds with action buttons
  - Use Recharts for data visualization
  - Implement lazy loading for chart data
  - Cache dashboard stats with 5-minute TTL
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [ ] 24. Integrate AI-powered analytics with Gemini API
  - Create `src/lib/teacher/aiAnalytics.ts`:
    - `generateClassInsights(classId: string): Promise<AIInsight[]>` - Analyze class performance trends
    - `identifyStrugglingSt udents(classId: string): Promise<StudentAnalysis[]>` - Find students needing intervention
    - `suggestInterventions(studentId: string, classId: string): Promise<Intervention[]>` - Recommend actions
    - `analyzeAssignmentDifficulty(assignmentId: string): Promise<DifficultyAnalysis>` - Assess if assignment was too easy/hard
  - Call Gemini API with structured prompts containing:
    - Student performance data (marks, submission rates)
    - Attendance patterns
    - Assignment difficulty indicators (average marks, completion rate)
  - Parse AI responses into structured format
  - Cache AI insights for 1 hour
  - Handle API rate limits with exponential backoff
  - Add fallback logic if Gemini API is unavailable
  - _Requirements: 10.7, 12.1_

### Phase 9: Communication Center

- [ ] 25. Create Announcement API and UI
  - Create `functions/api/teacher/announcements/index.ts`:
    - `POST /api/teacher/announcements` - Create announcement (stores in D1, triggers notifications)
    - `GET /api/teacher/announcements` - List teacher's announcements
    - `PUT /api/teacher/announcements/:id` - Update announcement
    - `DELETE /api/teacher/announcements/:id` - Delete announcement
  - Create `src/pages/teacher/CreateAnnouncement.tsx` - Form with fields: title, message, target (class/all students), priority, channels (in-app, email, SMS)
  - Create `src/components/teacher/AnnouncementList.tsx` - Card-based list with read counts
  - Send notifications through selected channels immediately
  - Track notification delivery and read status
  - _Requirements: 9.1, 9.3, 9.6, 9.7, 9.8_

- [ ] 26. Implement direct messaging between teacher and students
  - Create `functions/api/teacher/messages/index.ts`:
    - `POST /api/teacher/messages` - Send message to student(s)
    - `GET /api/teacher/messages` - Get message threads
    - `GET /api/teacher/messages/:threadId` - Get conversation history
    - `PUT /api/teacher/messages/:id/read` - Mark message as read
  - Create `src/pages/teacher/MessagingCenter.tsx` - Split view with thread list and conversation panel
  - Add real-time message delivery via SSE
  - Support attachments (images, documents)
  - Show typing indicators using SSE events
  - Add "Reply" and "Forward" actions
  - _Requirements: 9.2, 9.4, 9.5, 14.1_

### Phase 10: Study Material Management

- [ ] 27. Create Material Upload and Management APIs
  - Create `functions/api/teacher/materials/index.ts`:
    - `POST /api/teacher/materials` - Upload material to R2, create metadata in D1
    - `GET /api/teacher/materials` - List teacher's materials
    - `PUT /api/teacher/materials/:id` - Update material metadata
    - `DELETE /api/teacher/materials/:id` - Delete material from R2 and D1
    - `POST /api/teacher/materials/:id/assign` - Assign material to class (create relationship)
    - `DELETE /api/teacher/materials/:id/unassign/:classId` - Unassign from class
    - `PUT /api/teacher/materials/:id/visibility` - Toggle visibility for students
  - Implement R2 upload using pre-signed URLs for direct upload
  - Store files with path pattern: `materials/{material_id}/v1/{filename}`
  - Validate file types (PDF, DOCX, PPTX, MP4, images)
  - Enforce file size limits (max 50MB for documents, 500MB for videos)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 18.1, 18.2, 18.3_

- [ ] 28. Build Material Management UI
  - Create `src/pages/teacher/MaterialLibrary.tsx` - Grid view of materials with thumbnails
  - Create `src/components/teacher/UploadMaterialModal.tsx` - Drag-and-drop file upload with metadata form (title, description, tags)
  - Show upload progress bar
  - Create `src/components/teacher/MaterialCard.tsx` - Card showing title, file type, size, assigned classes, view count
  - Add actions: Edit, Delete, Assign to Class, Toggle Visibility, View Stats
  - Create `src/components/teacher/MaterialStats.tsx` - Chart showing engagement metrics (views, downloads, students accessed)
  - Add search and filter by file type, assignment status, class
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 18.4, 18.5_

### Phase 11: Testing & Polish

- [ ] 29. Integration testing and bug fixes
  - Test complete workflows end-to-end:
    - Teacher creates class → Students join → Materials assigned → Students download materials
    - Teacher creates assignment → Students submit → Auto-grading runs → Manual grading → Grades released → Students receive notifications
    - Teacher records attendance → System calculates percentages → At-risk identification → Notifications sent
  - Test SSE connection stability with multiple concurrent users
  - Test file upload/download with various file types and sizes
  - Test bulk operations (enrollment, grading, attendance)
  - Test permission checks (HOD vs Course Coordinator vs Teacher)
  - Test error handling and recovery scenarios
  - Fix any identified bugs or edge cases
  - _Requirements: All_

- [ ] 30. UI/UX polish and mobile responsiveness
  - Ensure all pages are fully responsive (mobile, tablet, desktop)
  - Add loading skeletons for better perceived performance
  - Optimize image loading with lazy loading and WebP format
  - Add keyboard shortcuts for common actions
  - Improve form validation with inline error messages
  - Add confirmation dialogs for destructive actions
  - Implement toast notifications for success/error feedback
  - Add tooltips for complex features
  - Ensure WCAG accessibility compliance (color contrast, keyboard navigation, screen reader support)
  - Test on multiple browsers (Chrome, Firefox, Safari, Edge)
  - _Requirements: All, 15.1_

## Notes

- **Mobile-First Design**: Every UI component must be fully responsive and look perfect on mobile devices as well as desktops. Use Tailwind responsive utilities (`sm:`, `md:`, `lg:`) consistently.

- **Testing Strategy**: This feature involves extensive integration with external services (D1, R2, email, Gemini API) and UI rendering. Testing will rely on:
  - **Unit tests** for business logic (validation, calculations, grading engine)
  - **Integration tests** for end-to-end workflows
  - **Manual testing** for UI/UX and real-time features
  - Property-based testing is not appropriate for this infrastructure-heavy feature

- **Incremental Development**: Each task builds on previous tasks. Complete tasks in order to maintain working functionality at each step.

- **Requirements Traceability**: Each task includes explicit references to the requirements it implements, ensuring complete coverage.

- **Checkpoint Strategy**: After each phase, run integration tests and ensure all features work correctly before proceeding to the next phase.

- **Security**: All API endpoints must enforce authentication and authorization checks. Teacher hierarchy permissions must be validated for sensitive operations.

- **Real-Time Sync**: SSE implementation is critical for user experience. Ensure robust connection management and fallback to polling if SSE fails.

- **Performance**: Cache dashboard stats and analytics to reduce database load. Use pagination for large lists (students, assignments, materials).

- **Database Migrations**: Apply migrations incrementally and test rollback procedures. Maintain backward compatibility with existing student features.

- **Deployment Strategy**: Deploy using blue-green strategy to ensure zero downtime. Test thoroughly in staging environment before production deployment.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "2"] },
    { "id": 1, "tasks": ["3", "4"] },
    { "id": 2, "tasks": ["5", "6", "7", "10", "27"] },
    { "id": 3, "tasks": ["8", "9", "11", "18", "28"] },
    { "id": 4, "tasks": ["12", "13", "14", "19"] },
    { "id": 5, "tasks": ["15", "20", "21", "25"] },
    { "id": 6, "tasks": ["16", "17", "22", "26"] },
    { "id": 7, "tasks": ["23", "24"] },
    { "id": 8, "tasks": ["29"] },
    { "id": 9, "tasks": ["30"] }
  ]
}
```
