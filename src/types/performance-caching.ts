// ============================================================
// SHIKSHA SAHAYAK OS - PERFORMANCE, SCALABILITY & CACHING TYPES
// ============================================================

/** 5 Master Cache Tiers */
export type CacheTier =
  | 'browser'
  | 'cdn_edge'
  | 'kv_memory'
  | 'api_response'
  | 'database_index';

/** Standardized Cache-Control Header Specification */
export interface CacheControlSpec {
  maxAge: number;
  sMaxAge: number;
  isPublic: boolean;
  staleWhileRevalidate?: number;
}

/** Edge Performance & Latency Telemetry Metric */
export interface PerformanceMetricsSpec {
  id: string;
  endpointPath: string;
  avgTtfbMs: number;
  cacheHitRate: number; // 0.0 to 100.0%
  requestCount: number;
  updatedAt: string;
}

/** Cache Invalidation Log Record */
export interface CacheInvalidationLogEntry {
  id: string;
  cacheZone: 'cdn_edge' | 'worker_kv' | 'api_response' | 'metadata' | 'search_index';
  targetKey: string;
  purgeReason: string;
  createdAt: string;
}

/** Core Web Vitals Target Ranges */
export interface CoreWebVitalsTargets {
  lcpMs: number; // Target: < 1200ms
  inpMs: number; // Target: < 100ms
  clsScore: number; // Target: < 0.05
  ttfbMs: number; // Target: < 50ms
}
