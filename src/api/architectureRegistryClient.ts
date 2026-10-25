// ============================================================
// SHIKSHA SAHAYAK OS - FRONTEND ARCHITECTURE REGISTRY API CLIENT
// ============================================================

import {
  ArchitectureOverviewPayload,
  ArchitectureHealthReport,
} from "../types/architecture-registry";

/**
 * Fetches the master system architecture overview, layer breakdown, and module catalog.
 */
export async function fetchArchitectureOverview(): Promise<ArchitectureOverviewPayload | null> {
  try {
    const res = await fetch("/api/architecture/modules");
    if (!res.ok) {
      throw new Error(`Failed to fetch architecture overview (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error in ArchitectureRegistryClient.fetchArchitectureOverview:", error);
    return null;
  }
}

/**
 * Fetches system modular integrity and architectural health diagnostics.
 */
export async function fetchArchitectureHealthReport(): Promise<ArchitectureHealthReport | null> {
  try {
    const res = await fetch("/api/architecture/health");
    if (!res.ok) {
      throw new Error(`Failed to fetch architecture health report (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error in ArchitectureRegistryClient.fetchArchitectureHealthReport:", error);
    return null;
  }
}
