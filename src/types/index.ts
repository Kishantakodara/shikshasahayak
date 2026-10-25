// ============================================================
// ShikshaSahayak Assessment Hub — TypeScript Types
// ============================================================

// Export teacher types
export * from './teacher';
export * from './prepZone';

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  COLLEGE_ADMIN = 'COLLEGE_ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
}

export enum QuestionType {
  SINGLE_CORRECT = 'SINGLE_CORRECT',
  MULTIPLE_CORRECT = 'MULTIPLE_CORRECT',
  TRUE_FALSE = 'TRUE_FALSE',
  FILL_IN_BLANK = 'FILL_IN_BLANK',
  NUMERICAL = 'NUMERICAL',
  SUBJECTIVE = 'SUBJECTIVE',
  MATCH_FOLLOWING = 'MATCH_FOLLOWING',
  IMAGE_BASED = 'IMAGE_BASED',
  CASE_STUDY = 'CASE_STUDY',
  MCQ = 'SINGLE_CORRECT',
  MSQ = 'MULTIPLE_CORRECT',
  NAT = 'NUMERICAL',
  ASSERTION_REASON = 'ASSERTION_REASON',
}

export enum DifficultyLevel {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  EXPERT = 'EXPERT',
}

export enum BloomTaxonomy {
  REMEMBER = 'REMEMBER',
  UNDERSTAND = 'UNDERSTAND',
  APPLY = 'APPLY',
  ANALYZE = 'ANALYZE',
  EVALUATE = 'EVALUATE',
  CREATE = 'CREATE',
}

export enum QuizStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
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

export enum AttemptStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  TIMED_OUT = 'TIMED_OUT',
  EVALUATED = 'EVALUATED',
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
}

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
}

export enum AchievementType {
  BADGE = 'BADGE',
  CERTIFICATE = 'CERTIFICATE',
  MILESTONE = 'MILESTONE',
  STREAK = 'STREAK',
}

export enum SubscriptionPlan {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
}

// ============================================================
// INTERFACES
// ============================================================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
  profile?: Profile | null;
  collegeId?: string | null;
}

