// ============================================================
// SHIKSHA SAHAYAK OS - CONTENT LIFECYCLE & GOVERNANCE TYPES
// ============================================================

/** 11 Content Lifecycle States */
export type LifecycleState =
  | 'draft'
  | 'submitted_for_review'
  | 'under_review'
  | 'changes_requested'
  | 'approved'
  | 'published'
  | 'updated'
  | 'archived'
  | 'restored'
  | 'soft_deleted'
  | 'permanently_deleted';

/** Content Ownership Types */
export type OwnerType =
  | 'platform_admin'
  | 'faculty'
  | 'verified_teacher'
  | 'moderator'
  | 'student_contributor'
  | 'ai_generated'
  | 'imported_content'
  | 'system_generated';

/** Content Source Attribution */
export type ContentSource =
  | 'faculty_upload'
  | 'student_upload'
  | 'official_gtu'
  | 'publisher'
  | 'open_educational_resource'
  | 'public_domain'
  | 'internal_team'
  | 'partner_institute'
  | 'api_import';

/** Content Quality Levels */
export type QualityLevel =
  | 'unverified'
  | 'community_verified'
  | 'faculty_verified'
  | 'official'
  | 'premium_quality'
  | 'deprecated'
  | 'archived';

/** Immutable Audit Log Actions */
export type AuditAction =
  | 'created'
  | 'updated'
  | 'reviewed'
  | 'submitted'
  | 'changes_requested'
  | 'approved'
  | 'published'
  | 'archived'
  | 'soft_deleted'
  | 'restored'
  | 'permanently_deleted'
  | 'metadata_updated'
  | 'visibility_changed'
  | 'approval_changed';

/** Master Governance Entity Model */
export interface ContentGovernanceItem {
  documentId: string;
  lifecycleState: LifecycleState;
  ownerType: OwnerType;
  ownerId?: string | null;
  contentSource: ContentSource;
  qualityLevel: QualityLevel;
  curriculumYear?: number | null;
  effectiveFrom?: string | null;
  effectiveUntil?: string | null;
  displayName: string;
  license: string;
  copyrightHolder?: string | null;
  attributionNotes?: string | null;
  isSoftDeleted: boolean;
  softDeletedAt?: string | null;
  softDeletedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Immutable Content Audit Log Entry */
export interface ContentAuditLog {
  id: string;
  documentId: string;
  action: AuditAction;
  performedBy: string;
  previousState?: string | null;
  newState?: string | null;
  details?: Record<string, unknown> | null;
  createdAt: string;
}

/** Mandatory Metadata Validation Result */
export interface MetadataValidationResult {
  isValid: boolean;
  missingFields: string[];
  warnings: string[];
  errors: string[];
}

/** Duplicate Detection Check Result */
export interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicateDocumentId?: string | null;
  duplicateTitle?: string | null;
  matchScore: number;
  reason?: string | null;
}

/** Administrative Content Health Monitoring Report */
export interface ContentHealthReport {
  timestamp: string;
  totalResources: number;
  publishedCount: number;
  draftCount: number;
  archivedCount: number;
  softDeletedCount: number;
  deprecatedCount: number;
  orphanResourcesCount: number; // Resources missing subject/topic
  missingMetadataCount: number;
  duplicateCandidatesCount: number;
  brokenRelationshipsCount: number;
  healthScore: number; // 0.0 to 100.0%
}
