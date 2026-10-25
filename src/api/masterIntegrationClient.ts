// ============================================================
// SHIKSHA SAHAYAK OS - FRONTEND MASTER INTEGRATION API CLIENT
// ============================================================

import {
  MasterBlueprintReport,
  MasterDependencyNode,
} from "../types/master-integration";

/**
 * Fetches Master Blueprint Overview Report, 10-stage execution milestones, and readiness scores.
 */
export async function fetchMasterBlueprintReport(): Promise<MasterBlueprintReport | null> {
  try {
    const res = await fetch("/api/blueprint/status");
    if (!res.ok) {
      throw new Error(`Failed to fetch master blueprint report (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error in MasterIntegrationClient.fetchMasterBlueprintReport:", error);
    return null;
  }
}

/**
 * Fetches the Master Dependency Graph (DAG) for Phase 1 architecture modules.
 */
export async function fetchMasterDependencyGraph(): Promise<MasterDependencyNode[]> {
  try {
    const res = await fetch("/api/blueprint/dag");
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error in MasterIntegrationClient.fetchMasterDependencyGraph:", error);
    return [];
  }
}
