// ============================================================
// Teacher Dashboard Integration — TypeScript Types
// ============================================================

import { z } from 'zod';

// ============================================================
// ENUMS
// ============================================================

export enum EnrollmentStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  WITHDRAWN = 'WITHDRAWN',
  COMPLETED = 'COMPLETED',
}

export enum AssignmentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CLOSED = 'CLOSED',
  GRADED = 'GRADED',
}

export enum SubmissionStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  LATE_SUBMITTED = 'LATE_SUBMITTED',
  GRADED = 'GRADED',
  RETURNED = 'RETURNED',
  RESUBMITTED = 'RESUBMITTED',
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EXCUSED = 'EXCUSED',
}

export enum NotificationType {
  ASSIGNMENT_CREATED = 'ASSIGNMENT_CREATED',
  ASSIGNMENT_SUBMITTED = 'ASSIGNMENT_SUBMITTED',
  ASSIGNMENT_GRADED = 'ASSIGNMENT_GRADED',
  QUIZ_SCHEDULED = 'QUIZ_SCHEDULED',
  QUIZ_STARTED = 'QUIZ_STARTED',
  QUIZ_SUBMITTED = 'QUIZ_SUBMITTED',
  QUIZ_RESULT = 'QUIZ_RESULT',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  ACHIEVEMENT = 'ACHIEVEMENT',
  REMINDER = 'REMINDER',
  PRACTICE_REMINDER = 'PRACTICE_REMINDER',
  CLASS_INVITATION = 'CLASS_INVITATION',
  GENERAL = 'GENERAL',
  GRADES_RELEASED = 'GRADES_RELEASED',
  MATERIAL_UPLOADED = 'MATERIAL_UPLOADED',
}

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
}

export enum GradingSystem {
  PERCENTAGE = 'PERCENTAGE',
  GPA = 'GPA',
  LETTER = 'LETTER',
  PASS_FAIL = 'PASS_FAIL',
}

export enum TeacherHierarchy {
  HOD = 'HOD',
  COURSE_COORDINATOR = 'COURSE_COORDINATOR',
  TEACHER = 'TEACHER',
}

// ============================================================
// DOMAIN MODELS / INTERFACES
// ============================================================

export interface Class {
  id: string;
  teacher_id: string;
  subject_id: string | null;
  name: string;
  description: string | null;
  section: string | null;
  semester: number | null;
  academic_year: string | null;
  join_code: string;
  grading_system: GradingSystem;
  max_students: number;
  is_active: boolean;
  cover_image: string | null;
  created_at: string;
  updated_at: string;
  // Relations (optional - populated by joins)
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  subject?: {
    id: string;
    name: string;
    code: string;
  };
  // Aggregated counts (optional - computed)
  student_count?: number;
  assignment_count?: number;
  material_count?: number;
}

export interface ClassEnrollment {
  id: string;
  class_id: string;
  student_id: string;
  enrollment_number: string | null;
  enrollment_status: EnrollmentStatus;
  enrolled_at: string;
  withdrawn_at: string | null;
  final_grade: string | null;
  is_placeholder: boolean;
  invitation_sent_at: string | null;
  invitation_accepted_at: string | null;
  // Relations (optional)
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    enrollmentNo?: string;
  };
  class?: Class;
}

