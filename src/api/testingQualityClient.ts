// ============================================================
// SHIKSHA SAHAYAK OS - FRONTEND TESTING & QUALITY API CLIENT
// ============================================================

import {
  QualityOverviewReport,
  TechnicalDebtEntry,
} from "../types/testing-quality";

/**
 * Fetches quality assurance overview report, quality gates status, and test metrics.
 */
export async function fetchQualityOverviewReport(): Promise<QualityOverviewReport | null> {
  try {
    const res = await fetch("/api/quality/metrics");
    if (!res.ok) {
      throw new Error(`Failed to fetch quality overview report (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error in TestingQualityClient.fetchQualityOverviewReport:", error);
    return null;
  }
}

/**
 * Fetches open technical debt registry and refactoring roadmap.
 */
export async function fetchOpenTechnicalDebt(): Promise<TechnicalDebtEntry[]> {
  try {
    const res = await fetch("/api/quality/debt");
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error in TestingQualityClient.fetchOpenTechnicalDebt:", error);
    return [];
  }
}

/**
 * Logs a new technical debt entry into D1 database.
 */
export async function logTechnicalDebtItem(
  moduleKey: string,
  title: string,
  description: string,
  severity = "medium",
  refactoringEffortDays = 1.0
): Promise<boolean> {
  try {
    const res = await fetch("/api/quality/debt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        moduleKey,
        title,
        description,
        severity,
        refactoringEffortDays,
      }),
    });
    return res.ok;
  } catch (error) {
    console.error("Error in TestingQualityClient.logTechnicalDebtItem:", error);
    return false;
  }
}
