// ============================================================
// SHIKSHA SAHAYAK OS - ENTERPRISE BACKEND ARCHITECTURE TYPES
// ============================================================

/** 6 Master Backend Layers */
export type BackendLayer =
  | 'presentation'
  | 'api_gateway'
  | 'application'
  | 'domain_services'
  | 'repository'
  | 'infrastructure';

/** Backend Service Specification Payload */
export interface BackendServiceSpec {
  serviceName: string;
  layer: BackendLayer;
  domain: string;
  description: string;
  dependencies: string[];
}

/** Repository Specification Payload */
export interface RepositorySpec {
  repositoryName: string;
  tableName: string;
  primaryKey: string;
  supportsTransactions: boolean;
}

/** Query Performance Log Entry */
export interface QueryLogEntry {
  id: string;
  repositoryName: string;
  operation: string;
  executionTimeMs: number;
  rowsAffected: number;
  createdAt: string;
}

/** Master Backend Health Report Payload */
export interface BackendHealthReport {
  timestamp: string;
  status: 'healthy' | 'warning' | 'critical';
  activeLayersCount: number;
  totalServicesCount: number;
  avgQueryExecutionMs: number;
  healthyRepositoriesCount: number;
  architecturalComplianceScore: number; // 0.0 to 100.0%
}

/** Future Backend Event Hook Payload */
export interface BackendEventHookPayload {
  id: string;
  eventType: string;
  payload: Record<string, unknown>;
  status: 'queued' | 'processed' | 'failed';
  createdAt: string;
}

/** Base Repository Generic Interface Spec */
export interface IBaseRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(conditions?: Record<string, unknown>, limit?: number, offset?: number): Promise<T[]>;
  create(entity: Partial<T>): Promise<T>;
  update(id: string, updates: Partial<T>): Promise<boolean>;
  delete(id: string): Promise<boolean>;
}

/** Base Domain Service Generic Interface Spec */
export interface IBaseService<T> {
  getById(id: string): Promise<T | null>;
  list(params?: Record<string, unknown>): Promise<T[]>;
  save(entity: Partial<T>): Promise<T>;
  remove(id: string): Promise<boolean>;
}