export interface Assignment {
  id: string;
  class_id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  status: AssignmentStatus;
  total_marks: number;
  due_date: string;
  published_at: string | null;
  allow_late_submission: boolean;
  late_penalty_percent: number | null;
  max_file_size_mb: number | null;
  allowed_file_types: string; // JSON array string
  rubric: string | null; // JSON object string
  attachments: string | null; // JSON array string
  created_by: string;
  created_at: string;
  updated_at: string;
  // Relations (optional)
  class?: Class;
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  // Aggregated counts (optional)
  submission_count?: number;
  graded_count?: number;
  pending_count?: number;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  status: SubmissionStatus;
  text_content: string | null;
  attachments: string | null; // JSON array string
  external_links: string | null; // JSON array string
  answers?: Record<string, any>; // JSON object for question answers
  submitted_at: string | null;
  graded_at: string | null;
  graded_by: string | null;
  marks: number | null;
  feedback: string | null;
  annotations: string | null; // JSON object string
  is_late: boolean;
  resubmit_count: number;
  created_at: string;
  updated_at: string;
  // Relations (optional)
  assignment?: Assignment;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    enrollmentNo?: string;
  };
  grader?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface AttendanceRecord {
  id: string;
  class_id: string;
  student_id: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  notes: string | null;
  recorded_by: string;
  recorded_at: string;
  // Relations (optional)
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    enrollmentNo?: string;
  };
  recorder?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface AttendanceSession {
  id: string;
  class_id: string;
  class_name?: string;
  session_code: string;
  challenge_word: string;
  duration_minutes: number;
  starts_at: string;
  expires_at: string;
  geofence_enabled: boolean;
  geofence_latitude?: number;
  geofence_longitude?: number;
  geofence_radius_meters?: number;
  is_active: boolean;
  created_at: string;
  submissions_count?: number;
}

export interface StudentAttendanceSubmission {
  id: string;
  session_id: string;
  class_id: string;
  student_id: string;
  student_name: string;
  enrollment_number: string;
  challenge_word_submitted: string;
  is_word_correct: boolean;
  latitude?: number;
  longitude?: number;
  distance_meters?: number;
  is_within_geofence: boolean;
  submitted_at: string;
  status: 'VERIFIED_PRESENT' | 'WORD_MISMATCH' | 'GEOFENCE_FAILED' | 'EXPIRED';
}

