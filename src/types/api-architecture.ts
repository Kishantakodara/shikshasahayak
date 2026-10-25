// ============================================================
// SHIKSHA SAHAYAK OS - ENTERPRISE API ARCHITECTURE TYPES
// ============================================================

/** Standardized API Response Pagination Metadata */
export interface ApiPaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore?: boolean;
}

/** Standardized Request System Metadata */
export interface ApiRequestMetadata {
  requestId: string;
  version: string;
  timestamp: string;
  processingTimeMs?: number;
}

/** Standardized Error Detail Payload */
export interface ApiErrorDetail {
  code: string;
  message: string;
  target?: string | null;
  details?: Array<{ field: string; issue: string }> | null;
}

/** Master Standardized API Response Envelope (Uniform across all 22 services) */
export interface ApiResponseEnvelope<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  pagination?: ApiPaginationMetadata | null;
  metadata: ApiRequestMetadata;
  error?: ApiErrorDetail | null;
}

/** Master 22 Service Module Identifiers */
export type ServiceModuleId =
  | 'AuthService'
  | 'UserService'
  | 'StudentProfileService'
  | 'UniversityService'
  | 'DegreeService'
  | 'BranchService'
  | 'SemesterService'
  | 'SubjectService'
  | 'TopicService'
  | 'ContentService'
  | 'AssessmentService'
  | 'QuestionBankService'
  | 'BookmarkService'
  | 'DownloadService'
  | 'LibraryService'
  | 'NotificationService'
  | 'AnalyticsService'
  | 'SearchService'
  | 'RecommendationService'
  | 'SettingsService'
  | 'AdminService'
  | 'GovernanceService';

/** Single Service Module Health Status */
export interface ServiceHealthStatus {
  serviceId: ServiceModuleId;
  serviceName: string;
  status: 'operational' | 'degraded' | 'maintenance' | 'offline';
  endpointPrefix: string;
  latencyMs: number;
  updatedAt: string;
}

/** Single API Endpoint Definition Specification */
export interface ApiEndpointSpec {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  summary: string;
  serviceId: ServiceModuleId;
  version: 'v1' | 'v2';
  authRequired: boolean;
  rolesAllowed: string[];
}

/** Master OpenAPI / JSON API Specification Overview */
export interface MasterApiSpecification {
  title: string;
  version: string;
  description: string;
  totalServices: number;
  totalEndpoints: number;
  services: Array<{
    id: ServiceModuleId;
    name: string;
    description: string;
    basePath: string;
  }>;
  endpoints: ApiEndpointSpec[];
}
