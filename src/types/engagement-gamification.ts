// ============================================================
// SHIKSHA SAHAYAK OS TYPES: Student Engagement & Gamification (Sprint 12)
// ============================================================

export interface StudentStreakSpec {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
}

export interface StudentXPAchievementSpec {
  userId: string;
  totalXp: number;
  level: number;
  badges: string[];
  unlockedAchievements: string[];
}

export interface StudentDailyGoalSpec {
  userId: string;
  targetMinutes: number;
  targetQuestions: number;
  completedMinutes: number;
  completedQuestions: number;
}

export interface LeaderboardUserSpec {
  userId: string;
  displayName: string;
  totalXp: number;
  level: number;
  streak: number;
  rank: number;
}
