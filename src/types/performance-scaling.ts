// ============================================================
// SHIKSHA SAHAYAK OS - PERFORMANCE SCALING TYPES
// ============================================================

export interface PerformanceTelemetryLogSpec {
  id: string;
  endpoint: string;
  method: string;
  statusCode: number;
  latencyMs: number;
  userId?: string | null;
  errorMessage?: string | null;
  createdAt: string;
}

export interface PerformanceHealthSummary {
  averageLatencyMs: number;
  p95LatencyMs: number;
  errorRate: number;
  totalRequests: number;
  healthStatus: 'healthy' | 'degraded' | 'critical';
}
