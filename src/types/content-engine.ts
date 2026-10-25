// ============================================================
// SHIKSHA SAHAYAK OS - CONTENT ENGINE TYPES & DOMAIN MODELS
// ============================================================

/** Supported 27 Learning Resource Types in ShikshaSahayak OS */
export type ResourceType =
  | 'notes'
  | 'pyq'
  | 'question_bank'
  | 'book'
  | 'reference_book'
  | 'formula_sheet'
  | 'assignment'
  | 'lab_manual'
  | 'practical'
  | 'mini_project'
  | 'major_project'
  | 'ppt'
  | 'cheat_sheet'
  | 'research_paper'
  | 'blog'
  | 'article'
  | 'video'
  | 'recorded_lecture'
  | 'animation'
  | 'infographic'
  | 'mock_test'
  | 'quiz'
  | 'flashcard'
  | 'code_example'
  | 'software_tool'
  | 'external_reference'
  | 'other';

/** Resource Difficulty Classification */
export type ResourceDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

/** Access Visibility Constraints */
export type ResourceVisibility = 'public' | 'private' | 'unlisted' | 'restricted';

/** Resource Approval / Publication Status */
export type ResourceStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'archived';

/** Relation Types Between Resources */
export type ResourceRelationType = 'related' | 'prerequisite' | 'next' | 'supplementary';

/** Primary Learning Resource Object (Metadata-Driven Content Engine Core Model) */
export interface LearningResource {
  // Identity & Core Descriptive Metadata
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;

  // Universal Academic Hierarchy Metadata
  universityId: string;
  universityName?: string;
  universitySlug?: string;

  degreeId?: string | null;
  degreeName?: string;
  degreeSlug?: string;

  branchId: string;
  branchName?: string;
  branchSlug?: string;

  semester: number;

  subjectId: string;
  subjectName?: string;
  subjectCode?: string;
  subjectSlug?: string;

  unitId?: string | null;
  unitNo?: number | null;
  unitTitle?: string | null;

  topicId?: string | null;
  topicNo?: number | null;
  topicTitle?: string | null;
  subTopic?: string | null;

  // Content Engine Classification Metadata
  resourceType: ResourceType;
  difficulty?: ResourceDifficulty | null;
  language: string;
  tags: string[];
  keywords: string[];
  visibility: ResourceVisibility;
  version: string;
  status: ResourceStatus;

  // Provenance & Ownership
  author?: string | null;
  uploadedBy?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;

  // Asset & Storage Links
  fileUrl?: string | null;
  storageKey?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  originalFilename?: string | null;
  thumbnailUrl?: string | null;
  previewUrl?: string | null;

  // Engagement & Performance Metrics
  estimatedReadingTimeMinutes?: number | null;
  views: number;
  downloads: number;
  likes: number;
  bookmarks: number;
  ratingAvg: number;
  ratingCount: number;

  // Graph / Relationship References
  prerequisiteIds: string[];
  recommendedNextId?: string | null;
  relatedResourceIds: string[];
}

/** Degree Program Entity */
export interface Degree {
  id: string;
  universityId: string;
  name: string;
  slug: string;
  shortName?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Subject Unit Entity */
export interface SubjectUnit {
  id: string;
  subjectId: string;
  unitNo: number;
  title: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  topics?: SubjectTopic[];
}

/** Subject Topic Entity */
export interface SubjectTopic {
  id: string;
  unitId: string;
  topicNo?: number | null;
  title: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Content Hierarchy Tree Node */
export interface ContentHierarchyNode {
  id: string;
  name: string;
  type: 'university' | 'degree' | 'branch' | 'semester' | 'subject' | 'unit' | 'topic';
  slug?: string;
  code?: string;
  unitNo?: number;
  topicNo?: number;
  childrenCount?: number;
  children?: ContentHierarchyNode[];
}

/** Resource Filtering & Search Query Parameters */
export interface ResourceFilterQuery {
  universityId?: string;
  degreeId?: string;
  branchId?: string;
  branchSlug?: string;
  semester?: number;
  subjectId?: string;
  subjectSlug?: string;
  unitId?: string;
  unitNo?: number;
  topicId?: string;
  resourceType?: ResourceType | ResourceType[];
  difficulty?: ResourceDifficulty;
  language?: string;
  visibility?: ResourceVisibility;
  status?: ResourceStatus;
  searchQuery?: string;
  tags?: string[];
  sortBy?: 'created_at' | 'updated_at' | 'views' | 'downloads' | 'rating' | 'title';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/** Paginated Response Wrapper for Learning Resources */
export interface PaginatedResourceResponse {
  resources: LearningResource[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Dynamic Resource Type Configuration & Label Info */
export interface ResourceTypeConfig {
  type: ResourceType;
  label: string;
  category: 'text' | 'assessment' | 'multimedia' | 'project' | 'code' | 'interactive' | 'other';
  description: string;
  iconName: string;
}
