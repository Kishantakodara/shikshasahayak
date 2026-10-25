// ============================================================
// SHIKSHA SAHAYAK OS - FRONTEND ARCHITECTURE API CLIENT
// ============================================================

import {
  FrontendModuleSpec,
  FrontendHealthReport,
  FrontendLayoutType,
} from "../types/frontend-architecture";

/**
 * Fetches feature module catalog and layout breakdown.
 */
export async function fetchFrontendArchitectureOverview(): Promise<{
  title: string;
  version: string;
  totalLayouts: number;
  totalFeatureModules: number;
  layouts: Array<{ type: FrontendLayoutType; description: string }>;
  modules: FrontendModuleSpec[];
} | null> {
  try {
    const res = await fetch("/api/frontend/modules");
    if (!res.ok) {
      throw new Error(`Failed to fetch frontend architecture overview (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error in FrontendArchitectureClient.fetchFrontendArchitectureOverview:", error);
    return null;
  }
}

/**
 * Fetches frontend modular health diagnostics and component telemetry.
 */
export async function fetchFrontendHealthReport(): Promise<FrontendHealthReport | null> {
  try {
    const res = await fetch("/api/frontend/health");
    if (!res.ok) {
      throw new Error(`Failed to fetch frontend health report (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error in FrontendArchitectureClient.fetchFrontendHealthReport:", error);
    return null;
  }
}