export interface ClassMaterial {
  id: string;
  class_id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size_bytes: number | null;
  is_visible: boolean;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
  // Relations (optional)
  uploader?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  // Aggregated stats (optional)
  view_count?: number;
  download_count?: number;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  link: string | null;
  metadata: string | null; // JSON object string
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface TeacherDepartment {
  id: string;
  teacher_id: string;
  department_id: string;
  hierarchy: TeacherHierarchy;
  assigned_at: string;
  is_primary: boolean;
  // Relations (optional)
  department?: {
    id: string;
    name: string;
    shortName?: string;
  };
}

export interface QuizClassAssignment {
  id: string;
  quiz_id: string;
  class_id: string;
  assigned_at: string;
  is_visible: boolean;
  // Relations (optional)
  quiz?: {
    id: string;
    title: string;
    totalMarks: number;
    durationMinutes: number;
  };
  class?: Class;
}

export interface MaterialStats {
  id: string;
  material_id: string;
  student_id: string;
  viewed_at: string;
  download_count: number;
  last_accessed: string;
  // Relations (optional)
  student?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

// ============================================================
// ZOD VALIDATION SCHEMAS
// ============================================================

// Class Validation
export const ClassSchema = z.object({
  id: z.string().uuid(),
  teacher_id: z.string().uuid(),
  subject_id: z.string().uuid().nullable(),
  name: z.string().min(1, 'Class name is required').max(200, 'Class name must not exceed 200 characters'),
  description: z.string().nullable(),
  section: z.string().nullable(),
  semester: z.number().int().min(1).max(12).nullable(),
  academic_year: z.string().regex(/^\d{4}-\d{2}$/, 'Academic year must be in format YYYY-YY').nullable(),
  join_code: z.string().min(6),
  grading_system: z.nativeEnum(GradingSystem),
  max_students: z.number().int().positive('Max students must be positive'),
  is_active: z.boolean(),
  cover_image: z.string().url().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Enrollment Validation
export const ClassEnrollmentSchema = z.object({
  id: z.string().uuid(),
  class_id: z.string().uuid(),
  student_id: z.string().uuid(),
  enrollment_number: z.string().nullable(),
  enrollment_status: z.nativeEnum(EnrollmentStatus),
  enrolled_at: z.string().datetime(),
  withdrawn_at: z.string().datetime().nullable(),
  final_grade: z.string().nullable(),
  is_placeholder: z.boolean(),
  invitation_sent_at: z.string().datetime().nullable(),
  invitation_accepted_at: z.string().datetime().nullable(),
});

// Assignment Validation
export const AssignmentSchema = z.object({
  id: z.string().uuid(),
  class_id: z.string().uuid(),
  title: z.string().min(1, 'Assignment title is required').max(300, 'Title must not exceed 300 characters'),
  description: z.string().nullable(),
  instructions: z.string().nullable(),
  status: z.nativeEnum(AssignmentStatus),
  total_marks: z.number().positive('Total marks must be positive'),
  due_date: z.string().datetime(),
  published_at: z.string().datetime().nullable(),
  allow_late_submission: z.boolean(),
  late_penalty_percent: z.number().min(0).max(100).nullable(),
  max_file_size_mb: z.number().positive().nullable(),
  allowed_file_types: z.string(), // JSON array
  rubric: z.string().nullable(), // JSON object
  attachments: z.string().nullable(), // JSON array
  created_by: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Submission Validation
export const AssignmentSubmissionSchema = z.object({
  id: z.string().uuid(),
  assignment_id: z.string().uuid(),
  student_id: z.string().uuid(),
  status: z.nativeEnum(SubmissionStatus),
  text_content: z.string().nullable(),
  attachments: z.string().nullable(), // JSON array
  external_links: z.string().nullable(), // JSON array
  submitted_at: z.string().datetime().nullable(),
  graded_at: z.string().datetime().nullable(),
  graded_by: z.string().uuid().nullable(),
  marks: z.number().nonnegative().nullable(),
  feedback: z.string().nullable(),
  annotations: z.string().nullable(), // JSON object
  is_late: z.boolean(),
  resubmit_count: z.number().int().nonnegative(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Attendance Validation
export const AttendanceRecordSchema = z.object({
  id: z.string().uuid(),
  class_id: z.string().uuid(),
  student_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in format YYYY-MM-DD'),
  status: z.nativeEnum(AttendanceStatus),
  notes: z.string().nullable(),
  recorded_by: z.string().uuid(),
  recorded_at: z.string().datetime(),
});

// Material Validation
export const ClassMaterialSchema = z.object({
  id: z.string().uuid(),
  class_id: z.string().uuid(),
  title: z.string().min(1, 'Material title is required').max(300, 'Title must not exceed 300 characters'),
  description: z.string().nullable(),
  file_url: z.string().url(),
  file_name: z.string().min(1),
  file_type: z.string().min(1, 'File type is required'),
  file_size_bytes: z.number().int().positive().nullable(),
  is_visible: z.boolean(),
  uploaded_by: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Notification Validation
export const NotificationSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  type: z.nativeEnum(NotificationType),
  channel: z.nativeEnum(NotificationChannel),
  title: z.string().min(1, 'Notification title is required').max(200, 'Title must not exceed 200 characters'),
  message: z.string().min(1, 'Notification message is required').max(1000, 'Message must not exceed 1000 characters'),
  link: z.string().url().nullable(),
  metadata: z.string().nullable(), // JSON object
  is_read: z.boolean(),
  read_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
});

// Teacher Department Validation
export const TeacherDepartmentSchema = z.object({
  id: z.string().uuid(),
  teacher_id: z.string().uuid(),
  department_id: z.string().uuid(),
  hierarchy: z.nativeEnum(TeacherHierarchy),
  assigned_at: z.string().datetime(),
  is_primary: z.boolean(),
});

// Quiz Class Assignment Validation
export const QuizClassAssignmentSchema = z.object({
  id: z.string().uuid(),
  quiz_id: z.string().uuid(),
  class_id: z.string().uuid(),
  assigned_at: z.string().datetime(),
  is_visible: z.boolean(),
});

// Material Stats Validation
export const MaterialStatsSchema = z.object({
  id: z.string().uuid(),
  material_id: z.string().uuid(),
  student_id: z.string().uuid(),
  viewed_at: z.string().datetime(),
  download_count: z.number().int().nonnegative(),
  last_accessed: z.string().datetime(),
});

// ============================================================
// DTOs (Data Transfer Objects) for API Requests
// ============================================================

// Class DTOs
export const CreateClassDTOSchema = z.object({
  subject_id: z.string().optional().nullable(),
  name: z.string().min(1, 'Class name is required').max(200, 'Class name must not exceed 200 characters'),
  description: z.string().optional().nullable(),
  section: z.string().optional().nullable(),
  semester: z.number().int().min(1).max(12).optional().nullable(),
  academic_year: z.string()
    .refine((val) => !val || /^\d{4}-(\d{2}|\d{4})$/.test(val.trim()), {
      message: 'Academic year must be in format YYYY-YY (e.g., 2024-25 or 2024-2025)',
    })
    .or(z.literal(''))
    .optional()
    .nullable(),
  grading_system: z.nativeEnum(GradingSystem).default(GradingSystem.PERCENTAGE),
  max_students: z.preprocess(
    (val) => (val === '' || val === undefined || val === null || (typeof val === 'number' && isNaN(val))) ? 50 : Number(val),
    z.number().int().positive('Max students must be positive').default(50)
  ),
  cover_image: z.string().url('Must be a valid image URL').or(z.literal('')).optional().nullable(),
});

export type CreateClassDTO = z.infer<typeof CreateClassDTOSchema>;

// Alias for consistency
export const CreateClassSchema = CreateClassDTOSchema;

export const UpdateClassDTOSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().nullable().optional(),
  section: z.string().nullable().optional(),
  semester: z.number().int().min(1).max(12).nullable().optional(),
  academic_year: z.string().regex(/^\d{4}-\d{2}$/).nullable().optional(),
  grading_system: z.nativeEnum(GradingSystem).optional(),
  max_students: z.number().int().positive().optional(),
  is_active: z.boolean().optional(),
  cover_image: z.string().url().nullable().optional(),
});

export type UpdateClassDTO = z.infer<typeof UpdateClassDTOSchema>;

// Assignment DTOs
export const CreateAssignmentDTOSchema = z.object({
  class_id: z.string().uuid(),
  title: z.string().min(1, 'Assignment title is required').max(300, 'Title must not exceed 300 characters'),
  description: z.string().optional(),
  instructions: z.string().optional(),
  total_marks: z.number().positive('Total marks must be positive'),
  due_date: z.string().datetime(),
  allow_late_submission: z.boolean().default(false),
  late_penalty_percent: z.number().min(0).max(100).optional(),
  max_file_size_mb: z.number().positive().optional(),
  allowed_file_types: z.array(z.string()).optional(), // Array of MIME types
  rubric: z.record(z.any()).optional(), // Rubric as object
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    type: z.string(),
  })).optional(),
});

export type CreateAssignmentDTO = z.infer<typeof CreateAssignmentDTOSchema>;

// Enrollment DTOs
export const EnrollmentDTOSchema = z.object({
  class_id: z.string().uuid(),
  student_id: z.string().uuid().optional(),
  enrollment_number: z.string().optional(),
  enrollment_status: z.nativeEnum(EnrollmentStatus).default(EnrollmentStatus.PENDING),
});

export type EnrollmentDTO = z.infer<typeof EnrollmentDTOSchema>;

export const BulkEnrollmentDTOSchema = z.object({
  class_id: z.string().uuid(),
  enrollment_numbers: z.array(z.string().min(1)),
});

export type BulkEnrollmentDTO = z.infer<typeof BulkEnrollmentDTOSchema>;

// Grading DTOs
export const GradingDTOSchema = z.object({
  submission_id: z.string().uuid(),
  marks: z.number().nonnegative('Marks must be non-negative'),
  feedback: z.string().optional(),
  annotations: z.record(z.any()).optional(),
});

export type GradingDTO = z.infer<typeof GradingDTOSchema>;

export const GradeOverrideDTOSchema = z.object({
  submission_id: z.string().uuid(),
  new_marks: z.number().nonnegative('Marks must be non-negative'),
  reason: z.string().min(1, 'Reason is required for grade override'),
});

export type GradeOverrideDTO = z.infer<typeof GradeOverrideDTOSchema>;

// Attendance DTOs
export const AttendanceDTOSchema = z.object({
  class_id: z.string().uuid(),
  student_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in format YYYY-MM-DD'),
  status: z.nativeEnum(AttendanceStatus),
  notes: z.string().optional(),
});

export type AttendanceDTO = z.infer<typeof AttendanceDTOSchema>;

export const BulkAttendanceDTOSchema = z.object({
  class_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in format YYYY-MM-DD'),
  records: z.array(z.object({
    student_id: z.string().uuid(),
    status: z.nativeEnum(AttendanceStatus),
    notes: z.string().optional(),
  })),
});

export type BulkAttendanceDTO = z.infer<typeof BulkAttendanceDTOSchema>;

// Material DTOs
export const CreateMaterialDTOSchema = z.object({
  class_id: z.string().uuid(),
  title: z.string().min(1, 'Material title is required').max(300, 'Title must not exceed 300 characters'),
  description: z.string().optional(),
  file_url: z.string().url(),
  file_name: z.string().min(1),
  file_type: z.string().min(1),
  file_size_bytes: z.number().int().positive().optional(),
  is_visible: z.boolean().default(true),
});

export type CreateMaterialDTO = z.infer<typeof CreateMaterialDTOSchema>;

// Notification DTOs
export const CreateNotificationDTOSchema = z.object({
  user_id: z.string().uuid().optional(), // Optional for bulk notifications
  user_ids: z.array(z.string().uuid()).optional(), // For bulk notifications
  type: z.nativeEnum(NotificationType),
  channel: z.nativeEnum(NotificationChannel).default(NotificationChannel.IN_APP),
  title: z.string().min(1, 'Notification title is required').max(200, 'Title must not exceed 200 characters'),
  message: z.string().min(1, 'Notification message is required').max(1000, 'Message must not exceed 1000 characters'),
  link: z.string().url().optional(),
  metadata: z.record(z.any()).optional(),
});

export type CreateNotificationDTO = z.infer<typeof CreateNotificationDTOSchema>;

// ============================================================
// ANALYTICS & REPORTING INTERFACES
// ============================================================

export interface ClassAnalytics {
  class_id: string;
  class_name: string;
  total_students: number;
  active_enrollments: number;
  total_assignments: number;
  published_assignments: number;
  average_marks: number | null;
  median_marks: number | null;
  std_deviation: number | null;
  at_risk_students: number;
  attendance_average: number | null;
}

export interface StudentAnalytics {
  student_id: string;
  student_name: string;
  enrollment_number: string | null;
  class_id: string;
  total_assignments: number;
  submitted_assignments: number;
  graded_assignments: number;
  average_marks: number | null;
  attendance_percentage: number | null;
  is_at_risk: boolean;
  last_activity: string | null;
}

export interface AtRiskStudent {
  student_id: string;
  student_name: string;
  enrollment_number: string | null;
  attendance_percentage: number | null;
  average_marks: number | null;
  missing_submissions: number;
  risk_factors: string[];
}

export interface TeacherDashboardStats {
  total_classes: number;
  active_classes: number;
  total_students: number;
  pending_grading: number;
  unread_notifications: number;
  recent_activity: RecentActivity[];
}

export interface RecentActivity {
  id: string;
  type: 'submission' | 'enrollment' | 'grade_release' | 'material_upload' | 'announcement';
  title: string;
  description: string;
  timestamp: string;
  link?: string;
}

export interface AttendanceReport {
  class_id: string;
  class_name: string;
  date_range: {
    start: string;
    end: string;
  };
  total_sessions: number;
  student_records: {
    student_id: string;
    student_name: string;
    present_count: number;
    absent_count: number;
    late_count: number;
    excused_count: number;
    attendance_percentage: number;
  }[];
}

export interface QuizAnalytics {
  quiz_id: string;
  quiz_title: string;
  total_attempts: number;
  completed_attempts: number;
  average_score: number | null;
  median_score: number | null;
  highest_score: number | null;
  lowest_score: number | null;
  question_analytics: {
    question_id: string;
    question_text: string;
    total_attempts: number;
    correct_count: number;
    accuracy: number;
  }[];
}

export interface AssignmentAnalytics {
  assignment_id: string;
  assignment_title: string;
  total_students: number;
  submissions_count: number;
  submission_rate: number;
  graded_count: number;
  average_marks: number | null;
  median_marks: number | null;
  on_time_submissions: number;
  late_submissions: number;
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface EnrollmentResult {
  successful: {
    enrollment_number: string;
    student_id: string | null;
    is_placeholder: boolean;
  }[];
  failed: {
    enrollment_number: string;
    reason: string;
  }[];
}

export interface GradingResult {
  submission_id: string;
  marks: number;
  is_auto_graded: boolean;
  feedback?: string;
}

export interface RubricScore {
  criterion: string;
  points: number;
  max_points: number;
  feedback?: string;
}

export interface PendingSubmission {
  submission_id: string;
  assignment_id: string;
  assignment_title: string;
  student_id: string;
  student_name: string;
  submitted_at: string;
  is_late: boolean;
  class_name: string;
}

export interface ClassDetail {
  class: Class;
  enrollments: ClassEnrollment[];
  assignments: Assignment[];
  materials: ClassMaterial[];
  upcoming_events: {
    type: 'assignment_due' | 'quiz_scheduled';
    title: string;
    date: string;
  }[];
}

export interface AIInsight {
  type: 'performance' | 'attendance' | 'engagement' | 'recommendation';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  action_items?: string[];
}

// ============================================================
// TYPE GUARDS
// ============================================================

export function isEnrollmentStatus(value: string): value is EnrollmentStatus {
  return Object.values(EnrollmentStatus).includes(value as EnrollmentStatus);
}

export function isAssignmentStatus(value: string): value is AssignmentStatus {
  return Object.values(AssignmentStatus).includes(value as AssignmentStatus);
}

export function isSubmissionStatus(value: string): value is SubmissionStatus {
  return Object.values(SubmissionStatus).includes(value as SubmissionStatus);
}

export function isAttendanceStatus(value: string): value is AttendanceStatus {
  return Object.values(AttendanceStatus).includes(value as AttendanceStatus);
}

export function isTeacherHierarchy(value: string): value is TeacherHierarchy {
  return Object.values(TeacherHierarchy).includes(value as TeacherHierarchy);
}

// ============================================================
// ADDITIONAL TYPES FOR GRADING ENGINE
// ============================================================

export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  maxPoints: number;
  scale?: string[]; // Optional rating scale (e.g., ["Excellent", "Good", "Fair", "Poor"])
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  student_id: string;
  answers: Record<string, any>;
  score: number;
  max_score: number;
  started_at: string;
  submitted_at: string | null;
  time_taken_seconds: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
}

export interface GradingResult {
  totalMarks: number;
  maxMarks: number;
  percentage: number;
  breakdown?: {
    mcq?: { correct: number; total: number; marks: number };
    objective?: { correct: number; total: number; marks: number };
    penalty?: { latePenalty: number; reason: string };
  };
  gradedQuestions?: Array<{
    questionId: string;
    marks: number;
    maxMarks: number;
    isCorrect: boolean;
    feedback?: string;
  }>;
}
