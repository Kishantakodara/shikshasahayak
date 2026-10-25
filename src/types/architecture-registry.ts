// ============================================================
// SHIKSHA SAHAYAK OS - ENTERPRISE MONOREPO & MODULAR ARCHITECTURE TYPES
// ============================================================

/** 10 Master Architectural Layers */
export type ArchitectureLayer =
  | 'applications'
  | 'domain_services'
  | 'shared_core'
  | 'shared_ui'
  | 'types'
  | 'infrastructure'
  | 'database'
  | 'config'
  | 'scripts'
  | 'docs';

/** Business Domain Categories */
export type DomainCategory =
  | 'content'
  | 'assessment'
  | 'user'
  | 'academic'
  | 'search'
  | 'notification'
  | 'library'
  | 'progress'
  | 'governance'
  | 'storage'
  | 'system';

/** System Module Specification */
export interface SystemModuleSpec {
  id: string;
  moduleKey: string;
  name: string;
  layer: ArchitectureLayer;
  domain: DomainCategory;
  description?: string | null;
  version: string;
  status: 'active' | 'deprecated' | 'experimental';
  createdAt: string;
}

/** Dependency Relation Specification */
export interface DependencyRelationSpec {
  id: string;
  sourceModuleKey: string;
  targetModuleKey: string;
  dependencyType: 'import' | 'api_call' | 'db_foreign_key' | 'event';
  createdAt: string;
}

/** System Architecture Overview Payload */
export interface ArchitectureOverviewPayload {
  title: string;
  version: string;
  totalLayers: number;
  totalModules: number;
  totalDependencies: number;
  layers: Array<{
    name: ArchitectureLayer;
    description: string;
    modulesCount: number;
  }>;
  modules: SystemModuleSpec[];
  dependencies: DependencyRelationSpec[];
}

/** System Modular Health Report */
export interface ArchitectureHealthReport {
  timestamp: string;
  status: 'healthy' | 'warning' | 'critical';
  activeModulesCount: number;
  deprecatedModulesCount: number;
  circularDependenciesCount: number;
  architecturalComplianceScore: number; // 0.0 to 100.0%
}
