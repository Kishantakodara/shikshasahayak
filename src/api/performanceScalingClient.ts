// ============================================================
// SHIKSHA SAHAYAK OS - FRONTEND PERFORMANCE SCALING CLIENT
// ============================================================

import {
  PerformanceHealthSummary,
} from "../types/performance-scaling";

/**
 * Fetches platform performance health summary (avg latency, error rate, status).
 */
export async function fetchPerformanceHealthSummary(): Promise<PerformanceHealthSummary | null> {
  try {
    const res = await fetch("/api/performance/telemetry");
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Error in PerformanceScalingClient.fetchPerformanceHealthSummary:", error);
    return null;
  }
}

/**
 * Records a client-side API performance telemetry event.
 * Call this after any fetch to track real-user latency metrics.
 */
export async function recordClientTelemetry(
  endpoint: string,
  latencyMs: number,
  statusCode = 200,
  userId?: string,
  errorMessage?: string
): Promise<void> {
  try {
    // Fire-and-forget — never block user flow on telemetry
    fetch("/api/performance/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint, latencyMs, statusCode, userId, errorMessage }),
    }).catch(() => {/* swallow telemetry errors silently */});
  } catch {
    // Silently swallow — telemetry must never surface to users
  }
}
