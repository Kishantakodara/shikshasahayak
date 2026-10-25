// ============================================================
// SHIKSHA SAHAYAK OS - PHASE B PERSONALIZED LEARNING ECOSYSTEM TYPES
// ============================================================

export type BookmarkType = 
  | 'notes' 
  | 'pyq' 
  | 'blog' 
  | 'subject' 
  | 'video' 
  | 'assignment' 
  | 'ai_chat'
  | 'scholarship'
  | 'job'
  | 'internship'
  | 'mcq'
  | 'study_material';

export interface BookmarkItem {
  id: string;
  targetId: string;
  title: string;
  itemType: BookmarkType;
  subjectCode?: string;
  branchId?: string;
  semester?: number;
  url: string;
  thumbnailUrl?: string;
  createdAt: string;
}

export interface ContinueLearningState {
  lastSubjectId?: string;
  lastSubjectName?: string;
  lastUnitNo?: number;
  lastPdfId?: string;
  lastPdfTitle?: string;
  lastPdfPage?: number;
  lastBlogSlug?: string;
  lastPyqId?: string;
  lastPyqTitle?: string;
  lastAiChatQuery?: string;
  lastAssessmentId?: string;
  scrollPosition?: number;
  updatedAt: string;
}

export interface DownloadItem {
  id: string;
  title: string;
  fileType: 'pdf' | 'zip' | 'doc' | 'image' | 'video';
  sizeBytes: number;
  downloadedAt: string;
  isOfflineAvailable: boolean;
  hasUpdate: boolean;
  storagePath: string;
  subjectCode?: string;
  downloadProgress?: number; // 0 to 100
  isDownloading?: boolean;
}

export type NotificationCategory = 
  | 'exam' 
  | 'announcement' 
  | 'assignment' 
  | 'material' 
  | 'pyq' 
  | 'result' 
  | 'system';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  timestamp: string;
  isRead: boolean;
  isArchived: boolean;
  actionUrl?: string;
  universityId?: string;
  branchId?: string;
  semester?: number;
}

export type CalendarEventType = 
  | 'internal_exam' 
  | 'univ_exam' 
  | 'assignment' 
  | 'practical' 
  | 'revision' 
  | 'reminder' 
  | 'study_session';

export interface CalendarEvent {
  id: string;
  title: string;
  eventType: CalendarEventType;
  startDate: string; // ISO date format YYYY-MM-DD
  endDate?: string;
  startTime?: string;
  endTime?: string;
  subjectCode?: string;
  subjectName?: string;
  notes?: string;
  isCompleted: boolean;
  location?: string;
}

export interface LibraryFolder {
  id: string;
  name: string;
  description?: string;
  color: string;
  itemIds: string[];
  createdAt: string;
}

export interface DailyStudyLog {
  date: string; // YYYY-MM-DD
  minutesSpent: number;
  subjectsStudied: string[];
  materialsReadCount: number;
  quizzesTakenCount: number;
}

export interface LearningAnalyticsData {
  dailyStudyTimeMinutes: number;
  weeklyStudyTimeMinutes: number;
  monthlyStudyTimeMinutes: number;
  subjectProgressPercent: Record<string, number>; // subjectId -> %
  learningStreakDays: number;
  goalProgressPercent: number;
  weeklyLogs: DailyStudyLog[];
}
