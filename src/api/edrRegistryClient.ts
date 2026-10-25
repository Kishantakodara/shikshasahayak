// ============================================================
// SHIKSHA SAHAYAK OS - FRONTEND ENGINEERING DECISION RECORDS API CLIENT
// ============================================================

import {
  EdrRecordSpec,
  EdrQueryFilter,
  EdrHealthReport,
} from "../types/edr-registry";

/**
 * Fetches Engineering Decision Records catalog with optional filtering.
 */
export async function fetchEdrList(
  filters: EdrQueryFilter = {}
): Promise<EdrRecordSpec[]> {
  try {
    const urlParams = new URLSearchParams();
    if (filters.status) urlParams.set("status", filters.status);
    if (filters.searchQuery) urlParams.set("q", filters.searchQuery);

    const res = await fetch(`/api/edr?${urlParams.toString()}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error in EdrRegistryClient.fetchEdrList:", error);
    return [];
  }
}

/**
 * Fetches a specific Engineering Decision Record by EDR code with alternative analysis.
 */
export async function fetchEdrByCode(
  edrCode: string
): Promise<EdrRecordSpec | null> {
  try {
    const res = await fetch(`/api/edr/${encodeURIComponent(edrCode)}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch EDR record (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error in EdrRegistryClient.fetchEdrByCode:", error);
    return null;
  }
}

/**
 * Fetches EDR governance health diagnostics and review metrics.
 */
export async function fetchEdrHealthReport(): Promise<EdrHealthReport | null> {
  try {
    const res = await fetch("/api/edr/health");
    if (!res.ok) {
      throw new Error(`Failed to fetch EDR health report (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error in EdrRegistryClient.fetchEdrHealthReport:", error);
    return null;
  }
}
