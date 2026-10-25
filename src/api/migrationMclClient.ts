// ============================================================
// SHIKSHA SAHAYAK OS - FRONTEND MIGRATION COMPATIBILITY LAYER API CLIENT
// ============================================================

import {
  MigrationValidationResult,
  MigrationBackfillResponse,
  RollbackResponse,
} from "../types/migration-mcl";

/**
 * Fetches current migration status overview and dashboard metrics.
 */
export async function fetchMigrationStatusOverview(): Promise<{
  timestamp: string;
  currentStage: string;
  totalLegacyDocuments: number;
  migratedDocumentsCount: number;
  pendingMigrationCount: number;
  migrationPercent: number;
  validationResult: MigrationValidationResult;
} | null> {
  try {
    const res = await fetch("/api/mcl/status");
    if (!res.ok) {
      throw new Error(`Failed to fetch migration status (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error in MigrationMclClient.fetchMigrationStatusOverview:", error);
    return null;
  }
}

/**
 * Triggers progressive batch metadata backfilling of legacy resources.
 */
export async function triggerBatchBackfill(
  batchSize = 50
): Promise<MigrationBackfillResponse | null> {
  try {
    const res = await fetch("/api/mcl/backfill", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchSize }),
    });
    if (!res.ok) {
      throw new Error(`Failed to trigger batch backfill (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error in MigrationMclClient.triggerBatchBackfill:", error);
    return null;
  }
}

/**
 * Runs automated validation diagnostics verifying metadata completeness and file asset links.
 */
export async function fetchMigrationValidationResults(): Promise<MigrationValidationResult | null> {
  try {
    const res = await fetch("/api/mcl/validate");
    if (!res.ok) {
      throw new Error(`Failed to fetch validation results (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error in MigrationMclClient.fetchMigrationValidationResults:", error);
    return null;
  }
}

/**
 * Executes a safe, non-destructive rollback for a document ID.
 */
export async function executeSafeRollback(
  documentId: string,
  rollbackReason: string,
  performedBy = "admin"
): Promise<RollbackResponse | null> {
  try {
    const res = await fetch("/api/mcl/rollback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId, rollbackReason, performedBy }),
    });
    if (!res.ok) {
      throw new Error(`Failed to execute safe rollback (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error in MigrationMclClient.executeSafeRollback:", error);
    return null;
  }
}
