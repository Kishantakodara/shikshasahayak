// ============================================================
// SHIKSHA SAHAYAK OS - FRONTEND SECURITY ARCHITECTURE API CLIENT
// ============================================================

import {
  SecurityOverviewReport,
  SecurityHeaderSpec,
} from "../types/security-architecture";

/**
 * Fetches security overview report, active rate limit rules, and recent audit events.
 */
export async function fetchSecurityOverviewReport(): Promise<SecurityOverviewReport | null> {
  try {
    const res = await fetch("/api/security/audit");
    if (!res.ok) {
      throw new Error(`Failed to fetch security overview report (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error in SecurityArchitectureClient.fetchSecurityOverviewReport:", error);
    return null;
  }
}

/**
 * Fetches active HTTP security headers and Content Security Policy directives.
 */
export async function fetchActiveSecurityHeaders(): Promise<SecurityHeaderSpec | null> {
  try {
    const res = await fetch("/api/security/headers");
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Error in SecurityArchitectureClient.fetchActiveSecurityHeaders:", error);
    return null;
  }
}
