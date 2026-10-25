// ============================================================
// SHIKSHA SAHAYAK OS - DEPLOYMENT, DEVOPS & CI/CD TYPES
// ============================================================

/** Supported Environment Types */
export type EnvironmentType =
  | 'local'
  | 'testing'
  | 'staging'
  | 'production'
  | 'preview';

/** Deployment Execution Statuses */
export type DeploymentStatus =
  | 'pending'
  | 'deploying'
  | 'success'
  | 'failed'
  | 'rolled_back';

/** Deployment History Record */
export interface DeploymentRecordSpec {
  id: string;
  releaseVersion: string;
  environment: EnvironmentType;
  commitHash: string;
  deployedBy: string;
  status: DeploymentStatus;
  healthScore: number; // 0.0 to 100.0%
  createdAt: string;
}

/** Configurable Runtime Feature Flag Specification */
export interface FeatureFlagSpec {
  id: string;
  flagKey: string;
  name: string;
  description?: string | null;
  isEnabled: boolean;
  rolloutPercentage: number; // 0 to 100%
  updatedAt: string;
}

/** Environment Configuration Specification */
export interface EnvironmentConfigSpec {
  id: string;
  environmentName: string;
  configKey: string;
  configValue: string;
  isSensitive: boolean;
  updatedAt: string;
}

/** DevOps System Overview Report Payload */
export interface DevOpsOverviewReport {
  timestamp: string;
  activeReleaseVersion: string;
  currentEnvironment: EnvironmentType;
  totalDeploymentsCount: number;
  lastDeployment: DeploymentRecordSpec | null;
  featureFlags: FeatureFlagSpec[];
  systemHealthScore: number; // 0.0 to 100.0%
}
