// ============================================================
// SHIKSHA SAHAYAK OS - UNIVERSAL METADATA SPECIFICATION TYPES (10 DOMAINS)
// ============================================================

import { LearningResource, ResourceType, ResourceDifficulty, ResourceVisibility, ResourceStatus } from './content-engine';

/** Domain 1: System Information */
export interface SystemInfoDomain {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  shortDescription?: string | null;
  longDescription?: string | null;
  version: string;
  status: ResourceStatus;
  visibility: ResourceVisibility;
  priority: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  approvalStatus: string;
  approvalDate?: string | null;
  approvedBy?: string | null;
  isArchived: boolean;
  isDeleted: boolean;
}

/** Domain 2: Academic Information */
export interface AcademicInfoDomain {
  universityId: string;
  universityName?: string;
  universitySlug?: string;
  degreeId?: string | null;
  degreeName?: string;
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
  learningOutcome?: string | null;
  credits?: number | null;
  academicYear?: string | null;
  curriculumVersion?: string | null;
}

/** Domain 3: Resource Information */
export interface ResourceInfoDomain {
  resourceType: ResourceType;
  resourceFormat: string;
  fileExtension: string;
  fileSizeBytes?: number | null;
  durationSeconds?: number | null;
  pagesCount?: number | null;
  estimatedReadingTimeMins?: number | null;
  estimatedCompletionTimeMins?: number | null;
  language: string;
  thumbnailUrl?: string | null;
  previewImageUrl?: string | null;
  previewText?: string | null;
  coverImageUrl?: string | null;
  author?: string | null;
  publisher?: string | null;
  source?: string | null;
  license: string;
  copyrightInfo?: string | null;
  originalReference?: string | null;
}

/** Domain 4: Learning Information */
export interface LearningInfoDomain {
  difficulty: ResourceDifficulty;
  learningStage: string;
  knowledgeLevel: string;
  learningObjective?: string | null;
  prerequisites: string[];
  recommendedBefore: string[];
  recommendedAfter: string[];
  revisionLevel?: string | null;
  examImportance: 'low' | 'medium' | 'high' | 'critical';
  marksWeightage?: number | null;
  bloomsTaxonomyLevel: 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';
  conceptType: string;
}

/** Domain 5: Assessment Information */
export interface AssessmentInfoDomain {
  questionType?: string | null;
  questionCount?: number | null;
  totalMarks?: number | null;
  negativeMarking?: boolean;
  passingCriteriaPercent?: number | null;
  timeLimitMinutes?: number | null;
  attemptsAllowed?: number | null;
  isRandomized?: boolean;
  evaluationMethod?: string | null;
  assessmentCategory?: string | null;
}

/** Domain 6: Discovery Information */
export interface DiscoveryInfoDomain {
  tags: string[];
  keywords: string[];
  aliases: string[];
  alternativeNames: string[];
  searchWeight: number;
  isFeatured: boolean;
  isTrending: boolean;
  isPopular: boolean;
  isRecommended: boolean;
  isFacultyPick: boolean;
  isStudentFavorite: boolean;
  recentlyUpdated: boolean;
  recentlyAdded: boolean;
  futureAiRecommended: boolean;
}

/** Domain 7: Engagement Information */
export interface EngagementDomain {
  views: number;
  downloads: number;
  bookmarks: number;
  likes: number;
  shares: number;
  completionRatePercent: number;
  averageRating: number;
  reviewCount: number;
  attemptCount: number;
  successRatePercent: number;
  studyTimeSeconds: number;
  repeatVisitsCount: number;
  popularityScore: number;
}

/** Domain 8: Relationships Information */
export interface RelationshipsDomain {
  parentResourceId?: string | null;
  childResourceIds: string[];
  relatedResourceIds: string[];
  alternativeResourceIds: string[];
  prerequisiteResourceIds: string[];
  recommendedResourceIds: string[];
  assessmentMappingIds: string[];
  videoMappingIds: string[];
  flashcardMappingIds: string[];
  bookMappingIds: string[];
  assignmentMappingIds: string[];
  labMappingIds: string[];
  presentationMappingIds: string[];
}

/** Domain 9: Personalization Information */
export interface PersonalizationDomain {
  recommendedBranchId?: string | null;
  recommendedSemester?: number | null;
  recommendedGoal?: string | null;
  recommendedSkill?: string | null;
  recommendedInterest?: string | null;
  requiredProfileRole?: string | null;
  visibilityRules: string[];
  notificationRules: string[];
  dashboardPriority: number;
  widgetMapping: string[];
  futureRecommendationScore: number;
}

/** Domain 10: Search Information */
export interface SearchDomain {
  searchIndexTokens: string[];
  searchKeywords: string[];
  searchFilters: Record<string, unknown>;
  autocompleteTerms: string[];
  synonyms: string[];
  rankingWeight: number;
  searchCategory: string;
  searchBoost: number;
  languageTokens: string[];
}

/** Master Universal Metadata Object uniting all 10 domains */
export interface UniversalMetadataObject {
  system: SystemInfoDomain;
  academic: AcademicInfoDomain;
  resource: ResourceInfoDomain;
  learning: LearningInfoDomain;
  assessment: AssessmentInfoDomain;
  discovery: DiscoveryInfoDomain;
  engagement: EngagementDomain;
  relationships: RelationshipsDomain;
  personalization: PersonalizationDomain;
  search: SearchDomain;
}

/** Multi-Domain Metadata Query Parameters */
export interface UniversalMetadataQueryParams {
  universityId?: string;
  branchId?: string;
  semester?: number;
  subjectId?: string;
  unitNo?: number;
  resourceType?: ResourceType;
  difficulty?: ResourceDifficulty;
  isFeatured?: boolean;
  isTrending?: boolean;
  isPopular?: boolean;
  isFacultyPick?: boolean;
  examImportance?: 'low' | 'medium' | 'high' | 'critical';
  query?: string;
  tags?: string[];
  page?: number;
  limit?: number;
}
