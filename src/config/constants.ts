// ============================================================
// SHIKSHA SAHAYAK OS - PLATFORM CONSTANTS & DEFAULTS
// ============================================================

export const DEFAULT_ACADEMIC_DEFAULTS = {
  universityId: 'gtu',
  universityName: 'Gujarat Technological University',
  degreeId: 'btech',
  degreeName: 'Bachelor of Technology',
  branchId: 'computer-engineering',
  branchName: 'Computer Engineering',
  semester: 5,
  academicYear: '2026-2027',
  preferredLanguage: 'en',
};

export const DASHBOARD_WIDGET_KEYS = {
  RECENT_MATERIALS: 'recent_materials',
  CONTINUE_LEARNING: 'continue_learning',
  SUBJECTS_GRID: 'subjects_grid',
  PREVIOUS_PAPERS: 'previous_papers',
  ANNOUNCEMENTS: 'announcements',
  BOOKMARKS: 'bookmarks',
  RECOMMENDED_RESOURCES: 'recommended_resources',
  QUICK_ACTIONS: 'quick_actions',
} as const;

export type DashboardWidgetKey = (typeof DASHBOARD_WIDGET_KEYS)[keyof typeof DASHBOARD_WIDGET_KEYS];
