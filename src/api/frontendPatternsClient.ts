// ============================================================
// SHIKSHA SAHAYAK OS - FRONTEND DESIGN PATTERNS API CLIENT
// ============================================================

import {
  FrontendPatternsOverview,
  DesignTokenSpec,
} from "../types/frontend-patterns";

/**
 * Fetches UI design patterns catalog and 5-level component hierarchy.
 */
export async function fetchFrontendPatternsOverview(): Promise<FrontendPatternsOverview | null> {
  try {
    const res = await fetch("/api/frontend/patterns");
    if (!res.ok) {
      throw new Error(`Failed to fetch frontend patterns overview (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error in FrontendPatternsClient.fetchFrontendPatternsOverview:", error);
    return null;
  }
}

/**
 * Fetches design system tokens and Tailwind CSS variable mappings.
 */
export async function fetchDesignTokensCatalog(): Promise<DesignTokenSpec[]> {
  try {
    const res = await fetch("/api/frontend/tokens");
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error in FrontendPatternsClient.fetchDesignTokensCatalog:", error);
    return [];
  }
}
