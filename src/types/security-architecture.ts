// ============================================================
// SHIKSHA SAHAYAK OS - ENTERPRISE SECURITY ARCHITECTURE TYPES
// ============================================================

/** 10 Master Security Layers */
export type SecurityLayer =
  | 'infrastructure'
  | 'network'
  | 'application'
  | 'api'
  | 'database'
  | 'storage'
  | 'auth'
  | 'authorization'
  | 'client'
  | 'admin';

/** Security Event Severity */
export type SecuritySeverity = 'info' | 'warning' | 'high' | 'critical';

/** Configurable Security Policy Specification */
export interface SecurityPolicySpec {
  id: string;
  policyKey: string;
  name: string;
  policyValue: Record<string, unknown>;
  isActive: boolean;
  updatedAt: string;
}

/** Rate Limit Rule Specification */
export interface RateLimitRuleSpec {
  id: string;
  endpointPrefix: string;
  maxRequests: number;
  windowSeconds: number;
  isActive: boolean;
  updatedAt: string;
}

/** Security Audit Event Specification */
export interface SecurityAuditEvent {
  id: string;
  userId?: string | null;
  eventSeverity: SecuritySeverity;
  eventType: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  details?: Record<string, unknown> | null;
  createdAt: string;
}

/** HTTP Security Header Specification */
export interface SecurityHeaderSpec {
  contentSecurityPolicy: string;
  strictTransportSecurity: string;
  xFrameOptions: string;
  xContentTypeOptions: string;
  referrerPolicy: string;
  permissionsPolicy: string;
}

/** Security Overview Report Payload */
export interface SecurityOverviewReport {
  timestamp: string;
  totalSecurityLayers: number;
  activePoliciesCount: number;
  activeRateLimitRules: RateLimitRuleSpec[];
  headers: SecurityHeaderSpec;
  recentAuditEvents: SecurityAuditEvent[];
  securityComplianceScore: number; // 0.0 to 100.0%
}
