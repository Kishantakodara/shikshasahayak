// ============================================================
// SHIKSHA SAHAYAK OS - CONTENT TAXONOMY & CLASSIFICATION TYPES
// ============================================================

import { ResourceType, ResourceDifficulty, ResourceVisibility, ResourceStatus } from './content-engine';

/** 8 Master Content Categories in ShikshaSahayak OS */
export type MasterCategoryCode =
  | 'academic'
  | 'assessment'
  | 'support'
  | 'media'
  | 'coding'
  | 'career'
  | 'community'
  | 'future';

/** Educational Purpose Classifications */
export type EducationalPurposeCode =
  | 'learning'
  | 'practice'
  | 'revision'
  | 'reference'
  | 'assignment'
  | 'preparation'
  | 'mock'
  | 'lab'
  | 'project'
  | 'certification';

/** Learning Stage Classifications */
export type LearningStageCode =
  | 'introduction'
  | 'concept_building'
  | 'practice'
  | 'revision'
  | 'assessment'
  | 'advanced_learning';

/** Resource Quality Verification Badges */
export type QualityBadgeCode =
  | 'draft'
  | 'verified'
  | 'faculty_verified'
  | 'community_verified'
  | 'official'
  | 'archived'
  | 'deprecated';

/** Supported File Formats / Media Types */
export type TaxonomyMediaType =
  | 'pdf'
  | 'docx'
  | 'ppt'
  | 'pptx'
  | 'image'
  | 'video'
  | 'audio'
  | 'code'
  | 'quiz'
  | 'flashcard'
  | 'article'
  | 'external_url'
  | 'interactive';

/** Supported Multilingual Codes */
export type SupportedLanguageCode = 'en' | 'gu' | 'hi' | 'bilingual' | 'multilingual';

/** Tag Entity Model */
export interface ContentTag {
  id: string;
  name: string;
  slug: string;
  category?: string;
  usageCount: number;
  createdAt: string;
}

/** Content Version History Entry */
export interface ContentVersionItem {
  id: string;
  documentId: string;
  version: string;
  storageKey?: string;
  fileUrl?: string;
  changesSummary?: string;
  updatedBy?: string;
  createdAt: string;
}

/** Content Engagement & Analytics Metrics */
export interface ContentMetrics {
  views: number;
  downloads: number;
  bookmarks: number;
  likes: number;
  ratingsCount: number;
  ratingAvg: number;
  shares: number;
  completionCount: number;
  avgWatchTimeSecs: number;
  popularityScore: number;
}

/** AI Readiness Signals */
export interface AIReadinessSignals {
  summaryReady: boolean;
  quizReady: boolean;
  flashcardReady: boolean;
  topicExtractionReady: boolean;
}

/** Complete 360-Degree Content Object Taxonomy Payload */
export interface ContentObjectTaxonomy {
  documentId: string;
  category: {
    id: string;
    code: MasterCategoryCode;
    name: string;
    icon?: string;
  };
  educationalPurpose: EducationalPurposeCode;
  learningStage: LearningStageCode;
  qualityBadge: QualityBadgeCode;
  mediaType: TaxonomyMediaType;
  difficulty: ResourceDifficulty;
  visibility: ResourceVisibility;
  status: ResourceStatus;
  language: SupportedLanguageCode;
  version: string;

  tags: ContentTag[];
  keywords: string[];

  metrics: ContentMetrics;
  aiReadiness: AIReadinessSignals;

  createdAt: string;
  updatedAt: string;
}

/** Master Taxonomy Lookup Payload */
export interface TaxonomyMasterLookup {
  categories: Array<{ id: string; code: MasterCategoryCode; name: string; icon?: string; description?: string }>;
  purposes: Array<{ id: string; code: EducationalPurposeCode; label: string; description?: string }>;
  stages: Array<{ id: string; code: LearningStageCode; label: string; description?: string }>;
  badges: QualityBadgeCode[];
  mediaTypes: TaxonomyMediaType[];
  languages: SupportedLanguageCode[];
}

/** Multi-Dimensional Taxonomy Query Parameters */
export interface TaxonomyQueryFilterParams {
  categoryCode?: MasterCategoryCode;
  educationalPurpose?: EducationalPurposeCode;
  learningStage?: LearningStageCode;
  qualityBadge?: QualityBadgeCode;
  mediaType?: TaxonomyMediaType;
  difficulty?: ResourceDifficulty;
  language?: SupportedLanguageCode;
  visibility?: ResourceVisibility;
  status?: ResourceStatus;
  tags?: string[];
  searchQuery?: string;
  sortBy?: 'popularity' | 'views' | 'downloads' | 'rating' | 'created_at';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