export interface Profile {
  id: string;
  userId: string;
  phone?: string | null;
  dateOfBirth?: Date | string | null;
  gender?: string | null;
  bio?: string | null;
  enrollmentNo?: string | null;
  departmentId?: string | null;
  semester?: number | null;
  section?: string | null;
  academicYear?: string | null;
  designation?: string | null;
  specialization?: string | null;
  experience?: number | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  timezone?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface College {
  id: string;
  name: string;
  shortName?: string | null;
  slug: string;
  logo?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  affiliatedTo?: string | null;
  establishedYear?: number | null;
  plan: SubscriptionPlan;
  planExpiresAt?: Date | string | null;
  maxStudents: number;
  maxTeachers: number;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface LmsDepartment {
  id: string;
  collegeId: string;
  name: string;
  shortName?: string | null;
  slug: string;
  headOfDept?: string | null;
  description?: string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Course {
  id: string;
  departmentId: string;
  name: string;
  code: string;
  slug: string;
  description?: string | null;
  duration?: number | null;
  totalCredits?: number | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Semester {
  id: string;
  collegeId: string;
  name: string;
  number: number;
  academicYear: string;
  startDate: Date | string;
  endDate: Date | string;
  isCurrent: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Subject {
  id: string;
  courseId?: string | null;
  departmentId?: string | null;
  name: string;
  code: string;
  slug: string;
  semester: number;
  credits?: number | null;
  description?: string | null;
  syllabus?: string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Chapter {
  id: string;
  subjectId: string;
  name: string;
  slug: string;
  unitNo?: number | null;
  orderIndex: number;
  description?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Topic {
  id: string;
  chapterId: string;
  name: string;
  slug: string;
  orderIndex: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Class {
  id: string;
  teacherId: string;
  subjectId: string;
  name: string;
  description?: string | null;
  section?: string | null;
  joinCode: string;
  semester?: number | null;
  academicYear?: string | null;
  coverImage?: string | null;
  isActive: boolean;
  maxStudents: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  teacher?: User;
  subject?: Subject;
  studentCount?: number;
  quizCount?: number;
  assignmentCount?: number;
}

export interface Enrollment {
  id: string;
  classId: string;
  studentId: string;
  enrolledAt: Date | string;
  isActive: boolean;
  student?: User;
  class?: Class;
}

export interface ClassMaterial {
  id: string;
  classId: string;
  title: string;
  description?: string | null;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSizeBytes?: number | null;
  createdAt: Date | string;
}

export interface QuestionOption {
  id: string;
  text: string;
  imageUrl?: string;
  isCorrect?: boolean;
}

export interface Question {
  id: string;
  subjectId?: string | null;
  departmentId?: string | null;
  chapterId?: string | null;
  topicId?: string | null;
  createdById: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  bloomLevel?: BloomTaxonomy | null;
  questionText: string;
  questionHtml?: string | null;
  questionImage?: string | null;
  options?: any; // QuestionOption[] as JSON
  correctAnswer?: string | null;
  correctAnswers?: any; // string[] as JSON
  matchPairs?: any; // { left: string, right: string }[] as JSON
  questionCategory?: 'numerical' | 'analytical' | 'theoretical' | 'reasoning';
  acceptableNumericalRange?: { min: number; max: number; tolerance?: number };
  assertionText?: string;
  reasonText?: string;
  examSource?: 'GTU' | 'GATE' | 'ESE' | 'ISRO' | 'PRACTICE';
  examYear?: number;
  stepByStepSolution?: string[];
  explanation?: string | null;
  explanationImage?: string | null;
  marks: number;
  negativeMarks: number;
  timeLimitSecs?: number | null;
  tags: string[];
  isPublic: boolean;
  isVerified: boolean;
  usageCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Quiz {
  id: string;
  classId: string;
  title: string;
  description?: string | null;
  instructions?: string | null;
  status: QuizStatus;
  totalMarks: number;
  passingMarks?: number | null;
  durationMinutes: number;
  scheduledAt?: Date | string | null;
  startedAt?: Date | string | null;
  endsAt?: Date | string | null;
  allowLateSubmission: boolean;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  showResults: boolean;
  showCorrectAnswers: boolean;
  showExplanation: boolean;
  showLeaderboard: boolean;
  maxAttempts: number;
  enableProctoring: boolean;
  preventTabSwitch: boolean;
  preventCopyPaste: boolean;
  fullscreenMode: boolean;
  autoSubmit: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  class?: Class;
  questionCount?: number;
  questions?: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  questionId: string;
  orderIndex: number;
  marks?: number | null;
  negativeMarks?: number | null;
  question?: Question;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  attemptNumber: number;
  status: AttemptStatus;
  startedAt: Date | string;
  submittedAt?: Date | string | null;
  totalMarks?: number | null;
  obtainedMarks?: number | null;
  percentage?: number | null;
  timeTakenSecs?: number | null;
  tabSwitchCount: number;
  isEvaluated: boolean;
  feedback?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  quiz?: Quiz;
  student?: User;
}

export interface QuizResponse {
  id: string;
  attemptId: string;
  quizQuestionId: string;
  selectedOption?: string | null;
  selectedOptions?: any; // string[] as JSON
  textAnswer?: string | null;
  numericalAnswer?: number | null;
  matchAnswers?: any; // Record<string, string> as JSON
  isCorrect?: boolean | null;
  marksObtained?: number | null;
  isFlagged: boolean;
  timeTakenSecs?: number | null;
  evaluatedBy?: string | null;
  evaluationComment?: string | null;
  answeredAt?: Date | string | null;
}

export interface Assignment {
  id: string;
  classId: string;
  title: string;
  description?: string | null;
  instructions?: string | null;
  status: AssignmentStatus;
  totalMarks: number;
  dueDate: Date | string;
  publishedAt?: Date | string | null;
  allowLateSubmission: boolean;
  latePenaltyPercent?: number | null;
  maxFileSize?: number | null;
  allowedFileTypes: string[];
  rubric?: any; // JSON
  attachments?: any; // JSON array of { name, url, type }
  createdAt: Date | string;
  updatedAt: Date | string;
  class?: Class;
  submissionCount?: number;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  status: SubmissionStatus;
  textContent?: string | null;
  attachments?: any; // JSON array of { name, url, type }
  externalLinks?: any; // JSON array of links
  submittedAt?: Date | string | null;
  gradedAt?: Date | string | null;
  gradedBy?: string | null;
  marks?: number | null;
  feedback?: string | null;
  annotations?: any; // JSON
  isLate: boolean;
  resubmitCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  student?: User;
  assignment?: Assignment;
}

export interface PracticeAttempt {
  id: string;
  studentId: string;
  subjectId?: string | null;
  chapterId?: string | null;
  difficulty?: DifficultyLevel | null;
  questionType?: QuestionType | null;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  score: number;
  percentage: number;
  timeTakenSecs?: number | null;
  completedAt?: Date | string | null;
  createdAt: Date | string;
}

export interface PracticeResponse {
  id: string;
  attemptId: string;
  questionId: string;
  selectedAnswer?: string | null;
  isCorrect?: boolean | null;
  timeTakenSecs?: number | null;
  question?: Question;
}

export interface GamificationProfile {
  id: string;
  userId: string;
  xp: number;
  coins: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityAt?: Date | string | null;
  totalQuizzes: number;
  totalPractice: number;
  totalCorrect: number;
  totalAttempted: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: AchievementType;
  criteria: any; // JSON
  xpReward: number;
  coinReward: number;
  isActive: boolean;
  createdAt: Date | string;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  earnedAt: Date | string;
  achievement?: Achievement;
}

export interface LeaderboardEntry {
  id: string;
  quizId?: string | null;
  userId: string;
  scope: string;
  score: number;
  rank?: number | null;
  period?: string | null;
  createdAt: Date | string;
  user?: User;
}

export interface Certificate {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  type: string;
  certificateNo: string;
  issuedAt: Date | string;
  pdfUrl?: string | null;
  qrCode?: string | null;
  metadata?: any; // JSON
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  link?: string | null;
  metadata?: any; // JSON
  isRead: boolean;
  readAt?: Date | string | null;
  createdAt: Date | string;
}

export interface LmsAnnouncement {
  id: string;
  classId?: string | null;
  collegeId?: string | null;
  authorId: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  author?: User;
}

export interface DiscussionPost {
  id: string;
  classId: string;
  authorId: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  author?: User;
  replies?: DiscussionReply[];
}

export interface DiscussionReply {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  author?: User;
}

export interface Bookmark {
  id: string;
  userId: string;
  questionId: string;
  note?: string | null;
  createdAt: Date | string;
  question?: Question;
}

// API Wrappers
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export enum PaperType {
  MIDSEM = 'Midsem',
  ENDSEM = 'Endsem',
  QUIZ = 'Quiz',
  ASSIGNMENT = 'Assignment'
}

export type ApprovalStatus = 'published' | 'pending' | 'rejected';

export interface Announcement {
  id: string;
  title: string;
  date: string;
  category: 'Exam' | 'General' | 'Event' | 'Important';
  link?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  color: string;
  iconName: string;
}

export interface PYQ {
  id: string;
  departmentId: string;
  semester: number;
  year: number;
  type: PaperType;
  title: string;
  downloadUrl: string;
  size: string;
  status: ApprovalStatus;
  submittedBy?: string;
  submittedDate?: string;
}

export interface NoteSection {
  id: string;
  title: string;
  content: string; // In a real app, this might be Markdown or HTML
}

export interface Note {
  id: string;
  title: string;
  departmentId: string;
  semester: number;
  author: string;
  lastUpdated: string;
  sections?: NoteSection[];
  pdfUrl?: string;
  storagePath?: string;
  views: number;
  likes: number;
  status: ApprovalStatus;
  submittedBy?: string;
  submittedDate?: string;
}

export type FilterState = {
  department: string | 'all';
  semester: number | 'all';
  year: number | 'all';
  type: PaperType | 'all';
  search: string;
  subject: string | 'all';
};

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date; // ISO date string YYYY-MM-DD
  type: 'exam' | 'study' | 'assignment' | 'other';
}

// --- NEW API TYPES ---

export interface Branch {
  id: string;
  name: string;
  slug: string;
  short_name?: string;
  program_id?: string;
  program_name?: string;
  program_slug?: string;
  /** @deprecated use slug */
  code?: string;
}

export interface BranchDetail {
  branch: Branch;
  semesters: { semester: number }[];
}

export interface BrowseSubject {
  offering_id: string;
  semester: number;
  subject_group?: string;
  curriculum_id: string;
  curriculum_name: string;
  subject_id: string;
  subject_code: string;
  subject_name: string;
  subject_slug: string;
  session_count: number;
  material_count: number;
}

export interface BrowseSessionFolder {
  code: string;
  year: number;
  session: string;
  label: string;
}

export interface BrowseSubjectDetail {
  branch: Branch;
  offering: {
    offering_id: string;
    semester: number;
    subject_group?: string;
    curriculum_id: string;
    curriculum_name: string;
    subject_id: string;
    subject_code: string;
    subject_name: string;
    subject_slug: string;
  };
  semester: number;
  curriculum: string;
  material_type: string;
  sessions: BrowseSessionFolder[];
  materials_without_session: {
    id: string; title: string; material_type: string; blog_id?: string; version_label?: string;
    unit_no?: number | null; material_kind?: string; topic?: string; chapter?: string;
  }[];
  canonical_pyq_hierarchy?: any;
}

export interface BrowseSessionDetail {
  branch: Branch;
  offering: { offering_id: string; subject_name: string; subject_slug: string };
  semester: number;
  curriculum: string;
  session: BrowseSessionFolder;
  material_type: string;
  materials: Material[];
}

export interface SubjectOffering {
  id: string; // offeringId
  subjectCode: string;
  subjectName: string;
  branch: string;
  semester: number;
  curriculumYear: number;
}

export interface Material {
  id: string;
  title: string;
  type: 'pyq' | 'note' | 'assignment';
  offeringId: string;
  pdfUrl?: string;
  author?: string;
  year?: number; // for PYQs
  status: 'published' | 'pending' | 'rejected';
  createdAt: string;
  departmentId?: string;
  semester?: number;
  blog_id?: string;
  blog_title?: string;
}

// ============================================================
// UNIFIED QUESTION INTELLIGENCE ENGINE (PHASE 1A TYPES)
// ============================================================

export type QuestionSource = 'GTU' | 'GATE' | 'AI_PRACTICE' | 'TEACHER' | 'OTHER';
export type QuestionVerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected' | 'flagged';
export type IngestionSource = 'GTU_PDF' | 'GATE_ZIP' | 'AI_GENERATOR' | 'MANUAL_IMPORT';
export type IngestionProcessingStatus = 'staged' | 'processing' | 'approved' | 'rejected' | 'failed';

export interface McqOptionSpec {
  id: string;
  text: string;
  html?: string;
  imageUrl?: string;
  isCorrect?: boolean;
}

export interface McqQuestionData {
  options: McqOptionSpec[];
  correctAnswer: string; // Option ID e.g. "A"
}

export interface MsqOptionSpec {
  id: string;
  text: string;
  html?: string;
  imageUrl?: string;
  isCorrect?: boolean;
}

export interface MsqQuestionData {
  options: MsqOptionSpec[];
  correctAnswers: string[]; // Option IDs e.g. ["A", "C"]
}

export interface NatAcceptableRange {
  min: number;
  max: number;
  tolerance?: number;
}

export interface NatQuestionData {
  exactValue?: number | string;
  acceptableRange: NatAcceptableRange;
  unit?: string;
}

export interface QuestionBranchMapping {
  id: string;
  questionId: string;
  branchId: string;
  branchSlug?: string;
  branchName?: string;
  createdAt?: string;
}

export interface QuestionIngestionQueueItem {
  id: string;
  source: IngestionSource;
  rawPayloadJson: string;
  extractedQuestionText?: string;
  detectedType?: 'MCQ' | 'MSQ' | 'NAT' | null;
  confidenceScore?: number;
  processingStatus: IngestionProcessingStatus;
  errorLog?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MasterQuestion {
  id: string;
  sourceType: QuestionSource;
  isOriginalPyq: boolean;
  isAiGenerated: boolean;
  provenanceId?: string | null;
  sourceUrl?: string | null;
  examName: string;
  examYear?: number | null;
  examSession?: 'SUMMER' | 'WINTER' | 'FEBRUARY' | 'NONE' | null;
  questionNo?: string | null;
  subQuestionNo?: string | null;
  
  // Academic Hierarchy
  canonicalSubjectId?: string | null;
  subjectCode?: string | null;
  subjectName: string;
  semester: number;
  curriculumNodeId?: string | null;
  unitNo?: number | null;
  topicName?: string | null;
  
  // Question Structure & Types
  questionType: 'MCQ' | 'MSQ' | 'NAT' | QuestionType;
  questionText: string;
  questionHtml?: string | null;
  questionImageUrl?: string | null;
  
  // Format Payloads
  mcqData?: McqQuestionData | null;
  msqData?: MsqQuestionData | null;
  natData?: NatQuestionData | null;
  optionsJson?: string | null;
  correctAnswerJson: string;
  acceptableNumericalRangeJson?: string | null;

  // Staging / In-Memory Convenience Fields
  options?: McqOptionSpec[] | any[];
  correctAnswer?: string | string[] | null;
  acceptableNumericalRange?: NatAcceptableRange | { min: number; max: number; tolerance?: number } | null;
  
  // Multi-Branch Mappings (1 Question -> N Branches)
  applicableBranches?: string[];
  branchMappings?: QuestionBranchMapping[];
  
  // Pedagogical & Evaluation Metadata
  explanation?: string | null;
  stepByStepSolutionJson?: string | null;
  stepByStepSolution?: string[];
  marks: number;
  negativeMarking: number;
  difficulty: 'easy' | 'medium' | 'hard' | DifficultyLevel;
  bloomLevel?: BloomTaxonomy | null;
  tags?: string[];
  
  // Governance & Verification Workflow
  verificationStatus: QuestionVerificationStatus;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// STUDENT PORTAL - MCQ PRACTICE FEATURE TYPES
// ============================================================

export type StudentMcqPracticeMode = 'RANDOM' | 'TOPIC_WISE' | 'PYQ_WISE' | 'CUSTOM';
export type StudentMcqSourceMode = 'GTU_PYQ' | 'GATE_PYQ' | 'PRACTICE' | 'ALL';

export interface McqPracticeFilterParams {
  mode?: StudentMcqPracticeMode;
  sourceMode?: StudentMcqSourceMode;
  branchId?: string;
  semester?: number;
  subjectCode?: string;
  canonicalSubjectId?: string;
  subjectName?: string;
  topicName?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  examYear?: number;
  examName?: string;
  isOriginalPyq?: boolean;
  isBookmarkedOnly?: boolean;
  unattemptedOnly?: boolean;
  studentId?: string;
  limit?: number;
  page?: number;
}

export interface StudentMcqQuestionDTO {
  id: string;
  questionText: string;
  questionHtml?: string | null;
  questionImageUrl?: string | null;
  options: Array<{
    id: string;
    text: string;
    imageUrl?: string;
  }>;
  subjectName: string;
  subjectCode?: string | null;
  semester: number;
  topicName?: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  sourceType: QuestionSource;
  isOriginalPyq: boolean;
  examName?: string | null;
  examYear?: number | null;
  examSession?: string | null;
  explanation?: string | null;
  stepByStepSolution?: string[];
  isBookmarked?: boolean;
  userLastAttempt?: {
    selectedOptionId: string;
    isCorrect: boolean;
    attemptedAt: string;
  };
}

export interface StudentMcqAnswerEvaluation {
  questionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  correctAnswer: string;
  explanation?: string | null;
  stepByStepSolution?: string[];
  accuracyRate?: number;
}

export interface StudentMcqAttemptRecord {
  id: string;
  studentId: string;
  questionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  timeTakenSeconds: number;
  practiceMode: StudentMcqPracticeMode;
  createdAt: string;
}

export interface StudentMcqBookmarkRecord {
  id: string;
  studentId: string;
  questionId: string;
  notes?: string | null;
  createdAt: string;
}

export interface StudentMcqProgressSummary {
  studentId: string;
  branchId?: string;
  subjectCode?: string;
  totalAttempted: number;
  totalCorrect: number;
  accuracyPercentage: number;
  topicBreakdown: Array<{
    topicName: string;
    totalAttempted: number;
    totalCorrect: number;
    accuracyPercentage: number;
  }>;
}

// ============================================================
// PHASE 1D: INTELLIGENT RANDOM TEST & QUIZ ENGINE TYPES
// ============================================================

export type TestType =
  | 'RANDOM_TEST'
  | 'TOPIC_TEST'
  | 'SUBJECT_TEST'
  | 'BRANCH_TEST'
  | 'GTU_PYQ_TEST'
  | 'GATE_PYQ_TEST'
  | 'MIXED_TEST'
  | 'CUSTOM_TEST'
  | 'WEAK_TOPIC_TEST'
  | 'INCORRECT_QUESTION_TEST'
  | 'BOOKMARK_TEST';

export type TestSourceMode = 'GTU_PYQ' | 'GATE_PYQ' | 'AI_GENERATED' | 'PRACTICE' | 'ALL';
export type TestQuestionTypeFilter = 'MCQ' | 'MSQ' | 'NAT' | 'MIXED';
export type TestDifficultyFilter = 'EASY' | 'MEDIUM' | 'HARD' | 'MIXED';
export type TestSessionState = 'CREATED' | 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED' | 'ABANDONED';
export type TestMode = 'EXAM_MODE' | 'IMMEDIATE_PRACTICE';

export interface TestGenerationConfig {
  testType: TestType;
  sourceMode?: TestSourceMode;
  practiceMode?: TestMode;
  questionTypes?: Array<'MCQ' | 'MSQ' | 'NAT'> | TestQuestionTypeFilter;
  branchId?: string;
  semester?: number;
  subjectCode?: string;
  subjectName?: string;
  canonicalSubjectId?: string;
  topicName?: string;
  examName?: string;
  examYear?: number;
  difficulty?: TestDifficultyFilter;
  questionCount: number;
  durationMinutes: number;
  negativeMarking?: boolean;
  negativeMarkValue?: number;
  randomizeQuestions?: boolean;
  randomizeOptions?: boolean;
  excludeAttempted?: boolean;
  excludeCorrectlyAnswered?: boolean;
  mixedTypeDistribution?: { mcqCount?: number; msqCount?: number; natCount?: number };
  mixedDifficultyDistribution?: { easyCount?: number; mediumCount?: number; hardCount?: number };
  studentId?: string;
  seed?: string;
}


export interface TestShortageError {
  success: false;
  reason: 'INSUFFICIENT_QUESTIONS';
  requested: number;
  available: number;
}

export interface StudentTestQuestionDTO {
  id: string;
  sequenceNumber: number;
  questionText: string;
  questionHtml?: string | null;
  questionImageUrl?: string | null;
  questionType: 'MCQ' | 'MSQ' | 'NAT' | QuestionType;
  options: Array<{ id: string; text: string; imageUrl?: string }>;
  marks: number;
  negativeMarks: number;
  subjectName: string;
  topicName?: string | null;
  sourceType: QuestionSource;
  isOriginalPyq: boolean;
  isAiGenerated: boolean;
  examName?: string | null;
  examYear?: number | null;
  selectedAnswer?: string | null;
  isAnswered?: boolean;
}

export interface TestSessionDTO {
  id: string;
  studentId: string;
  testType: TestType;
  sourceMode: TestSourceMode;
  practiceMode?: TestMode;
  mode?: TestMode;
  status: TestSessionState;
  questionCount: number;
  durationMinutes: number;
  remainingSeconds: number;
  negativeMarking: boolean;
  negativeMarkValue: number;
  startedAt?: string | null;
  submittedAt?: string | null;
  totalMarks: number;
  obtainedMarks: number;
  questions: StudentTestQuestionDTO[];
}

export interface TestHistoryItem {
  id: string;
  studentId: string;
  testType: string;
  sourceMode: string;
  status: string;
  questionCount: number;
  durationMinutes: number;
  obtainedMarks: number;
  totalMarks: number;
  accuracyPercentage: number;
  submittedAt?: string | null;
  createdAt?: string;
}


export interface TestResultDTO {
  testSessionId: string;
  studentId: string;
  status: TestSessionState;
  score: number;
  totalMarks: number;
  percentage: number;
  accuracyPercentage: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  totalQuestions: number;
  timeTakenSeconds: number;
  questionResults: Array<{
    questionId: string;
    sequenceNumber: number;
    questionText: string;
    questionType: 'MCQ' | 'MSQ' | 'NAT' | QuestionType;
    selectedAnswer?: string | null;
    correctAnswer: string;
    isCorrect: boolean;
    marksObtained: number;
    explanation?: string | null;
    stepByStepSolution?: string[];
    sourceLabel: string;
    subjectName: string;
    topicName?: string | null;
    difficulty: string;
  }>;
  topicWisePerformance: Array<{ topicName: string; total: number; correct: number; accuracyPercentage: number }>;
  sourceWisePerformance: Array<{ source: string; total: number; correct: number }>;
  difficultyWisePerformance: Array<{ difficulty: string; total: number; correct: number }>;
}



