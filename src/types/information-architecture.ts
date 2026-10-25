// ============================================================
// SHIKSHA SAHAYAK OS - MASTER INFORMATION ARCHITECTURE (12 LEVELS)
// ============================================================

import { LearningResource, ResourceType } from './content-engine';

/** Level 1: Platform Entity */
export interface PlatformNode {
  id: string;
  name: string;
  domain: string;
  description?: string;
  config?: Record<string, unknown>;
}

/** Level 2: University Entity */
export interface UniversityNode {
  id: string;
  name: string;
  slug: string;
  shortName?: string;
}

/** Level 3: Degree Entity */
export interface DegreeNode {
  id: string;
  universityId: string;
  name: string;
  slug: string;
  shortName?: string;
}

/** Level 4: Department / Branch Entity */
export interface BranchNode {
  id: string;
  universityId: string;
  name: string;
  slug: string;
  shortName?: string;
}

/** Level 5: Semester Entity */
export interface SemesterNode {
  id: string;
  universityId: string;
  degreeId?: string;
  branchId: string;
  semesterNo: number;
  academicYear?: string;
  creditHours?: number;
  status: 'active' | 'inactive' | 'archived';
}

/** Level 6: Subject Entity */
export interface SubjectNode {
  id: string;
  universityId: string;
  branchId: string;
  semester: number;
  name: string;
  code?: string;
  slug: string;
  creditHours?: number;
  theoryHours?: number;
  practicalHours?: number;
  description?: string;
}

/** Level 7: Unit Entity */
export interface UnitNode {
  id: string;
  subjectId: string;
  unitNo: number;
  title: string;
  description?: string;
  recommendedHours?: number;
  weightagePercent?: number;
}

/** Level 8: Topic Entity */
export interface TopicNode {
  id: string;
  unitId: string;
  topicNo?: number;
  title: string;
  description?: string;
}

/** Level 9: SubTopic Entity */
export interface SubTopicNode {
  id: string;
  topicId: string;
  subTopicNo?: number;
  title: string;
  description?: string;
}

/** Level 10: Learning Resource (Imported & Re-exported) */
export type LearningResourceNode = LearningResource;

/** Level 11: Assessment Entity */
export interface AssessmentNode {
  id: string;
  resourceId?: string;
  subjectId: string;
  unitId?: string;
  topicId?: string;
  title: string;
  type: 'quiz' | 'mock_test' | 'practice_test' | 'pyq_test' | 'subject_test' | 'topic_test' | 'revision_test' | 'adaptive_test';
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  totalMarks: number;
  durationMinutes?: number;
  passMarks?: number;
}

/** Level 12: Student Progress Entity */
export interface StudentProgressNode {
  id: string;
  studentId: string;
  resourceId?: string;
  subjectId: string;
  unitId?: string;
  topicId?: string;
  status: 'not_started' | 'reading' | 'completed' | 'bookmarked' | 'downloaded' | 'attempted' | 'mastered';
  completionPercent: number;
  lastPositionSecs?: number;
  viewsCount: number;
  lastAccessedAt: string;
}

/** Content Graph Relationship Types */
export type RelationshipType =
  | 'previous'
  | 'next'
  | 'prerequisite'
  | 'recommended'
  | 'alternative'
  | 'advanced'
  | 'supplementary';

/** Content Graph Edge Model */
export interface ContentRelationshipEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relationshipType: RelationshipType;
  weight: number;
  targetResource?: LearningResourceNode;
}

/** Visibility & Permission Levels */
export type IAVisibilityLevel =
  | 'public'
  | 'registered'
  | 'branch_specific'
  | 'semester_specific'
  | 'teacher_only'
  | 'admin_only'
  | 'private'
  | 'draft'
  | 'archived';

/** Full 12-Level Hierarchy Breadcrumb Trail */
export interface MasterHierarchyBreadcrumb {
  platform: PlatformNode;
  university?: UniversityNode;
  degree?: DegreeNode;
  branch?: BranchNode;
  semester?: number;
  subject?: SubjectNode;
  unit?: UnitNode;
  topic?: TopicNode;
  subTopic?: SubTopicNode;
  resource?: LearningResourceNode;
}

/** Explore Mode Complete Tree Structure */
export interface ExploreModeTree {
  universities: Array<
    UniversityNode & {
      degrees: Array<
        DegreeNode & {
          branches: Array<
            BranchNode & {
              semesters: Array<{
                semesterNo: number;
                subjectsCount: number;
                resourcesCount: number;
              }>;
            }
          >;
        }
      >;
    }
  >;
}

/** Universal Multi-Level Search Query Architecture */
export interface UniversalIASearchParams {
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
  tags?: string[];
  difficulty?: string;
  language?: string;
  visibility?: IAVisibilityLevel;
  query?: string;
  page?: number;
  limit?: number;
}

/** Discovery Feed Query Channels */
export type DiscoveryChannel =
  | 'browse'
  | 'search'
  | 'recommendations'
  | 'continue_learning'
  | 'bookmarks'
  | 'recent_activity'
  | 'popular'
  | 'recently_uploaded'
  | 'trending'
  | 'faculty_recommended';
