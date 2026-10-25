// ============================================================
// SHIKSHA SAHAYAK OS - FRONTEND PERFORMANCE API CLIENT
// ============================================================

import {
  PerformanceMetricsSpec,
  CoreWebVitalsTargets,
} from "../types/performance-caching";

/**
 * Fetches real-time edge performance metrics, latency, and cache hit rates.
 */
export async function fetchPerformanceMetricsReport(): Promise<{
  timestamp: string;
  targets: CoreWebVitalsTargets;
  overallCacheHitRate: number;
  avgSystemTtfbMs: number;
  endpoints: PerformanceMetricsSpec[];
} | null> {
  try {
    const res = await fetch("/api/performance/metrics");
    if (!res.ok) {
      throw new Error(`Failed to fetch performance metrics report (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error in PerformanceCachingClient.fetchPerformanceMetricsReport:", error);
    return null;
  }
}

/**
 * Purges an edge cache key and logs the invalidation event.
 */
export async function purgeEdgeCacheKey(
  targetKey: string,
  purgeReason: string,
  cacheZone = "cdn_edge"
): Promise<boolean> {
  try {
    const res = await fetch("/api/performance/invalidation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetKey, purgeReason, cacheZone }),
    });
    return res.ok;
  } catch (error) {
    console.error("Error in PerformanceCachingClient.purgeEdgeCacheKey:", error);
    return false;
  }
}
