// ============================================================
// SHIKSHA SAHAYAK OS - ENTERPRISE SEARCH & DISCOVERY TYPES
// ============================================================

import { ResourceType, ResourceDifficulty } from './content-engine';

/** Search Mode Contexts */
export type SearchMode =
  | 'global'
  | 'subject'
  | 'topic'
  | 'library'
  | 'assessment'
  | 'teacher'
  | 'admin'
  | 'bookmark';

/** Search Filter Parameters */
export interface SearchFilterParams {
  universityId?: string;
  degreeId?: string;
  branchId?: string;
  semester?: number;
  subjectId?: string;
  unitNo?: number;
  topicId?: string;
  resourceType?: ResourceType;
  difficulty?: ResourceDifficulty;
  language?: string;
  isFeatured?: boolean;
  isTrending?: boolean;
  isPopular?: boolean;
  isFacultyPick?: boolean;
  examImportance?: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
  scope?: 'personalized' | 'global_platform';
}

/** Master Search Query Request */
export interface SearchQueryRequest {
  query: string;
  mode?: SearchMode;
  filters?: SearchFilterParams;
  page?: number;
  limit?: number;
  sortBy?: 'relevance' | 'popularity' | 'recent' | 'rating' | 'downloads';
  sortOrder?: 'asc' | 'desc';
  studentProfile?: {
    universityId?: string;
    branchId?: string;
    semester?: number;
  };
}

/** Standardized Search Result Card Payload */
export interface SearchResultCard {
  id: string;
  title: string;
  displayName: string;
  resourceType: ResourceType;
  universityName?: string;
  degreeName?: string;
  branchName?: string;
  semester?: number;
  subjectName?: string;
  subjectCode?: string;
  unitNo?: number;
  topicTitle?: string;
  shortDescription?: string | null;
  tags: string[];
  difficulty?: ResourceDifficulty;
  language: string;
  ratingAvg: number;
  downloadCount: number;
  viewCount: number;
  estimatedReadingTimeMins?: number | null;
  fileSizeBytes?: number | null;
  downloadUrl?: string;
  relevanceScore: number;
  isFacultyPick: boolean;
  isStudentFavorite: boolean;
}

/** Search Facet Aggregation Counts */
export interface SearchFacetsResult {
  resourceTypeCounts: Record<string, number>;
  branchCounts: Record<string, number>;
  semesterCounts: Record<number, number>;
  difficultyCounts: Record<string, number>;
  subjectCounts: Record<string, number>;
  totalMatchingDocs: number;
}

/** Autocomplete & Live Suggestion Item */
export interface SearchSuggestionResult {
  term: string;
  type: 'query' | 'subject' | 'topic' | 'resource' | 'tag' | 'abbreviation';
  displayText: string;
  contextInfo?: string;
  targetUrl?: string;
}

/** Zero-Result Recovery & Intelligent Suggestion Payload */
export interface ZeroResultFallbackPayload {
  originalQuery: string;
  normalizedQuery: string;
  suggestedSpelling?: string | null;
  suggestedSubjects: Array<{ id: string; name: string; code: string }>;
  suggestedBroaderKeywords: string[];
  trendingResources: SearchResultCard[];
}

/** Personalized Discovery Feed Payload */
export interface DiscoveryFeedPayload {
  continueLearningQueue: SearchResultCard[];
  recommendedNextSteps: SearchResultCard[];
  trendingMaterials: SearchResultCard[];
  facultyPicks: SearchResultCard[];
  popularSubjects: Array<{ id: string; name: string; resourceCount: number }>;
}

/** Master Search Response Payload */
export interface SearchResponsePayload {
  query: string;
  normalizedQuery: string;
  mode: SearchMode;
  results: SearchResultCard[];
  facets: SearchFacetsResult;
  totalResults: number;
  page: number;
  limit: number;
  totalPages: number;
  fallback?: ZeroResultFallbackPayload | null;
}
