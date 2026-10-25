// ============================================================
// SHIKSHA SAHAYAK OS - FRONTEND CONTENT GOVERNANCE API CLIENT
// ============================================================

import {
  ContentGovernanceItem,
  ContentAuditLog,
  LifecycleState,
  MetadataValidationResult,
  DuplicateCheckResult,
  ContentHealthReport,
} from "../types/content-governance";

/**
 * Fetches content governance metadata for a specific document ID.
 */
export async function fetchContentGovernance(
  documentId: string
): Promise<ContentGovernanceItem | null> {
  try {
    const res = await fetch(`/api/governance/item/${encodeURIComponent(documentId)}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch governance metadata (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error in GovernanceClient.fetchContentGovernance:", error);
    return null;
  }
}

/**
 * Updates lifecycle state and records immutable audit log.
 */
export async function updateLifecycleState(
  documentId: string,
  newState: LifecycleState,
  performedBy: string,
  details?: Record<string, unknown>
): Promise<ContentGovernanceItem | null> {
  try {
    const res = await fetch(`/api/governance/item/${encodeURIComponent(documentId)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newState, performedBy, details }),
    });
    if (!res.ok) {
      throw new Error(`Failed to update lifecycle state (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error in GovernanceClient.updateLifecycleState:", error);
    return null;
  }
}

/**
 * Validates mandatory metadata and checks duplicate content before publishing.
 */
export async function validateContentMetadata(payload: Record<string, unknown>): Promise<{
  validation: MetadataValidationResult;
  duplicates: DuplicateCheckResult;
  suggestedDisplayName: string;
  readyToPublish: boolean;
}> {
  try {
    const res = await fetch("/api/governance/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`Failed to validate metadata (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error in GovernanceClient.validateContentMetadata:", error);
    return {
      validation: { isValid: false, missingFields: [], warnings: [], errors: ["Validation request failed"] },
      duplicates: { isDuplicate: false, matchScore: 0 },
      suggestedDisplayName: "Document Resource",
      readyToPublish: false,
    };
  }
}

/**
 * Fetches immutable audit trail logs for a document ID.
 */
export async function fetchContentAuditLogs(
  documentId: string
): Promise<ContentAuditLog[]> {
  try {
    const res = await fetch(`/api/governance/audit/${encodeURIComponent(documentId)}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error in GovernanceClient.fetchContentAuditLogs:", error);
    return [];
  }
}

/**
 * Fetches administrative content health monitoring report.
 */
export async function fetchContentHealthReport(): Promise<ContentHealthReport | null> {
  try {
    const res = await fetch("/api/governance/health");
    if (!res.ok) {
      throw new Error(`Failed to fetch health report (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error in GovernanceClient.fetchContentHealthReport:", error);
    return null;
  }
}
