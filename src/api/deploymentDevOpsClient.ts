// ============================================================
// SHIKSHA SAHAYAK OS - FRONTEND DEPLOYMENT & DEVOPS API CLIENT
// ============================================================

import {
  DevOpsOverviewReport,
  FeatureFlagSpec,
} from "../types/deployment-devops";

/**
 * Fetches DevOps overview report, release version, and active deployment status.
 */
export async function fetchDevOpsOverviewReport(): Promise<DevOpsOverviewReport | null> {
  try {
    const res = await fetch("/api/deployment/status");
    if (!res.ok) {
      throw new Error(`Failed to fetch DevOps overview report (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error in DeploymentDevOpsClient.fetchDevOpsOverviewReport:", error);
    return null;
  }
}

/**
 * Fetches runtime feature flags and active rollout status.
 */
export async function fetchActiveFeatureFlags(): Promise<FeatureFlagSpec[]> {
  try {
    const res = await fetch("/api/deployment/feature-flags");
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error in DeploymentDevOpsClient.fetchActiveFeatureFlags:", error);
    return [];
  }
}

/**
 * Toggles a runtime feature flag or emergency kill-switch.
 */
export async function toggleRuntimeFeatureFlag(
  flagKey: string,
  isEnabled: boolean
): Promise<boolean> {
  try {
    const res = await fetch("/api/deployment/feature-flags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flagKey, isEnabled }),
    });
    return res.ok;
  } catch (error) {
    console.error("Error in DeploymentDevOpsClient.toggleRuntimeFeatureFlag:", error);
    return false;
  }
}
