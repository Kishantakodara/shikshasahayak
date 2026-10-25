// ============================================================
// SHIKSHA SAHAYAK OS - PERSONALIZATION & ADAPTIVE LEARNING TYPES
// ============================================================

import { LearningResource } from "./content-engine";

/** 8 Master Personalization Levels */
export type PersonalizationLevel =
  | 'platform'
  | 'dashboard'
  | 'content'
  | 'assessment'
  | 'search'
  | 'notification'
  | 'recommendation'
  | 'library';

/** Student Preferences Specification */
export interface StudentPreferencesSpec {
  userId: string;
  preferredLanguage: 'en' | 'gu' | 'hi';
  dashboardLayout?: WidgetLayoutSpec[];
  notificationPrefs?: Record<string, boolean>;
  updatedAt: string;
}

/** Dashboard Widget Arrangement Specification */
export interface WidgetLayoutSpec {
  id: string;
  userId: string;
  widgetKey:
    | 'continue_learning'
    | 'quick_shortcuts'
    | 'upcoming_assessments'
    | 'recent_downloads'
    | 'bookmarks'
    | 'recommendations'
    | 'learning_streak';
  position: number;
  isPinned: boolean;
  updatedAt: string;
}

/** Student Learning Streak Specification */
export interface LearningStreakSpec {
  userId: string;
  currentStreakDays: number;
  longestStreakDays: number;
  lastActiveDate: string;
}

/** Student Topic Performance Record (Adaptive Learning Foundation) */
export interface TopicPerformanceSpec {
  id: string;
  userId: string;
  subjectId: string;
  topicId: string;
  masteryScore: number; // 0.0 to 100.0%
  accuracyRate: number; // 0.0 to 100.0%
  totalPracticeCount: number;
  updatedAt: string;
}

/** Personalized Feed Payload */
export interface PersonalizedFeedPayload {
  userId: string;
  isExploreMode: boolean;
  activeContext: {
    universityId?: string | null;
    degreeId?: string | null;
    branchId?: string | null;
    semesterId?: string | null;
  };
  recommendedResources: LearningResource[];
  continueLearning: LearningResource[];
  streakInfo: LearningStreakSpec;
  widgets: WidgetLayoutSpec[];
}
