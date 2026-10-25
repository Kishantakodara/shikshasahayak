// ============================================================
// SHIKSHA SAHAYAK OS - FRONTEND ENTERPRISE DATABASE API CLIENT
// ============================================================

import {
  EnterpriseSchemaOverview,
  DatabaseHealthDiagnosticsReport,
} from "../types/enterprise-db";

/**
 * Fetches the complete enterprise schema overview (ER diagram metadata and tables).
 */
export async function fetchEnterpriseSchemaOverview(): Promise<EnterpriseSchemaOverview | null> {
  try {
    const res = await fetch("/api/db/schema");
    if (!res.ok) {
      throw new Error(`Failed to fetch database schema overview (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error in EnterpriseDbClient.fetchEnterpriseSchemaOverview:", error);
    return null;
  }
}

/**
 * Fetches database record count statistics across all 10 enterprise domains.
 */
export async function fetchEnterpriseDbStats(): Promise<{
  database: string;
  version: string;
  totalTables: number;
  domainStats: Array<{
    domainName: string;
    tablesCount: number;
    totalRecords: number;
    tables: Array<{ name: string; count: number }>;
  }>;
} | null> {
  try {
    const res = await fetch("/api/db/stats");
    if (!res.ok) {
      throw new Error(`Failed to fetch database stats (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error in EnterpriseDbClient.fetchEnterpriseDbStats:", error);
    return null;
  }
}

/**
 * Fetches database health diagnostics and integrity report.
 */
export async function fetchDatabaseHealthDiagnostics(): Promise<DatabaseHealthDiagnosticsReport | null> {
  try {
    const res = await fetch("/api/db/health");
    if (!res.ok) {
      throw new Error(`Failed to fetch database health report (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error in EnterpriseDbClient.fetchDatabaseHealthDiagnostics:", error);
    return null;
  }
}
