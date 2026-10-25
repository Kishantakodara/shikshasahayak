// ============================================================
// SHIKSHA SAHAYAK OS - FRONTEND BACKEND ARCHITECTURE API CLIENT
// ============================================================

import {
  BackendServiceSpec,
  RepositorySpec,
  BackendHealthReport,
  BackendLayer,
} from "../types/backend-architecture";

/**
 * Fetches master 6-layer backend architectural catalog and service list.
 */
export async function fetchBackendArchitectureCatalog(): Promise<{
  title: string;
  version: string;
  totalLayers: number;
  totalServices: number;
  totalRepositories: number;
  layers: Array<{ name: BackendLayer; description: string }>;
  services: BackendServiceSpec[];
  repositories: RepositorySpec[];
} | null> {
  try {
    const res = await fetch("/api/backend/spec");
    if (!res.ok) {
      throw new Error(`Failed to fetch backend architecture catalog (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error in BackendArchitectureClient.fetchBackendArchitectureCatalog:", error);
    return null;
  }
}

/**
 * Fetches backend layer health diagnostics, repository performance, and telemetry.
 */
export async function fetchBackendHealthReport(): Promise<BackendHealthReport | null> {
  try {
    const res = await fetch("/api/backend/health");
    if (!res.ok) {
      throw new Error(`Failed to fetch backend health report (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error in BackendArchitectureClient.fetchBackendHealthReport:", error);
    return null;
  }
}
