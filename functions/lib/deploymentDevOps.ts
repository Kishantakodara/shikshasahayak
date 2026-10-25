// ============================================================
// SHIKSHA SAHAYAK OS - DEPLOYMENT & DEVOPS EDGE SERVICE
// ============================================================

import {
  DevOpsOverviewReport,
  DeploymentRecordSpec,
  FeatureFlagSpec,
  EnvironmentType,
  DeploymentStatus,
} from "../../src/types/deployment-devops";
import { Env } from "./contentEngine";

/**
 * Hydrates active release version, deployment history, and runtime feature flags.
 */
export async function getDevOpsOverviewReport(env: Env): Promise<DevOpsOverviewReport> {
  try {
    const { results: depRows } = await env.DB.prepare(
      `SELECT id, release_version, environment, commit_hash, deployed_by, status, health_score, created_at
       FROM deployment_history
       ORDER BY created_at DESC
       LIMIT 10`
    ).all<Record<string, unknown>>();

    const { results: flagRows } = await env.DB.prepare(
      `SELECT id, flag_key, name, description, is_enabled, rollout_percentage, updated_at
       FROM feature_flags
       ORDER BY name`
    ).all<Record<string, unknown>>();

    const deployments: DeploymentRecordSpec[] = (depRows || []).map((row) => ({
      id: String(row.id),
      releaseVersion: String(row.release_version),
      environment: String(row.environment) as EnvironmentType,
      commitHash: String(row.commit_hash),
      deployedBy: String(row.deployed_by),
      status: String(row.status) as DeploymentStatus,
      healthScore: Number(row.health_score),
      createdAt: String(row.created_at),
    }));

    const featureFlags: FeatureFlagSpec[] = (flagRows || []).map((row) => ({
      id: String(row.id),
      flagKey: String(row.flag_key),
      name: String(row.name),
      description: row.description ? String(row.description) : null,
      isEnabled: Boolean(row.is_enabled),
      rolloutPercentage: Number(row.rollout_percentage),
      updatedAt: String(row.updated_at),
    }));

    const lastDeployment = deployments.length > 0 ? deployments[0] : null;

    return {
      timestamp: new Date().toISOString(),
      activeReleaseVersion: lastDeployment ? lastDeployment.releaseVersion : "2026.1.0",
      currentEnvironment: "production",
      totalDeploymentsCount: deployments.length,
      lastDeployment,
      featureFlags,
      systemHealthScore: lastDeployment ? lastDeployment.healthScore : 100.0,
    };
  } catch (error) {
    console.error("Error in getDevOpsOverviewReport:", error);
    return {
      timestamp: new Date().toISOString(),
      activeReleaseVersion: "2026.1.0",
      currentEnvironment: "production",
      totalDeploymentsCount: 1,
      lastDeployment: null,
      featureFlags: [],
      systemHealthScore: 100.0,
    };
  }
}

/**
 * Toggles a runtime feature flag in D1 database.
 */
export async function toggleFeatureFlag(
  env: Env,
  flagKey: string,
  isEnabled: boolean
): Promise<boolean> {
  try {
    await env.DB.prepare(
      `UPDATE feature_flags
       SET is_enabled = ?, updated_at = CURRENT_TIMESTAMP
       WHERE flag_key = ?`
    )
      .bind(isEnabled ? 1 : 0, flagKey)
      .run();

    return true;
  } catch (error) {
    console.error("Error in toggleFeatureFlag:", error);
    return false;
  }
}
