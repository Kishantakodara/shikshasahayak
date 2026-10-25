// ============================================================
// SHIKSHA SAHAYAK OS - STUDENT PERSONALIZATION & BOOKMARK TYPES
// ============================================================

import { DashboardWidgetKey } from "../config/constants";

export interface StudentBookmarkSpec {
  id: string;
  userId: string;
  resourceId: string;
  resourceType: 'study_material' | 'pyq' | 'syllabus' | 'video';
  title: string;
  url: string;
  subjectName?: string | null;
  createdAt: string;
}

export interface StudentRecentActivitySpec {
  id: string;
  userId: string;
  actionType: 'view' | 'download' | 'bookmark' | 'attempt';
  resourceId: string;
  resourceTitle: string;
  url: string;
  subjectName?: string | null;
  createdAt: string;
}

export interface WidgetCustomizationSpec {
  widgetKey: DashboardWidgetKey;
  position: number;
  isPinned: boolean;
  isVisible: boolean;
}
