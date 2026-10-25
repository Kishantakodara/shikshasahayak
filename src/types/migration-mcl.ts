// ============================================================
// SHIKSHA SAHAYAK OS - ENTERPRISE MIGRATION STRATEGY & MCL TYPES
// ============================================================

import { LearningResource } from './content-engine';
import { UniversalMetadataObject } from './universal-metadata';

/** 10 Incremental Migration Stages */
export type MigrationStage =
  | 'inventory'
  | 'analysis'
  | 'extraction'
  | 'metadata_creation'
  | 'validation'
  | 'ia_linking'
  | 'mcl_adapter'
  | 'progressive_backfill'
  | 'production_monitoring'
  | 'deprecation_ready';

/** Supported Legacy Database Source Tables */
export type LegacyResourceSource =
  | 'documents'
  | 'study_material_details'
  | 'pyq_details'
  | 'syllabus_details'
  | 'file_assets';

/** Migration Status States */
export type MigrationStatus =
  | 'unmapped'
  | 'mapped'
  | 'metadata_populated'
  | 'validated'
  | 'failed'
  | 'rolled_back';

/** Single Migration Job Log Record */
export interface MigrationJobLog {
  id: string;
  stageName: MigrationStage;
  totalItems: number;
  migratedItems: number;
  failedItems: number;
  status: 'running' | 'completed' | 'failed' | 'rolled_back';
  startedAt: string;
  completedAt?: string | null;
}

/** Bi-directional Legacy Resource Mapping Entity */
export interface LegacyResourceMapping {
  id: string;
  legacySourceTable: LegacyResourceSource;
  legacySourceId: string;
  newDocumentId: string;
  migrationStatus: MigrationStatus;
  migratedAt: string;
}

/** Automated Migration Validation Result */
export interface MigrationValidationResult {
  isValid: boolean;
  totalChecked: number;
  validCount: number;
  invalidCount: number;
  errors: Array<{
    legacyId: string;
    errorCode: string;
    errorMessage: string;
  }>;
}

/** Batch Backfill Trigger Request */
export interface MigrationBackfillRequest {
  batchSize?: number;
  targetStage?: MigrationStage;
  forceOverwrite?: boolean;
}

/** Batch Backfill Response Payload */
export interface MigrationBackfillResponse {
  jobId: string;
  stageName: MigrationStage;
  totalProcessed: number;
  successfullyMigrated: number;
  failedCount: number;
  completed: boolean;
}

/** Safe Rollback Request Payload */
export interface RollbackRequest {
  documentId?: string;
  jobId?: string;
  rollbackReason: string;
  performedBy: string;
}

/** Safe Rollback Response Payload */
export interface RollbackResponse {
  success: boolean;
  rollbackCount: number;
  message: string;
}

/**
 * Migration Compatibility Layer (MCL) Adapter Interface.
 * Translates legacy database schemas into modern ShikshaSahayak OS entities.
 */
export interface IMigrationCompatibilityAdapter {
  adaptLegacyDocumentToLearningResource(legacyRow: Record<string, unknown>): LearningResource;
  adaptLegacyDocumentToUniversalMetadata(legacyRow: Record<string, unknown>): UniversalMetadataObject;
  mapLegacyRouteToMetadataQuery(routePath: string): Record<string, unknown>;
}
