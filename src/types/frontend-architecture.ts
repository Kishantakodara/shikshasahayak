// ============================================================
// SHIKSHA SAHAYAK OS - ENTERPRISE FRONTEND ARCHITECTURE TYPES
// ============================================================

/** Master Layout Shell Types */
export type FrontendLayoutType =
  | 'public'
  | 'dashboard'
  | 'teacher'
  | 'admin'
  | 'auth'
  | 'landing';

/** Master Feature Module Keys */
export type FrontendFeatureModuleKey =
  | 'content'
  | 'ia'
  | 'taxonomy'
  | 'governance'
  | 'metadata'
  | 'database'
  | 'api'
  | 'search'
  | 'storage'
  | 'mcl'
  | 'architecture'
  | 'backend'
  | 'edr'
  | 'frontend';

/** Frontend Feature Module Specification */
export interface FrontendModuleSpec {
  id: string;
  moduleKey: FrontendFeatureModuleKey;
  name: string;
  routePrefix: string;
  layoutType: FrontendLayoutType;
  version: string;
  status: 'active' | 'deprecated' | 'experimental';
  createdAt: string;
}

/** Shared UI Component Specification */
export interface SharedComponentSpec {
  id: string;
  componentName: string;
  category: 'buttons' | 'inputs' | 'cards' | 'dialogs' | 'tables' | 'navigation' | 'feedback' | 'charts';
  isAccessible: boolean;
  createdAt: string;
}

/** Client Error Telemetry Event */
export interface ClientErrorTelemetry {
  id: string;
  componentStack: string;
  errorMessage: string;
  userAgent?: string | null;
  routePath: string;
  createdAt: string;
}

/** Frontend Architecture Health Report */
export interface FrontendHealthReport {
  timestamp: string;
  status: 'healthy' | 'warning' | 'critical';
  totalFeatureModulesCount: number;
  activeLayoutsCount: number;
  sharedComponentsCount: number;
  unhandledErrorRate: number; // 0.0 to 100.0%
  architecturalComplianceScore: number; // 0.0 to 100.0%
}
